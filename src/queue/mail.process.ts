
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { Logger } from '@nestjs/common';

@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing email job ${job.id} for ${job.data.to}`);

    try {
      const { to, subject, text, html, type } = job.data;

      await this.mailService.sendRawEmail({
        to,
        subject,
        text,
        html,
      });

      this.logger.log(` Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(` Failed to send email to ${job.data.to}`, error);
      throw error; // BullMQ will retry
    }
  }
}