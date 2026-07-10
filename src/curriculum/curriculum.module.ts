import { Module } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { ChaptersModule } from './chapters/chapters.module';
import { LessonsModule } from './lessons/lessons.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  providers: [CurriculumService],
  controllers: [CurriculumController],
  imports: [ChaptersModule, LessonsModule, QuizzesModule, ProgressModule]
})
export class CurriculumModule {}
