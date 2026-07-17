import { Controller, Post, Get, Body, Param, Put, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('chapters/:chapterId/lessons')
  @RequirePermissions('lesson.create')
  create(
    @Param('chapterId') chapterId: string,
    @CurrentUser('id') userId: string,
    @Body() createLessonDto: CreateLessonDto
  ) {
    return this.lessonsService.create(chapterId, userId, createLessonDto);
  }

  @Put('lessons/:id')
  @RequirePermissions('lesson.update')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateLessonDto: UpdateLessonDto
  ) {
    return this.lessonsService.update(id, userId, updateLessonDto);
  }

  @Delete('lessons/:id')
  @RequirePermissions('lesson.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.lessonsService.remove(id, userId);
  }

  @Get('chapters/:chapterId/lessons')
  @RequirePermissions('course.view')
  findAllByChapter(@Param('chapterId') chapterId: string) {
    return this.lessonsService.findAllByChapter(chapterId);
  }
}
