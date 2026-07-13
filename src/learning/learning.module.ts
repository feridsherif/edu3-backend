import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningController } from './learning.controller.js';
import { LearningService } from './learning.service.js';
import { Enrollment } from '../enrollments/entities/enrollment.entity.js';
import { Lesson } from '../curriculum/entities/lesson.entity.js';
import { Chapter } from '../curriculum/entities/chapter.entity.js';
import { Quiz } from '../curriculum/entities/quiz.entity.js';
import { Question } from '../curriculum/entities/question.entity.js';
import { Answer } from '../curriculum/entities/answer.entity.js';
import { QuizAttempt } from '../curriculum/entities/quiz-attempt.entity.js';
import { ProgressModule } from '../curriculum/progress/progress.module.js';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Enrollment,
            Lesson,
            Chapter,
            Quiz,
            Question,
            Answer,
            QuizAttempt,
        ]),
        ProgressModule,
    ],
    controllers: [LearningController],
    providers: [LearningService],
    exports: [LearningService],
})
export class LearningModule { }
