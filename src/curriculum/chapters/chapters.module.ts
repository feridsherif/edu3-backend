import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';
import { Chapter } from '../entities/chapter.entity';
import { Course } from '../../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter, Course])],
  controllers: [ChaptersController],
  providers: [ChaptersService]
})
export class ChaptersModule {}
