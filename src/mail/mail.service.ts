import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly host: string;

  constructor(private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {
    this.host = this.configService.get<string>('HOST') || 'http://localhost:3000';
  }

  async sendStudentActivation(user: User, token: string): Promise<void> {
    const activationLink = `${this.host}/api/v1/auth/activate?token=${token}`;

    try {
      const info = await this.mailerService.sendMail({
        to: user.email,
        subject: 'Welcome to Edu3! Please activate your account',
        text: `Hi ${user.firstName},\n\nPlease click the link below to activate your account:\n${activationLink}`,
        html: `<p>Hi ${user.firstName},</p><p>Please click the link below to activate your account:</p><p><a href="${activationLink}">Activate Account</a></p>`,
      });
      this.logger.log(`Activation email sent to ${user.email}`);
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error(`Error sending activation email to ${user.email}`, error);
    }
  }

  async sendRoleInvitation(user: User, token: string): Promise<void> {
    // We point this to the GET endpoint so clicking it in a browser returns the invitation details.
    const invitationLink = `${this.host}/api/v1/invitations/${token}`;

    try {
      const info = await this.mailerService.sendMail({
        to: user.email,
        subject: 'You have been invited to Edu3',
        text: `Hi ${user.firstName},\n\nYou have been invited as a ${user.role?.name || 'user'}. Please click the link below to accept your invitation and set up your password:\n${invitationLink}`,
        html: `<p>Hi ${user.firstName},</p><p>You have been invited as a ${user.role?.name || 'user'}. Please click the link below to accept your invitation and set up your password:</p><p><a href="${invitationLink}">Accept Invitation</a></p>`,
      });
      this.logger.log(`Invitation email sent to ${user.email}`);
      this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      this.logger.error(`Error sending invitation email to ${user.email}`, error);
    }
  }
}
