// src/courses/courses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { slugify } from '../common/utils/slugify';
import { DepartmentsService } from '../departments/department.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly departmentsService: DepartmentsService,
  ) { }

  async create(createDto: CreateCourseDto, instructorId: string): Promise<Course> {
    // Check if title already exists (within department)
    const existing = await this.courseRepository.findOne({
      where: {
        title: createDto.title,
        departmentId: createDto.departmentId,
      },
    });
    if (existing) {
      throw new ConflictException(
        'A course with this title already exists in this department',
      );
    }

    // Validate department exists and is active
    const department = await this.departmentsService.findOne(createDto.departmentId);
    if (!department || !department.isActive) {
      throw new BadRequestException('Invalid or inactive department');
    }

    const course = this.courseRepository.create({
      ...createDto,
      slug: slugify(createDto.title),
      instructorId,
      status: CourseStatus.DRAFT,
      isActive: false,
    });

    return this.courseRepository.save(course);
  }

  async findAll(user: any) {
    const roleName: string = user?.role?.name ?? '';
    const qb = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.instructor', 'instructor')
      .leftJoinAndSelect('course.department', 'department')
      .where('course.deleted_at IS NULL');

    if (roleName === 'Admin') {
      // Admin sees all courses
    } else if (roleName === 'Instructor') {
      // Instructor sees only their own courses
      qb.andWhere('course.instructor_id = :instructorId', { instructorId: user.id });
    } else if (roleName === 'Curriculum Manager') {
      // Curriculum Manager sees all departmental courses
      qb.andWhere('course.department_id = :deptId', { deptId: user.departmentId });
    } else {
      // Students and others see only Published + Active courses
      qb.andWhere('course.status = :status', { status: CourseStatus.PUBLISHED })
        .andWhere('course.is_active = :isActive', { isActive: true });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { instructor: true, department: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID "${id}" not found`);
    }
    return course;
  }

  async update(id: string, updateDto: UpdateCourseDto, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can update this course');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException('Course can only be updated if it is Draft or Rejected');
    }

    if (updateDto.title && updateDto.title !== course.title) {
      const existing = await this.courseRepository.findOne({
        where: { title: updateDto.title, departmentId: course.departmentId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('A course with this title already exists in this department');
      }
      course.slug = slugify(updateDto.title);
    }

    Object.assign(course, updateDto);
    return this.courseRepository.save(course);
  }

  async remove(id: string, user: any): Promise<void> {
    const course = await this.findOne(id);
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can delete this course');
    }
    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException('Only Draft courses can be deleted');
    }
    course.deletedAt = new Date();
    await this.courseRepository.save(course);
  }

  async submitForReview(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.instructorId !== user.id) {
      throw new ConflictException('Only the instructor can submit this course');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException('Course must be Draft or Rejected to be submitted');
    }

    // Check minimum content - simplified check since chapters/lessons are in Mod-005
    course.status = CourseStatus.PENDING_REVIEW;
    return this.courseRepository.save(course);
  }

  async review(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.departmentId !== user.departmentId && user.role.name !== 'Admin') {
      throw new ConflictException('Can only review courses within your department');
    }
    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException('Course is not pending review');
    }
    return course;
  }

  async approve(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException('Course is not pending review');
    }
    if (course.departmentId !== user.departmentId && user.role.name !== 'Admin') {
      throw new ConflictException('Can only approve courses within your department');
    }

    course.status = CourseStatus.APPROVED;
    course.approvedById = user.id;
    course.approvedAt = new Date();

    return this.courseRepository.save(course);
  }

  async reject(id: string, comments: string, user: any): Promise<Course> {
    if (!comments) {
      throw new BadRequestException('Rejection comments are required');
    }
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException('Course is not pending review');
    }
    if (course.departmentId !== user.departmentId && user.role.name !== 'Admin') {
      throw new ConflictException('Can only reject courses within your department');
    }

    course.status = CourseStatus.REJECTED;
    course.rejectionComments = comments;

    return this.courseRepository.save(course);
  }

  async publish(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.APPROVED) {
      throw new BadRequestException('Only approved courses can be published');
    }
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can publish this course');
    }

    course.status = CourseStatus.PUBLISHED;
    course.publishedAt = new Date();

    return this.courseRepository.save(course);
  }

  async toggleAvailability(id: string, isActive: boolean, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('Only published courses can have their availability toggled');
    }
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can toggle availability');
    }

    course.isActive = isActive;
    return this.courseRepository.save(course);
  }

}