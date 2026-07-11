import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './entities/course.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { DepartmentsModule } from '../departments/department.module';
import { CommonModule } from '../common/common.module';
import { Chapter } from '../curriculum/entities/chapter.entity';
import { Lesson } from '../curriculum/entities/lesson.entity';
import { Quiz } from '../curriculum/entities/quiz.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Chapter, Lesson, Quiz]),
    DepartmentsModule,
    CommonModule,
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule { }
