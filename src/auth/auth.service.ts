
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from '../utils/bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';
import { MailService } from '../mail/mail.service.js';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // IAM-001: User Registration
  // ═══════════════════════════════════════════════════════════════

  /**
   * Register a new user account
   * - Creates user with pending status
   * - Generates activation token
   * - Sends activation email
   * Story: IAM-001
   */
  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Create user (pending status)
    const user = await this.usersService.create({
      ...registerDto,
    });

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    user.activationToken = activationToken;
    user.isActive = false;

    await this.usersService.save(user);
    
    // Send activation email
    await this.mailService.sendStudentActivation(user, activationToken);

    return {
      message: 'Registration successful. Please check your email to activate your account.',
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // IAM-002: Account Activation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Activate user account using email token
   * - Validates token
   * - Activates account
   * - Clears activation token
   * Story: IAM-002
   */
  async activateAccount(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Activation token is required');
    }

    const user = await this.usersService.findByActivationToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid activation token');
    }

    user.isActive = true;
    user.activationToken = '';
    user.emailVerifiedAt = new Date();

    await this.usersService.save(user);

    return { message: 'Account activated successfully' };
  }

  /**
   * Resend activation email
   * - Generates new token
   * - Sends new email
   * Story: IAM-002 (Alternative Flow)
   */
  async resendActivation(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already activated');
    }

    // Generate new token
    const activationToken = crypto.randomBytes(32).toString('hex');
    user.activationToken = activationToken;
    await this.usersService.save(user);

    // Resend email
    await this.mailService.sendStudentActivation(user, activationToken);

    return { message: 'Activation email resent successfully. Please check your inbox.' };
  }

  // ═══════════════════════════════════════════════════════════════
  // IAM-003: User Login
  // ═══════════════════════════════════════════════════════════════

  /**
   * Authenticate user and issue JWT tokens
   * - Validates credentials
   * - Checks account status
   * - Updates last login timestamp
   * - Returns access + refresh tokens
   * Story: IAM-003
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Validate user exists and has password
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (!user.isActive) {
      throw new UnauthorizedException('Please activate your account before logging in');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersService.save(user);

    // Generate tokens
    return this.generateTokens({
      sub: user.id,
      email: user.email,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // IAM-004: Token Refresh
  // ═══════════════════════════════════════════════════════════════

  /**
   * Refresh access token using refresh token
   * - Validates refresh token
   * - Issues new access + refresh tokens
   * Story: IAM-004
   */
  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);

      return this.generateTokens({
        sub: user.id,
        email: user.email,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // IAM-005: Password Reset (Forgot Password)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Request password reset
   * - Generates reset token
   * - Sends reset email
   * Story: IAM-005
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Security: Don't reveal if email exists or not
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    // Generate reset token (expires in 1 hour)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.usersService.setResetToken(user.id, token, expiresAt);
    await this.mailService.sendPasswordReset(user, token);

    return { message: 'If an account exists, a reset link has been sent.' };
  }


  /**
   * Reset password using token
   * - Validates token
   * - Validates password confirmation
   * - Hashes new password
   * - Clears reset token
   * Story: IAM-005
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Validate passwords match
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user by valid reset token
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    user.password = await bcrypt.hash(dto.password, 12);
    
    // Clear reset token (set to null/expired)
    user.resetPasswordToken = '';
    user.resetPasswordExpiresAt = new Date(0); // Epoch = expired

    await this.usersService.save(user);

    return { message: 'Password reset successfully. You can now login.' };
  }

  // ═══════════════════════════════════════════════════════════════
  // IAM-006: Token Generation (Private Helper)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate access and refresh tokens
   * - Signs JWT with configured secrets
   * - Uses configured expiration times
   * Private helper for all auth flows
   */
  private generateTokens(payload: JwtPayload): AuthResponseDto {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION')!;
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION')!;

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration as any,
    });

    return { accessToken, refreshToken };
  }
}