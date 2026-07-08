import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { RbacModule } from './rbac/rbac.module.js';
import { DepartmentsModule } from './department/department.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    RbacModule,
    AuthModule,
    UsersModule,
    MailModule,
    InvitationsModule,
    DepartmentsModule,
  ],
})
export class AppModule {}
