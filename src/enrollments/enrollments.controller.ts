import { Controller, Post, Get, Delete, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class EnrollmentsController {
    constructor(private readonly enrollmentsService: EnrollmentsService) { }

    @Post('courses/:courseId/enroll')
    @RequirePermissions('course.enroll')
    @ApiOperation({ summary: 'Enroll in a course' })
    enroll(@Param('courseId') courseId: string, @Req() request: any) {
        return this.enrollmentsService.enroll(courseId, request.user);
    }

    @Get('enrollments')
    @RequirePermissions('enrollment.view.own')
    @ApiOperation({ summary: 'View my enrollments' })
    findMyEnrollments(@Req() request: any) {
        return this.enrollmentsService.findMyEnrollments(request.user);
    }

    @Get('courses/:courseId/enrollments')
    @RequirePermissions('enrollment.view')
    @ApiOperation({ summary: 'View course enrollments' })
    findCourseEnrollments(@Param('courseId') courseId: string, @Req() request: any) {
        return this.enrollmentsService.findCourseEnrollments(courseId, request.user);
    }

    @Get('enrollments/:id')
    @RequirePermissions('enrollment.detail.view')
    @ApiOperation({ summary: 'View enrollment details' })
    findOne(@Param('id') id: string, @Req() request: any) {
        return this.enrollmentsService.findOneFor(id, request.user);
    }

    @Delete('enrollments/:id')
    @RequirePermissions('course.unenroll')
    @ApiOperation({ summary: 'Cancel enrollment' })
    cancelEnrollment(@Param('id') id: string, @Req() request: any) {
        return this.enrollmentsService.cancelEnrollment(id, request.user);
    }

    @Patch('enrollments/:id/suspend')
    @RequirePermissions('enrollment.suspend')
    @ApiOperation({ summary: 'Suspend enrollment' })
    suspendEnrollment(@Param('id') id: string) {
        return this.enrollmentsService.updateStatus(id, 'Suspended');
    }

    @Patch('enrollments/:id/resume')
    @RequirePermissions('enrollment.resume')
    @ApiOperation({ summary: 'Resume enrollment' })
    resumeEnrollment(@Param('id') id: string) {
        return this.enrollmentsService.updateStatus(id, 'Active');
    }
}
