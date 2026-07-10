import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.usersService.create({
      ...registerDto,
    });

    const activationToken = crypto.randomBytes(32).toString('hex');
    user.activationToken = activationToken;
    user.isActive = false;

    await this.usersService.save(user);
    await this.mailService.sendStudentActivation(user, activationToken);

    return { message: 'Registration successful. Please check your email to activate your account.' };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Please activate your account before logging in');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.usersService.save(user);

    return this.generateTokens({
      sub: user.id,
      email: user.email,
    });
  }

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

  async activateAccount(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByActivationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid activation token');
    }

    user.isActive = true;
    user.activationToken = ''; // Use empty string or null depending on how it's defined, but string is better if null is an issue. Since it's nullable, we can use null.
    // Wait, the column is string. If strictNullChecks is on, might need to handle correctly. Let's use '' or null. Wait, user.entity says `activationToken: string`. So I'll set it to '' or `null as any`. Let's just cast or if `User` has it nullable, use `null`. The entity has it `string`.
    user.activationToken = '';

    await this.usersService.save(user);

    return { message: 'Account activated successfully' };
  }

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
