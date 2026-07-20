import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuizDto } from '../dto/update-quiz.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
@ApiBearerAuth()
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

  @Get('courses/:courseId/quizzes')
  @RequirePermissions('course.view')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.quizzesService.findAllByCourse(courseId);
  }

  @Get('quizzes/:quizId/questions')
  @RequirePermissions('course.view')
  findQuestionsByQuiz(@Param('quizId') quizId: string) {
    return this.quizzesService.findQuestionsByQuiz(quizId);
  }

  @Put('quizzes/:id')
  @RequirePermissions('quiz.update')
  updateQuiz(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateQuizDto: UpdateQuizDto
  ) {
    return this.quizzesService.updateQuiz(id, userId, updateQuizDto);
  }

  @Delete('quizzes/:id')
  @RequirePermissions('quiz.delete')
  removeQuiz(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.quizzesService.removeQuiz(id, userId);
  }

  @Put('questions/:id')
  @RequirePermissions('question.update')
  updateQuestion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateQuestionDto: UpdateQuestionDto
  ) {
    return this.quizzesService.updateQuestion(id, userId, updateQuestionDto);
  }

  @Delete('questions/:id')
  @RequirePermissions('question.delete')
  removeQuestion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.quizzesService.removeQuestion(id, userId);
  }
}
