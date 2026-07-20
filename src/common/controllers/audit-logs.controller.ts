import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns a list of audit logs.' })
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    
    return this.auditLogService.findAll({
      limit: isNaN(parsedLimit) ? 50 : parsedLimit,
      offset: isNaN(parsedOffset) ? 0 : parsedOffset,
    });
  }
}
