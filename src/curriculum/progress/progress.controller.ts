import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('lessons/:id/complete')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @RequirePermissions('lesson.complete') // Or just open to enrolled students, based on RBAC rules.
  completeLesson(
    @Param('id') lessonId: string,
    @CurrentUser('id') studentId: string,
  ) {
    return this.progressService.completeLesson(lessonId, studentId);
  }
}
