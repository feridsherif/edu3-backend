// rbac/roles.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';



@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)

export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @Roles(Role.ADMIN) // Only allow users with the 'Admin' role to access this endpoint
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiResponse({ status: 200, description: 'List of all roles with their permissions' })
  @ApiResponse({ status: 403, description: 'Forbidden. You do not have permission to access this resource.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. Please log in to access this resource.' })
  @ApiResponse({ description: 'List of all roles with their permissions' })
  async findAll() {
    return this.rbacService.findAllRoles();
  }
}