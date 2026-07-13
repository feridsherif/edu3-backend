
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    this.logger.log(` Mail service initialized (${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'})`);
    this.logger.log(` Frontend URL: ${this.frontendUrl}`);
  }

  async sendStudentActivation(user: User, token: string): Promise<void> {
    const activationLink = `${this.frontendUrl}/auth/activate?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Edu3! Please activate your account',
        text: `Hi ${user.firstName},\n\nPlease click the link below to activate your account:\n${activationLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #4F46E5;">Welcome to Edu3! 🎓</h1>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>Thank you for registering! Please click the button below to activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationLink}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Activate Account
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link expires in <strong>24 hours</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't register for Edu3, please ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(` Activation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(` Error sending activation email to ${user.email}`, error);
      throw error;
    }
  }

  async sendRoleInvitation(user: User, token: string): Promise<void> {
    const invitationLink = `${this.frontendUrl}/invitations/accept?token=${token}`;
    const roleName = user.role?.name || 'user';

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `You've been invited to Edu3 as a ${roleName}`,
        text: `Hi ${user.firstName},\n\nYou have been invited as a ${roleName}. Please click the link below to accept your invitation and set up your password:\n${invitationLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #4F46E5;">You're Invited! 🎉</h1>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>You have been invited to join <strong>Edu3</strong> as a <strong>${roleName}</strong>.</p>
            <p>Click the button below to accept your invitation and set up your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link expires in <strong>7 days</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this invitation, please ignore this email.</p>
          </div>
        `,
      });

      this.logger.log(` Invitation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(` Error sending invitation email to ${user.email}`, error);
      throw error;
    }
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Reset your Edu3 password',
        text: `Hi ${user.firstName},\n\nClick the link below to reset your password:\n${resetLink}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #4F46E5;">Reset Password 🔑</h1>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link expires in <strong>1 hour</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(` Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(` Error sending password reset email to ${user.email}`, error);
      throw error;
    }
  }
}