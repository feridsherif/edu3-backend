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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post('/add')
  @RequirePermissions('department.create')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() actor: AuthUser) {
    return this.departmentsService.create(dto, actor);
  }

  @Put(':id')
  @RequirePermissions('department.update')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('department.status.update')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDepartmentStatusDto) {
    return this.departmentsService.updateStatus(id, dto);
  }

  @Get()
  @RequirePermissions('department.view')
  findAll(@CurrentUser() actor: AuthUser) {
    return this.departmentsService.findAll(actor);
  }

@Get(':id')
@RequirePermissions('department.view')
findOne(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
  const canViewAll = actor.role?.permissions?.some(
    (p) => p.code === 'department.view.all',
  );
  if (!canViewAll && actor.departmentId !== id) {
    throw new ForbiddenException(
      'You may only view your own department',
    );
  }
  return this.departmentsService.findOne(id);
}

  @Get(':id/members')
  @RequirePermissions('department.members.view')
  findMembers(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const canViewAll = actor.role?.permissions?.some(
      (p) => p.code === 'department.view.all',
    );
    if (!canViewAll && actor.departmentId !== id) {
      throw new ForbiddenException(
        'You may only view members of your own department',
      );
    }
    return this.departmentsService.findMembers(id);
  }
}