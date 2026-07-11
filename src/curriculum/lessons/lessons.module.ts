import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { Lesson } from '../entities/lesson.entity';
import { Chapter } from '../entities/chapter.entity';
import { Course } from '../../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, Chapter, Course])],
  controllers: [LessonsController],
  providers: [LessonsService]
})
export class LessonsModule {}
