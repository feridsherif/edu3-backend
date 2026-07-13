import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LearningService } from './learning.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { ProgressService } from '../curriculum/progress/progress.service.js';

@ApiTags('Learning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class LearningController {
    constructor(
        private readonly learningService: LearningService,
        private readonly progressService: ProgressService
    ) { }

    // LRN-001: Access Learning Dashboard
    @Get('learning/:courseId')
    @RequirePermissions('learning.view')
    @ApiOperation({ summary: 'Access Learning Dashboard' })
    getDashboard(@Param('courseId') courseId: string, @Req() request: any) {
        return this.learningService.getDashboard(courseId, request.user.id || request.user.sub);
    }

    // LRN-002: View Lesson
    @Get('lessons/:lessonId')
    @RequirePermissions('lesson.view')
    @ApiOperation({ summary: 'View specific lesson' })
    getLesson(@Param('lessonId') lessonId: string, @Req() request: any) {
        return this.learningService.getLesson(lessonId, request.user.id || request.user.sub);
    }

    // LRN-004: View Learning Progress (by enrollment)
    @Get('enrollments/:id/progress')
    @RequirePermissions('progress.view')
    @ApiOperation({ summary: 'View learning progress' })
    getProgressByEnrollment(@Param('id') id: string, @Req() request: any) {
        return this.learningService.getProgressByEnrollment(id, request.user.id || request.user.sub);
    }

    // LRN-005: Take Quiz
    @Post('quizzes/:quizId/attempt')
    @RequirePermissions('quiz.attempt')
    @ApiOperation({ summary: 'Attempt quiz' })
    startQuiz(@Param('quizId') quizId: string, @Req() request: any) {
        return this.learningService.startQuiz(quizId, request.user.id || request.user.sub);
    }

    // LRN-006: Submit Quiz
    @Post('quizzes/:quizId/submit')
    @RequirePermissions('quiz.submit')
    @ApiOperation({ summary: 'Submit quiz' })
    submitQuiz(
        @Param('quizId') quizId: string,
        @Body() dto: SubmitQuizDto,
        @Req() request: any
    ) {
        return this.learningService.submitQuiz(quizId, request.user.id || request.user.sub, dto);
    }

    // LRN-007: View Quiz Results
    @Get('quiz-attempts/:id')
    @RequirePermissions('quiz.result.view')
    @ApiOperation({ summary: 'View Quiz Results' })
    getQuizResult(@Param('id') attemptId: string, @Req() request: any) {
        return this.learningService.getQuizResult(attemptId, request.user.id || request.user.sub);
    }

    // LRN-009: View Student Progress (by course)
    @Get('courses/:courseId/progress')
    @RequirePermissions('progress.view.students')
    @ApiOperation({ summary: 'View student progress' })
    getCourseProgress(@Param('courseId') courseId: string, @Req() request: any) {
        return this.learningService.getStudentsProgress(courseId, request.user.id || request.user.sub);
    }
}
