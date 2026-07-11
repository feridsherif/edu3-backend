import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ActivateDto } from './dto/activate-account.dto.js';
import { ResendActivationTokenDto } from './dto/resend-activation-token.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Please check your email to activate your account.',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() registerDto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(registerDto);
  }


  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate user account using email token' })
  @ApiResponse({
    status: 200,
    description: 'Account activated successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid activation token' })
  activate(@Body() activateDto: ActivateDto): Promise<{ message: string }> {
    return this.authService.activateAccount(activateDto.token);
  }

  @Post('resend-activation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend activation token to user email' })
  @ApiResponse({
    status: 200,
    description: 'Activation token resent successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Account is already activated' })
  resendActivation(@Body() resendDto: ResendActivationTokenDto): Promise<{ message: string }> {
    return this.authService.resendActivation(resendDto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }
}
