// src/courses/courses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Course, CourseStatus } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { slugify } from '../common/utils/slugify';
import { DepartmentsService } from '../departments/department.service';
import { AuditLogService } from '../common/services/audit-log.service';
import { Chapter } from '../curriculum/entities/chapter.entity';
import { Lesson } from '../curriculum/entities/lesson.entity';
import { Quiz } from '../curriculum/entities/quiz.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly departmentsService: DepartmentsService,
    private readonly auditLogService: AuditLogService,
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

    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.create',
      resourceType: 'course',
      resourceId: saved.id,
      resourceName: saved.title,
      actorId: instructorId,
      payload: {
        title: saved.title,
        departmentId: saved.departmentId,
        difficultyLevel: saved.difficultyLevel,
      },
    });

    return saved;
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

    const before = {
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      difficultyLevel: course.difficultyLevel,
      estimatedDuration: course.estimatedDuration,
      language: course.language,
    };

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
    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.update',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        before,
        after: {
          title: saved.title,
          shortDescription: saved.shortDescription,
          description: saved.description,
          difficultyLevel: saved.difficultyLevel,
          estimatedDuration: saved.estimatedDuration,
          language: saved.language,
        },
      },
    });

    return saved;
  }

  async remove(id: string, user: any): Promise<void> {
    const course = await this.findOne(id);
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can delete this course');
    }
    if (course.status !== CourseStatus.DRAFT) {
      throw new BadRequestException('Only Draft courses can be deleted');
    }

    const courseTitle = course.title;
    course.deletedAt = new Date();
    await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.delete',
      resourceType: 'course',
      resourceId: id,
      resourceName: courseTitle,
      actorId: user.id,
      payload: { deletedAt: course.deletedAt },
    });
  }

  async submitForReview(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.instructorId !== user.id) {
      throw new ConflictException('Only the instructor can submit this course');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException('Course must be Draft or Rejected to be submitted');
    }

    // CRS-004: Minimum content validation – at least 1 chapter, 1 lesson, and 1 quiz
    const chapters = await this.chapterRepository.find({ where: { courseId: id } });
    const chapterCount = chapters.length;

    if (chapterCount === 0) {
      throw new BadRequestException(
        'Course must have at least one chapter before it can be submitted for review',
      );
    }

    const chapterIds = chapters.map((c) => c.id);
    let lessonCount = 0;
    for (const chapterId of chapterIds) {
      const count = await this.lessonRepository.count({ where: { chapterId } });
      lessonCount += count;
    }

    if (lessonCount === 0) {
      throw new BadRequestException(
        'Course must have at least one lesson before it can be submitted for review',
      );
    }

    const quizCount = await this.quizRepository.count({ where: { courseId: id } });
    if (quizCount === 0) {
      throw new BadRequestException(
        'Course must have at least one quiz before it can be submitted for review',
      );
    }

    const previousStatus = course.status;
    course.status = CourseStatus.PENDING_REVIEW;
    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.submit',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        previousStatus,
        newStatus: CourseStatus.PENDING_REVIEW,
        chapterCount,
        lessonCount,
        quizCount,
      },
    });

    return saved;
  }

  async review(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.departmentId !== user.departmentId && user.role.name !== 'Admin') {
      throw new ConflictException('Can only review courses within your department');
    }
    if (course.status !== CourseStatus.PENDING_REVIEW) {
      throw new BadRequestException('Course is not pending review');
    }

    await this.auditLogService.log({
      action: 'course.review',
      resourceType: 'course',
      resourceId: id,
      resourceName: course.title,
      actorId: user.id,
      payload: {
        status: course.status,
      },
    });

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

    const previousStatus = course.status;
    course.status = CourseStatus.APPROVED;
    course.approvedById = user.id;
    course.approvedAt = new Date();

    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.approve',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        previousStatus,
        newStatus: CourseStatus.APPROVED,
        approvedAt: saved.approvedAt,
      },
    });

    return saved;
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

    const previousStatus = course.status;
    course.status = CourseStatus.REJECTED;
    course.rejectionComments = comments;

    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.reject',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        previousStatus,
        newStatus: CourseStatus.REJECTED,
        comments,
      },
    });

    return saved;
  }

  async publish(id: string, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.APPROVED) {
      throw new BadRequestException('Only approved courses can be published');
    }
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can publish this course');
    }

    const previousStatus = course.status;
    course.status = CourseStatus.PUBLISHED;
    course.publishedAt = new Date();

    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.publish',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        previousStatus,
        newStatus: CourseStatus.PUBLISHED,
        publishedAt: saved.publishedAt,
      },
    });

    return saved;
  }

  async toggleAvailability(id: string, isActive: boolean, user: any): Promise<Course> {
    const course = await this.findOne(id);
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('Only published courses can have their availability toggled');
    }
    if (course.instructorId !== user.id && user.role.name !== 'Admin') {
      throw new ConflictException('Only the instructor or admin can toggle availability');
    }

    const previousAvailability = course.isActive;
    course.isActive = isActive;

    const saved = await this.courseRepository.save(course);

    await this.auditLogService.log({
      action: 'course.availability.update',
      resourceType: 'course',
      resourceId: id,
      resourceName: saved.title,
      actorId: user.id,
      payload: {
        previousAvailability,
        newAvailability: isActive,
      },
    });

    return saved;
  }
}