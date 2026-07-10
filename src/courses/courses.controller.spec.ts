
import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseStatus } from './entities/course.entity';
import { DifficultyLevel } from './entities/course.entity';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('CoursesController', () => {
  let controller: CoursesController;
  let service: CoursesService;

  const mockUser = {
    id: 'user-123',
    email: 'instructor@example.com',
    role: { name: 'Instructor' },
    departmentId: 'dept-456',
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    role: { name: 'Admin' },
    departmentId: null,
  };

  const mockCourse = {
    id: 'course-123',
    title: 'Introduction to Web3',
    slug: 'introduction-to-web3',
    shortDescription: 'Learn Web3 basics',
    description: 'Full course description',
    difficultyLevel: DifficultyLevel.BEGINNER,
    estimatedDuration: 120,
    language: 'English',
    status: CourseStatus.DRAFT,
    isActive: false,
    instructorId: 'user-123',
    departmentId: 'dept-456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPublishedCourse = {
    ...mockCourse,
    status: CourseStatus.PUBLISHED,
    isActive: true,
    publishedAt: new Date(),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    submitForReview: jest.fn(),
    review: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    publish: jest.fn(),
    toggleAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    service = module.get<CoursesService>(CoursesService);

    jest.clearAllMocks();
  });

  describe('create (CRS-001)', () => {
    const createDto: CreateCourseDto = {
      title: 'Introduction to Web3',
      shortDescription: 'Learn Web3 basics',
      description: 'Full course description',
      difficultyLevel: DifficultyLevel.BEGINNER,
      estimatedDuration: 120,
      language: 'English',
      departmentId: 'dept-456',
    };

    it('should create a course successfully', async () => {
      mockService.create.mockResolvedValue(mockCourse);

      const result = await controller.create(createDto, mockUser);

      expect(result).toEqual(mockCourse);
      expect(mockService.create).toHaveBeenCalledWith(createDto, mockUser.id);
    });

    it('should throw ConflictException if title already exists in department', async () => {
      mockService.create.mockRejectedValue(
        new ConflictException('A course with this title already exists in this department'),
      );

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if department is inactive', async () => {
      mockService.create.mockRejectedValue(
        new BadRequestException('Invalid or inactive department'),
      );

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll (CRS-010)', () => {
    it('should return all courses for Admin', async () => {
      const courses = [mockCourse, { ...mockCourse, id: 'course-456' }];
      mockService.findAll.mockResolvedValue(courses);

      const result = await controller.findAll(mockAdminUser);

      expect(result).toEqual(courses);
      expect(mockService.findAll).toHaveBeenCalledWith(mockAdminUser);
    });

    it('should return only instructor courses for Instructor', async () => {
      const courses = [mockCourse];
      mockService.findAll.mockResolvedValue(courses);

      const result = await controller.findAll(mockUser);

      expect(result).toEqual(courses);
      expect(mockService.findAll).toHaveBeenCalledWith(mockUser);
    });

    it('should return published courses only for Student', async () => {
      const studentUser = { ...mockUser, role: { name: 'Student' } };
      const courses = [{ ...mockPublishedCourse }];
      mockService.findAll.mockResolvedValue(courses);

      const result = await controller.findAll(studentUser);

      expect(result).toEqual(courses);
      expect(mockService.findAll).toHaveBeenCalledWith(studentUser);
    });
  });

  describe('findOne (CRS-010)', () => {
    it('should return a course by ID', async () => {
      mockService.findOne.mockResolvedValue(mockCourse);

      const result = await controller.findOne('course-123');

      expect(result).toEqual(mockCourse);
      expect(mockService.findOne).toHaveBeenCalledWith('course-123');
    });

    it('should throw NotFoundException if course not found', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('Course with ID "course-999" not found'),
      );

      await expect(controller.findOne('course-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update (CRS-002)', () => {
    const updateDto: UpdateCourseDto = {
      title: 'Advanced Web3',
    };

    it('should update a Draft course successfully', async () => {
      const updatedCourse = { ...mockCourse, title: 'Advanced Web3' };
      mockService.update.mockResolvedValue(updatedCourse);

      const result = await controller.update('course-123', updateDto, mockUser);

      expect(result).toEqual(updatedCourse);
      expect(mockService.update).toHaveBeenCalledWith('course-123', updateDto, mockUser);
    });

    it('should update a Rejected course successfully', async () => {
      const rejectedCourse = { ...mockCourse, status: CourseStatus.REJECTED };
      mockService.update.mockResolvedValue(rejectedCourse);

      const result = await controller.update('course-123', updateDto, mockUser);

      expect(result).toEqual(rejectedCourse);
    });

    it('should throw BadRequestException if course is not Draft or Rejected', async () => {
      mockService.update.mockRejectedValue(
        new BadRequestException('Course can only be updated if it is Draft or Rejected'),
      );

      await expect(
        controller.update('course-123', updateDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if non-owner tries to update', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockService.update.mockRejectedValue(
        new ConflictException('Only the instructor or admin can update this course'),
      );

      await expect(
        controller.update('course-123', updateDto, otherUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove (CRS-003)', () => {
    it('should soft-delete a Draft course successfully', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('course-123', mockUser);

      expect(result).toBeUndefined();
      expect(mockService.remove).toHaveBeenCalledWith('course-123', mockUser);
    });

    it('should throw BadRequestException if course is not Draft', async () => {
      mockService.remove.mockRejectedValue(
        new BadRequestException('Only Draft courses can be deleted'),
      );

      await expect(controller.remove('course-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if non-owner tries to delete', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockService.remove.mockRejectedValue(
        new ConflictException('Only the instructor or admin can delete this course'),
      );

      await expect(controller.remove('course-123', otherUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('submitForReview (CRS-004)', () => {
    it('should submit Draft course for review successfully', async () => {
      const submittedCourse = { ...mockCourse, status: CourseStatus.PENDING_REVIEW };
      mockService.submitForReview.mockResolvedValue(submittedCourse);

      const result = await controller.submitForReview('course-123', mockUser);

      expect(result).toEqual(submittedCourse);
      expect(mockService.submitForReview).toHaveBeenCalledWith('course-123', mockUser);
    });

    it('should submit Rejected course for review successfully', async () => {
      const rejectedCourse = { ...mockCourse, status: CourseStatus.REJECTED };
      const submittedCourse = { ...rejectedCourse, status: CourseStatus.PENDING_REVIEW };
      mockService.submitForReview.mockResolvedValue(submittedCourse);

      const result = await controller.submitForReview('course-123', mockUser);

      expect(result.status).toBe(CourseStatus.PENDING_REVIEW);
    });

    it('should throw BadRequestException if course is not Draft or Rejected', async () => {
      mockService.submitForReview.mockRejectedValue(
        new BadRequestException('Course must be Draft or Rejected to be submitted'),
      );

      await expect(
        controller.submitForReview('course-123', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if non-owner tries to submit', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockService.submitForReview.mockRejectedValue(
        new ConflictException('Only the instructor can submit this course'),
      );

      await expect(
        controller.submitForReview('course-123', otherUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('review (CRS-005)', () => {
    it('should return course details for review', async () => {
      const pendingCourse = { ...mockCourse, status: CourseStatus.PENDING_REVIEW };
      mockService.review.mockResolvedValue(pendingCourse);

      const result = await controller.review('course-123', mockUser);

      expect(result).toEqual(pendingCourse);
      expect(mockService.review).toHaveBeenCalledWith('course-123', mockUser);
    });

    it('should throw BadRequestException if course is not Pending Review', async () => {
      mockService.review.mockRejectedValue(
        new BadRequestException('Course is not pending review'),
      );

      await expect(controller.review('course-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if outside department', async () => {
      const otherUser = { ...mockUser, departmentId: 'other-dept' };
      mockService.review.mockRejectedValue(
        new ConflictException('Can only review courses within your department'),
      );

      await expect(controller.review('course-123', otherUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('approve (CRS-006)', () => {
    it('should approve a Pending Review course', async () => {
      const approvedCourse = {
        ...mockCourse,
        status: CourseStatus.APPROVED,
        approvedById: 'user-123',
        approvedAt: new Date(),
      };
      mockService.approve.mockResolvedValue(approvedCourse);

      const result = await controller.approve('course-123', mockUser);

      expect(result.status).toBe(CourseStatus.APPROVED);
      expect(result.approvedById).toBe('user-123');
      expect(mockService.approve).toHaveBeenCalledWith('course-123', mockUser);
    });

    it('should throw BadRequestException if course is not Pending Review', async () => {
      mockService.approve.mockRejectedValue(
        new BadRequestException('Course is not pending review'),
      );

      await expect(controller.approve('course-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if outside department', async () => {
      const otherUser = { ...mockUser, departmentId: 'other-dept' };
      mockService.approve.mockRejectedValue(
        new ConflictException('Can only approve courses within your department'),
      );

      await expect(controller.approve('course-123', otherUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('reject (CRS-007)', () => {
    const comments = 'Not enough detail in the curriculum';

    it('should reject a Pending Review course with comments', async () => {
      const rejectedCourse = {
        ...mockCourse,
        status: CourseStatus.REJECTED,
        rejectionComments: comments,
      };
      mockService.reject.mockResolvedValue(rejectedCourse);

      const result = await controller.reject('course-123', comments, mockUser);

      expect(result.status).toBe(CourseStatus.REJECTED);
      expect(result.rejectionComments).toBe(comments);
      expect(mockService.reject).toHaveBeenCalledWith('course-123', comments, mockUser);
    });

    it('should throw BadRequestException if comments are missing', async () => {
      mockService.reject.mockRejectedValue(
        new BadRequestException('Rejection comments are required'),
      );

      await expect(
        controller.reject('course-123', '', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if course is not Pending Review', async () => {
      mockService.reject.mockRejectedValue(
        new BadRequestException('Course is not pending review'),
      );

      await expect(
        controller.reject('course-123', comments, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if outside department', async () => {
      const otherUser = { ...mockUser, departmentId: 'other-dept' };
      mockService.reject.mockRejectedValue(
        new ConflictException('Can only reject courses within your department'),
      );

      await expect(
        controller.reject('course-123', comments, otherUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('publish (CRS-008)', () => {
    it('should publish an approved course', async () => {
      const publishedCourse = {
        ...mockCourse,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      };
      mockService.publish.mockResolvedValue(publishedCourse);

      const result = await controller.publish('course-123', mockUser);

      expect(result.status).toBe(CourseStatus.PUBLISHED);
      expect(mockService.publish).toHaveBeenCalledWith('course-123', mockUser);
    });

    it('should throw BadRequestException if course is not Approved', async () => {
      mockService.publish.mockRejectedValue(
        new BadRequestException('Only approved courses can be published'),
      );

      await expect(controller.publish('course-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if non-owner tries to publish', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockService.publish.mockRejectedValue(
        new ConflictException('Only the instructor or admin can publish this course'),
      );

      await expect(controller.publish('course-123', otherUser)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('toggleAvailability (CRS-009)', () => {
    it('should enable enrollment for a published course', async () => {
      const enabledCourse = { ...mockPublishedCourse, isActive: true };
      mockService.toggleAvailability.mockResolvedValue(enabledCourse);

      const result = await controller.toggleAvailability('course-123', true, mockUser);

      expect(result.isActive).toBe(true);
      expect(mockService.toggleAvailability).toHaveBeenCalledWith(
        'course-123',
        true,
        mockUser,
      );
    });

    it('should disable enrollment for a published course', async () => {
      const disabledCourse = { ...mockPublishedCourse, isActive: false };
      mockService.toggleAvailability.mockResolvedValue(disabledCourse);

      const result = await controller.toggleAvailability('course-123', false, mockUser);

      expect(result.isActive).toBe(false);
      expect(mockService.toggleAvailability).toHaveBeenCalledWith(
        'course-123',
        false,
        mockUser,
      );
    });

    it('should throw BadRequestException if course is not Published', async () => {
      mockService.toggleAvailability.mockRejectedValue(
        new BadRequestException('Only published courses can have their availability toggled'),
      );

      await expect(
        controller.toggleAvailability('course-123', true, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if non-owner tries to toggle', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockService.toggleAvailability.mockRejectedValue(
        new ConflictException('Only the instructor or admin can toggle availability'),
      );

      await expect(
        controller.toggleAvailability('course-123', true, otherUser),
      ).rejects.toThrow(ConflictException);
    });
  });
});