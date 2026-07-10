import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { databaseConfig } from './config/database.config.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { InvitationsModule } from './invitations/invitations.module.js';
import { RbacModule } from './rbac/rbac.module.js';
import { DepartmentsModule } from './departments/department.module.js';
import { CommonModule } from './common/common.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { BlockchainModule } from './blockchain/blockchain.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    CommonModule,
    RbacModule,
    AuthModule,
    UsersModule,
    MailModule,
    InvitationsModule,
    DepartmentsModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
