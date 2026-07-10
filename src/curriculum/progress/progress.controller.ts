import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) { }

  // CUR-008: Mark a lesson as complete
  @Post('lessons/:id/complete')
  @RequirePermissions('lesson.complete')
  @ApiOperation({ summary: 'Mark a lesson as complete (sequential – previous lesson must be done)' })
  completeLesson(
    @Param('id') lessonId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.progressService.completeLesson(lessonId, studentId);
  }

  // CUR-009: Get course progress for the authenticated student
  @Get('courses/:courseId/progress')
  @RequirePermissions('progress.view')
  @ApiOperation({
    summary: 'Get course progress for the current student (CUR-009)',
    description:
      'Returns total/completed lessons, percentage progress, quiz passed status, and overall course completion flag.',
  })
  getCourseProgress(
    @Param('courseId') courseId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.progressService.getCourseProgress(courseId, studentId);
  }
}
