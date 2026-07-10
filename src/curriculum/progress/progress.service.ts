import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgressTracking } from '../entities/progress-tracking.entity';
import { Lesson } from '../entities/lesson.entity';
import { Chapter } from '../entities/chapter.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressTracking)
    private progressRepository: Repository<ProgressTracking>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  async completeLesson(lessonId: string, studentId: string): Promise<ProgressTracking> {
    const currentLesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
    if (!currentLesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (currentLesson.isLocked) {
      throw new BadRequestException('Lesson is locked');
    }

    // Check progression: Get all lessons in chapter sorted by sequenceOrder
    const chapterLessons = await this.lessonRepository.find({
      where: { chapterId: currentLesson.chapterId },
      order: { sequenceOrder: 'ASC' },
    });

    const currentIndex = chapterLessons.findIndex(l => l.id === lessonId);
    
    // If not the first lesson in the chapter, check if the previous one is completed
    if (currentIndex > 0) {
      const previousLesson = chapterLessons[currentIndex - 1];
      const previousProgress = await this.progressRepository.findOne({
        where: { lessonId: previousLesson.id, studentId },
      });

      if (!previousProgress || !previousProgress.isCompleted) {
        throw new BadRequestException('You must complete the previous lesson before completing this one');
      }
    }

    // Check if already completed
    let progress = await this.progressRepository.findOne({
      where: { lessonId, studentId },
    });

    if (progress && progress.isCompleted) {
      return progress;
    }

    if (!progress) {
      progress = this.progressRepository.create({
        lessonId,
        studentId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }

    return this.progressRepository.save(progress);
  }
}
