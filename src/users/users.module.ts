import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';
import { Department } from '../departments/entities/department.entity.js';
import { Role } from '../rbac/entities/role.entity.js';
import { InvitationsModule } from '../invitations/invitations.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department, Role]),
    forwardRef(() => InvitationsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
