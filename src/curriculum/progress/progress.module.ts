import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressTracking } from '../entities/progress-tracking.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';
import { Lesson } from '../entities/lesson.entity';
import { Quiz } from '../entities/quiz.entity';
import { Course } from '../../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressTracking, QuizAttempt, Lesson, Quiz, Course])],
  controllers: [ProgressController],
  providers: [ProgressService]
})
export class ProgressModule {}
