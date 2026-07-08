import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service.js';
import { InvitationsController } from './invitations.controller.js';
import { UserInvitation } from './entities/user-invitation.entity.js';
import { UsersModule } from '../users/users.module.js';
import { DepartmentsModule } from '../department/department.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserInvitation]),
    UsersModule,
    DepartmentsModule
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
