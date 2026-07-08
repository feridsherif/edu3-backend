import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';
import { RbacService } from '../rbac/rbac.service.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rbacService: RbacService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const roleName = createUserDto.role || 'student';
    const role = await this.rbacService.getRoleByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const rolesRequiringDept = ['instructor', 'curriculum_manager'];
if (rolesRequiringDept.includes(roleName) && !createUserDto.departmentId) {
  throw new BadRequestException(`Department is required for ${roleName}`);
}

    const user = this.usersRepository.create({
      ...createUserDto,
      role: role,
      department: createUserDto.departmentId ? { id: createUserDto.departmentId } : undefined,
    });

    if (createUserDto.password) {
      user.password = await bcrypt.hash(createUserDto.password, 12);
    }

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: { role: { permissions: true } },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } ,
     relations: { role:{permissions:true}}
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByIdWithPermissions(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true }, department: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const updateData: Partial<CreateUserDto> = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async findByActivationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { activationToken: token } });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}
