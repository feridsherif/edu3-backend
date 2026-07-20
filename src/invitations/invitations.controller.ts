import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create an invitation (Admin only)' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully.' })
  create(@Body() createInvitationDto: CreateInvitationDto) {
    return this.invitationsService.createInvitation(createInvitationDto);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiResponse({ status: 200, description: 'Returns invitation details.' })
  findOne(@Param('token') token: string) {
    return this.invitationsService.getInvitation(token);
  }

  

  @Get()
  @ApiOperation({ summary: 'Get all invitations (Admin only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 200, description: 'Returns a list of all invitations.' })
  findAll() {
    return this.invitationsService.getAllInvitations();
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiResponse({ status: 200, description: 'Account activated successfully.' })
  accept(@Body() acceptInvitationDto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(acceptInvitationDto);
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend an invitation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiResponse({ status: 200, description: 'Invitation resent successfully.' })
  resend(@Param('id') id: string) {
    return this.invitationsService.resendInvitation(id);
  }
}
