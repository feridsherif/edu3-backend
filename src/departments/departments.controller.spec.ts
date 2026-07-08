// src/departments/departments.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DepartmentsController } from './department.controller';
import { DepartmentsService, AuthUser } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  const mockService = {
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findMembers: jest.fn(),
  };

  const mockActor: AuthUser = {
    id: 'user-123',
    departmentId: 'dept-456',
    role: {
      permissions: [
        { code: 'department.create' },
        { code: 'department.update' },
        { code: 'department.status.update' },
        { code: 'department.view' },
        { code: 'department.members.view' },
      ],
    },
  };

  const mockAdminActor: AuthUser = {
    id: 'admin-123',
    departmentId: null,
    role: {
      permissions: [
        { code: 'department.view.all' },
        { code: 'department.members.view' },
        { code: 'department.view' },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get<DepartmentsService>(DepartmentsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with DTO and actor', async () => {
      const dto: CreateDepartmentDto = {
        name: 'CS',
        code: 'CS101',
        description: 'Dept of CS',
      };
      const expectedResult = { id: '1', ...dto };
      mockService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto, mockActor);
      expect(mockService.create).toHaveBeenCalledWith(dto, mockActor);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call service.update with ID and DTO', async () => {
      const id = 'dept-1';
      const dto: UpdateDepartmentDto = { name: 'New Name' };
      const expectedResult = { id, ...dto };
      mockService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);
      expect(mockService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus with ID and DTO', async () => {
      const id = 'dept-1';
      const dto: UpdateDepartmentStatusDto = { isActive: false };
      const expectedResult = { id, isActive: false };
      mockService.updateStatus.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus(id, dto);
      expect(mockService.updateStatus).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with actor', async () => {
      const departments = [{ id: '1', name: 'CS' }];
      mockService.findAll.mockResolvedValue(departments);

      const result = await controller.findAll(mockActor);
      expect(mockService.findAll).toHaveBeenCalledWith(mockActor);
      expect(result).toEqual(departments);
    });
  });

  describe('findOne', () => {
    it('should allow access if user has view.all permission', async () => {
      const id = 'dept-456';
      const department = { id, name: 'CS' };
      mockService.findOne.mockResolvedValue(department);

      const result = await controller.findOne(id, mockAdminActor);
      expect(result).toEqual(department);
      expect(mockService.findOne).toHaveBeenCalledWith(id);
    });

    it('should allow access if user belongs to the department', async () => {
      const id = 'dept-456';
      const department = { id, name: 'CS' };
      mockService.findOne.mockResolvedValue(department);

      const result = await controller.findOne(id, mockActor);
      expect(result).toEqual(department);
    });

    it('should throw ForbiddenException if user tries to view another department', async () => {
      const id = 'dept-789';
      // mockActor has departmentId = 'dept-456', not the requested id
      await expect(controller.findOne(id, mockActor)).rejects.toThrow(ForbiddenException);
      expect(mockService.findOne).not.toHaveBeenCalled();
    });

    it('should pass through service errors (NotFound, etc.)', async () => {
      const id = 'non-existent';
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(id, mockAdminActor)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMembers', () => {
    it('should allow admin with view.all permission to view any department members', async () => {
      const id = 'dept-any';
      const members = [{ id: 'u1', firstName: 'John' }];
      mockService.findMembers.mockResolvedValue(members);

      const result = await controller.findMembers(id, mockAdminActor);
      expect(result).toEqual(members);
      expect(mockService.findMembers).toHaveBeenCalledWith(id);
    });

    it('should allow user to view members of their own department', async () => {
      const id = 'dept-456';
      const members = [{ id: 'u1', firstName: 'John' }];
      mockService.findMembers.mockResolvedValue(members);

      const result = await controller.findMembers(id, mockActor);
      expect(result).toEqual(members);
    });

    it('should throw ForbiddenException if user tries to view another department members', async () => {
      const id = 'dept-789';
      await expect(controller.findMembers(id, mockActor)).rejects.toThrow(ForbiddenException);
      expect(mockService.findMembers).not.toHaveBeenCalled();
    });

    it('should pass through service errors (NotFound, etc.)', async () => {
      const id = 'non-existent';
      mockService.findMembers.mockRejectedValue(new NotFoundException());
      await expect(controller.findMembers(id, mockAdminActor)).rejects.toThrow(NotFoundException);
    });
  });
});