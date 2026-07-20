import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
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

  @Get()
  @RequirePermissions('course.view')
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.chaptersService.findAllByCourse(courseId);
  }

  @Get('with-lessons')
  @RequirePermissions('course.view')
  findAllByCourseWithLessons(@Param('courseId') courseId: string) {
    return this.chaptersService.findAllByCourseWithLessons(courseId);
  }

  @Put(':id')
  @RequirePermissions('chapter.update')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateChapterDto: UpdateChapterDto
  ) {
    return this.chaptersService.update(id, userId, updateChapterDto);
  }

  @Delete(':id')
  @RequirePermissions('chapter.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.chaptersService.remove(id, userId);
  }
}
