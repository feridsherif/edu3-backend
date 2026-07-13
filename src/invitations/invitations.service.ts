import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInvitation } from './entities/user-invitation.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { DepartmentsService } from '../departments/department.service.js';
import { CreateInvitationDto } from './dto/create-invitation.dto.js';
import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import * as crypto from 'crypto';
import * as bcrypt from '../utils/bcrypt';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(UserInvitation)
    private readonly invitationRepository: Repository<UserInvitation>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly departmentsService: DepartmentsService,
  ) { }

  async createInvitation(dto: CreateInvitationDto) {
    let user = await this.usersService.findByEmail(dto.email);
    if (user) {
      throw new ConflictException('User already exists');
    }

    const rolesRequiringDepartment = ['Instructor', 'Curriculum Manager'];
    if (rolesRequiringDepartment.includes(dto.role) && !dto.departmentId) {
      throw new BadRequestException(`Department is required for role ${dto.role}`);
    }

    // If departmentId is provided, verify it exists and is active
    if (dto.departmentId) {
      const department = await this.departmentsService.findOne(dto.departmentId);
      if (!department || !department.isActive) {
        throw new BadRequestException('Invalid or inactive department');
      }
    }

    user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      departmentId: dto.departmentId,
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    await this.invitationRepository.save(invitation);
    await this.mailService.sendRoleInvitation(user, token);

    return { message: 'Invitation sent successfully' };
  }

  async getInvitation(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: { user: true },
    });

    if (!invitation || invitation.accepted_at) {
      throw new NotFoundException('Invitation not found or already accepted');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      email: invitation.user.email,
      firstName: invitation.user.firstName,
      lastName: invitation.user.lastName,
    };
  }

  async getAllInvitations() {
    const invitations = await this.invitationRepository.find({
      relations: { user: true },
    });
    return invitations;
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    const invitation = await this.invitationRepository.findOne({
      where: { token: dto.token },
      relations: { user: true },
    });

    if (!invitation || invitation.accepted_at) {
      throw new BadRequestException('Invalid or already accepted invitation token');
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    invitation.user.password = await bcrypt.hash(dto.password, 12);
    invitation.user.isActive = true;
    invitation.accepted_at = new Date();

    await this.usersService.save(invitation.user);
    await this.invitationRepository.save(invitation);

    return { message: 'Account activated successfully. You can now login.' };
  }

  async resendInvitation(userId: string) {
    const user = await this.usersService.findByIdWithPermissions(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('User relies on their password and is already active.');

    // Look for previous pending invitations
    const invitation = await this.invitationRepository.findOne({
      where: { user_id: userId },
      order: { created_at: 'DESC' }
    });

    if (invitation && invitation.accepted_at) {
      throw new BadRequestException('Invitation already accepted');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newInvitation = this.invitationRepository.create({
      user_id: user.id,
      token,
      expires_at: expiresAt,
    });

    // Remove previous invitations if they exist to keep it clean (optional, but good practice).
    if (invitation) {
      await this.invitationRepository.remove(invitation);
    }
    await this.invitationRepository.save(newInvitation);
    await this.mailService.sendRoleInvitation(user, token);

    return { message: 'Invitation resent successfully' };
  }
}
