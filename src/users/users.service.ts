
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import * as bcrypt from '../utils/bcrypt';
import { RbacService } from '../rbac/rbac.service.js';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly rbacService: RbacService,
  ) { }


  private cleanResponse(user: User): UserResponseDto {
    const response = new UserResponseDto();
    response.id = user.id;
    response.email = user.email;
    response.firstName = user.firstName;
    response.lastName = user.lastName;
    response.isActive = user.isActive;
    response.lastLoginAt = user.lastLoginAt;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;
    response.role = user.role;
    response.department = user.department;
  
  return response;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const roleName = createUserDto.role || 'Student';
    const role = await this.rbacService.getRoleByName(roleName);
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const rolesRequiringDept = ['Instructor', 'Curriculum Manager'];
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
  
      relations: { role: { permissions: true }, department: true },
    });
  }

  async findUsersFor(requesterIdOrPayload: any): Promise<UserResponseDto[]> {
    const requester = await this.findByIdWithPermissions(requesterIdOrPayload.id || requesterIdOrPayload.sub);
    if (!requester) return [];

    if (requester.role.name === 'admin' || requester.role.name === 'Admin') {
      const users = await this.findAll();
      return users.map(user => this.cleanResponse(user));
    }
    if (requester.role.name === 'curriculum_manager' || requester.role.name === 'Curriculum Manager') {
      const users = await this.usersRepository.find({
        where: { department: { id: requester.department?.id }, role: { name: 'instructor' } },
        relations: { role: { permissions: true }, department: true },
      });
      return users.map(user => this.cleanResponse(user));
    }
    if (requester.role.name === 'instructor' || requester.role.name === 'Instructor') {
      const users = await this.usersRepository.find({
        where: { role: { name: 'student' } },
        relations: { role: { permissions: true }, department: true }
      });
      return users.map(user => this.cleanResponse(user));
    }

    return [this.cleanResponse(requester)];
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: { permissions: true }, department: true }
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findOneFor(id: string, requesterIdOrPayload: any): Promise<UserResponseDto> {
    const user = await this.findOne(id);
    const requester = await this.findByIdWithPermissions(requesterIdOrPayload.id || requesterIdOrPayload.sub);

    // Enforcement of viewing rights
    if (requester.role.name === 'curriculum_manager' || requester.role.name === 'Curriculum Manager') {
      if (user.department?.id !== requester.department?.id || (user.role.name !== 'Instructor' && user.role.name !== 'instructor')) {
        throw new NotFoundException(`User with ID "${id}" not found`);
      }
    }

    return this.cleanResponse(user);
  }

  //  Get current user profile (for /me endpoint)
  async findMe(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        role: { permissions: true },
        department: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.cleanResponse(user);
  }

  //reset password and forgot password functionalities

async findByResetToken(token: string): Promise<User | null> {
  return this.usersRepository.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiresAt: MoreThan(new Date()), // Not expired
    },
  });
}

async setResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await this.usersRepository.update(userId, {
    resetPasswordToken: token,
    resetPasswordExpiresAt: expiresAt,
  });
}

async clearResetToken(userId: string): Promise<void> {
  await this.usersRepository.update(userId, {
    resetPasswordToken: '',
    resetPasswordExpiresAt: new Date(0), // Set to epoch to indicate it's expired
  });
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

  async updateUser(id: string, updateUserDto: UpdateUserDto, requesterIdOrPayload: any): Promise<User> {
    const user = await this.findOne(id);
    const requester = await this.findByIdWithPermissions(requesterIdOrPayload.id || requesterIdOrPayload.sub);

    // USR-004 specific business rules
    // Role changes are allowed only by Admin.
    // Department changes are allowed only by Admin.
    const isAdmin = requester.role.name === 'admin' || requester.role.name === 'Admin';

    if (updateUserDto.role && !isAdmin) {
      throw new BadRequestException('Only Admin can change roles.');
    }
    if (updateUserDto.departmentId && !isAdmin) {
      throw new BadRequestException('Only Admin can change department.');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.findByEmail(updateUserDto.email);
      if (existing) {
        throw new ConflictException('Email already in use.');
      }
    }

    const updateData: Partial<CreateUserDto> = { ...updateUserDto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async updateStatus(id: string, requestStatus: boolean): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = requestStatus;
    return this.usersRepository.save(user);
  }

  async assignDepartment(id: string, departmentId: string): Promise<User> {
    const user = await this.findOne(id);
    user.department = { id: departmentId } as any;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async findByActivationToken(token: string): Promise<User | null> {
    if (!token) {
      return null;
    }
    return this.usersRepository.findOne({ where: { activationToken: token } });
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}