import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { InvitationsModule } from './invitations/invitations.module';
import { RbacModule } from './rbac/rbac.module';

import { DepartmentsModule } from './departments/department.module';
import { CommonModule } from './common/common.module';
import { CoursesModule } from './courses/courses.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CurriculumModule } from './curriculum/curriculum.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';

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
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
