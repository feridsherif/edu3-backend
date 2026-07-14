import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service.js';
import { InvitationsController } from './invitations.controller.js';
import { UserInvitation } from './entities/user-invitation.entity.js';
import { UsersModule } from '../users/users.module.js';
import { DepartmentsModule } from '../departments/department.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInvitation]),
    forwardRef(() => UsersModule),
    DepartmentsModule,
    MailModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule { }
