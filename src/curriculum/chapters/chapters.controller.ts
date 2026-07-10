import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('courses/:courseId/chapters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @RequirePermissions('chapter.create')
  create(
    @Param('courseId') courseId: string,
    @CurrentUser('id') userId: string,
    @Body() createChapterDto: CreateChapterDto
  ) {
    return this.chaptersService.create(courseId, userId, createChapterDto);
  }
}
