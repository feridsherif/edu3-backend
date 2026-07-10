import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DepartmentsService } from './department.service';
import type { AuthUser } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  // DEP-001: Create Department  →  POST /api/departments
  @Post()
  @RequirePermissions('department.create')
  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  @ApiResponse({ status: 201, description: 'Department created' })
  @ApiResponse({ status: 409, description: 'Name or code already exists' })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.create(dto, actor);
  }

  // DEP-002: Update Department
  @Put(':id')
  @RequirePermissions('department.update')
  @ApiOperation({ summary: 'Update department details (Admin only)' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  @ApiResponse({ status: 409, description: 'Duplicate name or code' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.departmentsService.update(id, dto, actor);
  }

  // DEP-003: Activate / Deactivate
  @Patch(':id/status')
  @RequirePermissions('department.status.update')
  @ApiOperation({ summary: 'Activate or deactivate a department (Admin only)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentStatusDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.departmentsService.updateStatus(id, dto, actor);
  }

  // DEP-004: View Department List (role-filtered)
  @Get()
  @RequirePermissions('department.view')
  @ApiOperation({ summary: 'List departments (Admin: all | Instructor/CM: own)' })
  findAll(@CurrentUser() actor: AuthUser) {
    return this.departmentsService.findAll(actor);
  }

  // DEP-004: View Single Department (scoped)
  @Get(':id')
  @RequirePermissions('department.view')
  @ApiOperation({ summary: 'Get a department by ID (scoped to own dept for non-admins)' })
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const canViewAll = actor.role?.permissions?.some(
      (p) => p.code === 'department.view.all',
    );
    if (!canViewAll && actor.departmentId !== id) {
      throw new ForbiddenException('You may only view your own department');
    }
    return this.departmentsService.findOne(id);
  }

  // DEP-005: View Department Members (scoped)
  @Get(':id/members')
  @RequirePermissions('department.members.view')
  @ApiOperation({ summary: 'List members of a department (Admin: any | CM: own only)' })
  findMembers(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const canViewAll = actor.role?.permissions?.some(
      (p) => p.code === 'department.view.all',
    );
    if (!canViewAll && actor.departmentId !== id) {
      throw new ForbiddenException('You may only view members of your own department');
    }
    return this.departmentsService.findMembers(id);
  }
}