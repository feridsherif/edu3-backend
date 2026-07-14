
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectQueue('email') private readonly emailQueue: Queue, 
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  // Send raw email via queue
  async sendRawEmail(data: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
   // sends actual email
    await this.mailerService.sendMail(data);
  }

  //  Queue email for sending
  async queueEmail(data: {
    to: string;
    subject: string;
    text: string;
    html: string;
    type: string; // 'activation' | 'invitation' | 'reset'
  }): Promise<void> {
    await this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async sendStudentActivation(user: User, token: string): Promise<void> {
    const activationLink = `${this.frontendUrl}/auth/activate?token=${token}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h1 style="color: #4F46E5;">Welcome to Edu3! 🎓</h1>
        <p>Hi <strong>${user.firstName}</strong>,</p>
        <p>Thank you for registering! Click the button below to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="display: inline-block; padding: 12px 30px; background: #4F46E5; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Activate Account
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in <strong>24 hours</strong>.</p>
      </div>
    `;

    //  Queue email (non-blocking)
    await this.queueEmail({
      to: user.email,
      subject: 'Welcome to Edu3! Please activate your account',
      text: `Hi ${user.firstName},\n\nPlease click the link below to activate your account:\n${activationLink}`,
      html,
      type: 'activation',
    });

    this.logger.log(` Activation email queued for ${user.email}`);
  }

  async sendRoleInvitation(user: User, token: string): Promise<void> {
    const invitationLink = `${this.frontendUrl}/invitations/accept?token=${token}`;
    const roleName = user.role?.name || 'user';

    //  Queue email (non-blocking)
    await this.queueEmail({
      to: user.email,
      subject: `You've been invited to Edu3 as a ${roleName}`,
      text: `Hi ${user.firstName},\n\nYou have been invited as a ${roleName}. Please click the link below to accept your invitation:\n${invitationLink}`,
      html: `
        <h1>You're Invited! 🎉</h1>
        <p>Hi <strong>${user.firstName}</strong>,</p>
        <p>You have been invited to join <strong>Edu3</strong> as a <strong>${roleName}</strong>.</p>
        <a href="${invitationLink}">Accept Invitation</a>
      `,
      type: 'invitation',
    });

    this.logger.log(` Invitation email queued for ${user.email}`);
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    await this.queueEmail({
      to: user.email,
      subject: 'Reset your Edu3 password',
      text: `Hi ${user.firstName},\n\nClick the link below to reset your password:\n${resetLink}`,
      html: `
        <h1>Reset Password </h1>
        <p>Hi <strong>${user.firstName}</strong>,</p>
        <a href="${resetLink}">Reset Password</a>
      `,
      type: 'reset',
    });

    this.logger.log(` Password reset email queued for ${user.email}`);
  }
}