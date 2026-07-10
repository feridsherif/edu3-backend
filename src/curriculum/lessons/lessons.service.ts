import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../entities/lesson.entity';
import { Chapter } from '../entities/chapter.entity';
import { Course, CourseStatus } from '../../courses/entities/course.entity';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  private async getCourseForChapter(chapterId: string): Promise<Course> {
    const chapter = await this.chapterRepository.findOne({ where: { id: chapterId } });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    const course = await this.courseRepository.findOne({ where: { id: chapter.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async getCourseForLesson(lessonId: string): Promise<{ lesson: Lesson; course: Course }> {
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    const course = await this.getCourseForChapter(lesson.chapterId);
    return { lesson, course };
  }

  private validateCourseEditable(course: Course, instructorId: string) {
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not own this course');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new ForbiddenException('Course is not in an editable state');
    }
  }

  async create(chapterId: string, instructorId: string, createLessonDto: CreateLessonDto): Promise<Lesson> {
    const course = await this.getCourseForChapter(chapterId);
    this.validateCourseEditable(course, instructorId);

    let sequenceOrder = createLessonDto.sequenceOrder;
    if (sequenceOrder === undefined) {
      const lastLesson = await this.lessonRepository.findOne({
        where: { chapterId },
        order: { sequenceOrder: 'DESC' },
      });
      sequenceOrder = lastLesson ? lastLesson.sequenceOrder + 1 : 1;
    } else {
      const existing = await this.lessonRepository.findOne({ where: { chapterId, sequenceOrder } });
      if (existing) {
        throw new BadRequestException('Lesson with this sequence order already exists in this chapter');
      }
    }

    const lesson = this.lessonRepository.create({
      ...createLessonDto,
      sequenceOrder,
      chapterId,
    });

    return this.lessonRepository.save(lesson);
  }

  async update(id: string, instructorId: string, updateLessonDto: UpdateLessonDto): Promise<Lesson> {
    const { lesson, course } = await this.getCourseForLesson(id);
    this.validateCourseEditable(course, instructorId);

    Object.assign(lesson, updateLessonDto);
    return this.lessonRepository.save(lesson);
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const { lesson, course } = await this.getCourseForLesson(id);
    this.validateCourseEditable(course, instructorId);

    // Business Rule: Cannot delete lessons if students enrolled. 
    // Handled broadly by the status check (Draft/Rejected courses cannot have active enrollments).
    
    // Soft delete is used as per user instruction.
    await this.lessonRepository.softDelete(id);
  }
}
