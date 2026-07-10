// src/courses/courses.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  // CRS-001: Create Course
  @Post()
  @RequirePermissions('course.create')
  @ApiOperation({ summary: 'Create a new course (Draft status)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createDto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.create(createDto, user.id);
  }

  // CRS-010: View Course Catalog (role-filtered)
  @Get()
  @RequirePermissions('course.view')
  @ApiOperation({ summary: 'Get all courses (role-based filtering applies)' })
  findAll(@CurrentUser() user: any) {
    return this.coursesService.findAll(user);
  }

  // CRS-010: View single course
  @Get(':id')
  @RequirePermissions('course.view')
  @ApiOperation({ summary: 'Get a course by ID' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  // CRS-002: Update Course
  @Put(':id')
  @RequirePermissions('course.update')
  @ApiOperation({ summary: 'Update a course (Draft or Rejected only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.update(id, updateDto, user);
  }

  // CRS-003: Delete Course
  @Delete(':id')
  @RequirePermissions('course.delete')
  @ApiOperation({ summary: 'Soft-delete a course (Draft only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.remove(id, user);
  }

  // CRS-004: Submit for Review
  @Post(':id/submit')
  @RequirePermissions('course.submit')
  @ApiOperation({ summary: 'Submit course for review (Draft or Rejected → Pending Review)' })
  submitForReview(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.submitForReview(id, user);
  }

  // CRS-005: Review Course
  @Get(':id/review')
  @RequirePermissions('course.review')
  @ApiOperation({ summary: 'Get course details for review (same-department CM only)' })
  review(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.review(id, user);
  }

  // CRS-006: Approve Course
  @Patch(':id/approve')
  @RequirePermissions('course.approve')
  @ApiOperation({ summary: 'Approve a pending-review course' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.approve(id, user);
  }

  // CRS-007: Reject Course
  @Patch(':id/reject')
  @RequirePermissions('course.reject')
  @ApiOperation({ summary: 'Reject a pending-review course with mandatory comments' })
  reject(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.reject(id, comments, user);
  }

  // CRS-008: Publish Course
  @Patch(':id/publish')
  @RequirePermissions('course.publish')
  @ApiOperation({ summary: 'Publish an approved course' })
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coursesService.publish(id, user);
  }

  // CRS-009: Toggle Availability
  @Patch(':id/availability')
  @RequirePermissions('course.availability.update')
  @ApiOperation({ summary: 'Enable or disable enrollment for a published course' })
  toggleAvailability(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.coursesService.toggleAvailability(id, isActive, user);
  }
}