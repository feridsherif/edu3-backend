import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { MailModule } from './mail/mail.module.js';
import { InvitationsModule } from './invitations/invitations.module';
import { RbacModule } from './rbac/rbac.module.js';

import { DepartmentsModule } from './departments/department.module';
import { CommonModule } from './common/common.module';
import { CoursesModule } from './courses/courses.module';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CurriculumModule } from './curriculum/curriculum.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    CommonModule,
    RbacModule,
    AuthModule,
    UsersModule,
    MailModule,
    InvitationsModule,
    DepartmentsModule,
    CoursesModule,
    CurriculumModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
