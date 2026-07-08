import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { User } from '../users/entities/user.entity'
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';

// Matches the shape PermissionsGuard expects: user.role.permissions is an
// array of { code: string } objects, not a flat array on the user itself.
export interface AuthUser {
  id: string;
  departmentId: string | null;
  role: {
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
  ) {}

  async create(dto: CreateDepartmentDto, actor: AuthUser): Promise<Department> {
    await this.assertUnique(dto.name, dto.code);

    const department = this.departmentRepo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      createdBy: { id: actor.id } as any,
    });

    return this.departmentRepo.save(department);
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const department = await this.findOrFail(id);

    if (dto.name || dto.code) {
      await this.assertUnique(dto.name ?? department.name, dto.code ?? department.code, id);
    }

    Object.assign(department, dto);
    return this.departmentRepo.save(department);
  }

  async updateStatus(id: string, dto: UpdateDepartmentStatusDto): Promise<Department> {
    const department = await this.findOrFail(id);
    department.isActive = dto.isActive;
    return this.departmentRepo.save(department);
  }

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