import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Course } from '../../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question, Answer, Course])],
  controllers: [QuizzesController],
  providers: [QuizzesService]
})
export class QuizzesModule {}
