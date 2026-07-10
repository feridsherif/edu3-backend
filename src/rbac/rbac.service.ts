// rbac/rbac.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

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


async findAllRoles(): Promise<Role[]> {
  return this.roleRepository.find({
    relations: { permissions: true },
    order: { name: 'ASC' },
  });
}

  private async seed() {
    
    const permissionDefinitions = [
      // Profile
      { name: 'View Profile', code: 'profile.view' },
      { name: 'Update Profile', code: 'profile.update' },

      // Department
      { name: 'Create Department', code: 'department.create' },
      { name: 'Update Department', code: 'department.update' },
      { name: 'View Department', code: 'department.view' },
      { name: 'Update Department Status', code: 'department.status.update' },
      { name: 'View Department Members', code: 'department.members.view' },
      { name: 'View All Departments', code: 'department.view.all' },

      // User Management
      { name: 'Create Instructor', code: 'user.instructor.create' },
      { name: 'Create Curriculum Manager', code: 'user.curriculum_manager.create' },
      { name: 'View Users', code: 'user.view' },
      { name: 'Update User', code: 'user.update' },
      { name: 'Update User Status', code: 'user.status.update' },
      { name: 'Assign Department to User', code: 'user.department.assign' },
      { name: 'Resend Invitation', code: 'user.invitation.resend' },

      // Course
      { name: 'Create Course', code: 'course.create' },
      { name: 'Update Course', code: 'course.update' },
      { name: 'Delete Course', code: 'course.delete' },
      { name: 'Submit Course for Review', code: 'course.submit' },
      { name: 'Review Course', code: 'course.review' },
      { name: 'Approve Course', code: 'course.approve' },
      { name: 'Reject Course', code: 'course.reject' },
      { name: 'Publish Course', code: 'course.publish' },
      { name: 'Update Course Availability', code: 'course.availability.update' },
      { name: 'View Course', code: 'course.view' },

      // Curriculum
      { name: 'Create Chapter', code: 'chapter.create' },
      { name: 'Create Lesson', code: 'lesson.create' },
    ];

    const permissionMap: Record<string, Permission> = {};

    
    for (const def of permissionDefinitions) {
      let perm = await this.permissionRepository.findOne({
        where: { code: def.code },
      });

      if (perm) {
        
        if (perm.name !== def.name) {
          perm.name = def.name;
          await this.permissionRepository.save(perm);
        }
      } else {
        perm = this.permissionRepository.create(def);
        await this.permissionRepository.save(perm);
      }
      permissionMap[def.code] = perm;
    }

   
    const rolesData = [
      {
        name: 'Admin',
        description: 'System Administrator – full access',
        permissionCodes: permissionDefinitions.map(p => p.code),
      },
      {
        name: 'Instructor',
        description: 'Course Instructor',
        permissionCodes: [
          'profile.view', 'profile.update',
          'course.create', 'course.update', 'course.delete', 'course.submit',
          'course.publish', 'course.view',
          'department.view',
          'user.view',
          'chapter.create', 'lesson.create',
        ],
      },
      {
        name: 'Curriculum Manager',
        description: 'Curriculum Supervisor – reviews and approves courses',
        permissionCodes: [
          'profile.view', 'profile.update',
          'course.view', 'course.review', 'course.approve', 'course.reject',
          'department.view', 'department.members.view',
          'user.view',
        ],
      },
      {
        name: 'Student',
        description: 'Registered Student',
        permissionCodes: [
          'profile.view', 'profile.update',
          'course.view',
        ],
      },
    ];

    
    for (const rData of rolesData) {
      let role = await this.roleRepository.findOne({
        where: { name: rData.name },
        relations: { permissions: true },
      });

      const newPermissions = rData.permissionCodes
        .map(code => permissionMap[code])
        .filter(Boolean);

      if (!role) {
        role = this.roleRepository.create({
          name: rData.name,
          description: rData.description,
          permissions: newPermissions,
        });
      } else {
        // Update description and permissions
        role.description = rData.description;
        role.permissions = newPermissions;
      }
      await this.roleRepository.save(role);
    }

    this.logger.log('RBAC seeding completed.');
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
      relations: { permissions: true },
    });
  }
}