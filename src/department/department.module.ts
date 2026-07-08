import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../department/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { DepartmentsService } from './department.service';
import { DepartmentsController } from './department.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Department, User])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}