import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => InvitationsService))
    private readonly invitationsService: InvitationsService,
  ) { }

 

@Get('me')
@RequirePermissions('profile.view')
@ApiOperation({ summary: 'Get current user profile' })
@ApiResponse({ status: 200, description: 'User profile returned' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async getProfile(@CurrentUser() user: any) {
  return this.usersService.findMe(user.id);
}

  @Post('instructors')
  @RequirePermissions('user.instructor.create')
  @ApiOperation({ summary: 'Create an Instructor' })
  @ApiResponse({ status: 201, description: 'Instructor created and invitation sent' })
  createInstructor(@Body() createDto: CreateInvitationDto) {
    createDto.role = 'instructor';
    return this.invitationsService.createInvitation(createDto);
  }

  @Post('curriculum-managers')
  @RequirePermissions('user.curriculum_manager.create')
  @ApiOperation({ summary: 'Create a Curriculum Manager' })
  @ApiResponse({ status: 201, description: 'Curriculum Manager created and invitation sent' })
  createCurriculumManager(@Body() createDto: CreateInvitationDto) {
    createDto.role = 'curriculum_manager';
    return this.invitationsService.createInvitation(createDto);
  }

  @Get()
  @RequirePermissions('user.view')
  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: 200, description: 'List of users based on permissions' })
  findAll(@Req() request) {
    return this.usersService.findUsersFor(request.user);
  }

  @Get(':id')
  @RequirePermissions('user.view')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() request) {
    return this.usersService.findOneFor(id, request.user);
  }

  @Patch(':id')
  @RequirePermissions('user.update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request
  ) {
    return this.usersService.updateUser(id, updateUserDto, request.user);
  }

  @Patch(':id/status')
  @RequirePermissions('user.status.update')
  @ApiOperation({ summary: 'Activate/Deactivate User' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: boolean,
  ) {
    return this.usersService.updateStatus(id, status);
  }

  @Patch(':id/department')
  @RequirePermissions('user.department.assign')
  @ApiOperation({ summary: 'Assign or Transfer Department' })
  assignDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('departmentId', ParseUUIDPipe) departmentId: string,
  ) {
    return this.usersService.assignDepartment(id, departmentId);
  }

  @Post(':id/resend-invitation')
  @RequirePermissions('user.invitation.resend')
  @ApiOperation({ summary: 'Resend Invitation' })
  resendInvitation(@Param('id', ParseUUIDPipe) id: string) {
    return this.invitationsService.resendInvitation(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
