import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../entities/chapter.entity';
import { Course, CourseStatus } from '../../courses/entities/course.entity';
import { CreateChapterDto } from '../dto/create-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async create(courseId: string, instructorId: string, createChapterDto: CreateChapterDto): Promise<Chapter> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not own this course');
    }

    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new ForbiddenException('Course is not in an editable state');
    }

    let sequenceOrder = createChapterDto.sequenceOrder;
    if (sequenceOrder === undefined) {
      const lastChapter = await this.chapterRepository.findOne({
        where: { courseId },
        order: { sequenceOrder: 'DESC' },
      });
      sequenceOrder = lastChapter ? lastChapter.sequenceOrder + 1 : 1;
    } else {
      const existing = await this.chapterRepository.findOne({ where: { courseId, sequenceOrder } });
      if (existing) {
        throw new BadRequestException('Chapter with this sequence order already exists in this course');
      }
    }

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      sequenceOrder,
      courseId,
    });

    return this.chapterRepository.save(chapter);
  }
}
