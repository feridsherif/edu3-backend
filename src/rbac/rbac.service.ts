import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity.js';
import { Permission } from './entities/permission.entity.js';

@Injectable()
export class RbacService implements OnModuleInit {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    this.logger.log('Seeding default roles and permissions...');
    await this.seed();
  }

  private async seed() {
    const permissionsData = [
      { name: 'Invite Users', code: 'INVITE_USERS' },
      { name: 'View Users', code: 'VIEW_USERS' },
      { name: 'Manage Curriculum', code: 'MANAGE_CURRICULUM' },
    ];

    const permissions: Record<string, Permission> = {};

    for (const pData of permissionsData) {
      let permission = await this.permissionRepository.findOne({ where: { code: pData.code } });
      if (!permission) {
        permission = this.permissionRepository.create(pData);
        await this.permissionRepository.save(permission);
      }
      permissions[pData.code] = permission;
    }

    const rolesData = [
      {
        name: 'admin',
        description: 'System Administrator',
        permissions: [permissions['INVITE_USERS'], permissions['VIEW_USERS'], permissions['MANAGE_CURRICULUM']],
      },
      {
        name: 'instructor',
        description: 'Course Instructor',
        permissions: [permissions['MANAGE_CURRICULUM']],
      },
      {
        name: 'student',
        description: 'Registered Student',
        permissions: [],
      },
      {
        name: 'curriculum_supervisor',
        description: 'Curriculum Supervisor',
        permissions: [permissions['MANAGE_CURRICULUM'], permissions['VIEW_USERS']],
      }
    ];

    for (const rData of rolesData) {
      let role = await this.roleRepository.findOne({ where: { name: rData.name }, relations: { permissions: true } });
      if (!role) {
        role = this.roleRepository.create({
          name: rData.name,
          description: rData.description,
          permissions: rData.permissions,
        });
        await this.roleRepository.save(role);
      }
    }
    
    this.logger.log('RBAC Seeding completed.');
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }
}
