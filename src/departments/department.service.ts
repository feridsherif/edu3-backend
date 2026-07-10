import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from '../users/entities/user.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { AuditLogService } from '../common/services/audit-log.service';

// Matches the shape PermissionsGuard expects: user.role.permissions is an
// array of { code: string } objects, not a flat array on the user itself.
export interface AuthUser {
  id: string;
  departmentId: string | null;
  role: {
    name?: string;
    permissions: { code: string }[];
  };
}

function hasPermission(actor: AuthUser, code: string): boolean {
  return actor.role?.permissions?.some((p) => p.code === code) ?? false;
}

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditLogService: AuditLogService,
  ) { }

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(dto: CreateDepartmentDto, actor: AuthUser): Promise<Department> {
    await this.assertUnique(dto.name, dto.code);

    const department = this.departmentRepo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      createdBy: { id: actor.id } as any,
    
    });

    const saved = await this.departmentRepo.save(department);

    await this.auditLogService.log({
      action: 'department.create',
      resourceType: 'department',
      resourceId: saved.id,
      actorId: actor.id,
      payload: { name: saved.name, code: saved.code },
    });

    return saved;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDepartmentDto, actor: AuthUser): Promise<Department> {
    const department = await this.findOrFail(id);

    if (dto.name || dto.code) {
      await this.assertUnique(
        dto.name ?? department.name,
        dto.code ?? department.code,
        id,
      );
    }

    const before = { name: department.name, code: department.code, description: department.description };
    Object.assign(department, dto);
    const saved = await this.departmentRepo.save(department);

    await this.auditLogService.log({
      action: 'department.update',
      resourceType: 'department',
      resourceId: id,
      actorId: actor.id,
      payload: { before, after: { name: saved.name, code: saved.code, description: saved.description } },
    });

    return saved;
  }

  // ── Toggle Status ────────────────────────────────────────────────────────────

  async updateStatus(id: string, dto: UpdateDepartmentStatusDto, actor: AuthUser): Promise<Department> {
    const department = await this.findOrFail(id);
    const previous = department.isActive;
    department.isActive = dto.isActive;
    const saved = await this.departmentRepo.save(department);

    await this.auditLogService.log({
      action: 'department.status.update',
      resourceType: 'department',
      resourceId: id,
      actorId: actor.id,
      payload: { previousStatus: previous, newStatus: dto.isActive },
    });

    return saved;
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  async findAll(actor: AuthUser): Promise<Department[]> {
    if (hasPermission(actor, 'department.view.all')) {
      return this.departmentRepo.find();
    }

    if (!actor.departmentId) return [];
    const dept = await this.departmentRepo.findOne({
      where: { id: actor.departmentId },
    });
    return dept ? [dept] : [];
  }

  async findOne(id: string): Promise<Department> {
    return this.findOrFail(id);
  }

  async findMembers(id: string): Promise<User[]> {
    await this.findOrFail(id);
    return this.userRepo.find({ where: { departmentId: id } as any });
  }

  // ── Shared guard for other modules ───────────────────────────────────────────

  /**
   * Called by UsersService and CoursesService when assigning a department.
   * Throws if the department doesn't exist OR is inactive.
   * Business rule: "Inactive departments cannot receive new instructors / CMs / courses."
   */
  async assertActive(departmentId: string): Promise<Department> {
    const dept = await this.departmentRepo.findOne({ where: { id: departmentId } });
    if (!dept) {
      throw new NotFoundException(`Department ${departmentId} not found`);
    }
    if (!dept.isActive) {
      throw new BadRequestException(
        'Cannot assign to an inactive department. Reactivate the department first.',
      );
    }
    return dept;
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private async findOrFail(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  private async assertUnique(
    name: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.departmentRepo
      .createQueryBuilder('d')
      .where('(d.name = :name OR d.code = :code)', { name, code })
      .andWhere(excludeId ? 'd.id != :excludeId' : '1=1', { excludeId })
      .getOne();

    if (existing) {
      throw new ConflictException(
        existing.name === name
          ? 'Department name already exists'
          : 'Department code already exists',
      );
    }
  }
}