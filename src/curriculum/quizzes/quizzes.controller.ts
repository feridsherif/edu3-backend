import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('courses/:courseId/quizzes')
  @RequirePermissions('quiz.create')
  createQuiz(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @Body() createQuizDto: CreateQuizDto
  ) {
    return this.quizzesService.createQuiz(courseId, userId, createQuizDto);
  }

  @Post('quizzes/:quizId/questions')
  @RequirePermissions('question.create')
  addQuestion(
    @Param('quizId') quizId: string,
    @CurrentUser('id') userId: string,
    @Body() createQuestionDto: CreateQuestionDto
  ) {
    return this.quizzesService.addQuestion(quizId, userId, createQuestionDto);
  }
}
