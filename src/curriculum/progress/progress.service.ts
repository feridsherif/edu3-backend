import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProgressTracking } from '../entities/progress-tracking.entity';
import { Lesson } from '../entities/lesson.entity';
import { Chapter } from '../entities/chapter.entity';
import { Quiz } from '../entities/quiz.entity';
import { QuizAttempt } from '../entities/quiz-attempt.entity';

export interface CourseProgressResult {
  courseId: string;
  studentId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  quizPassed: boolean;
  courseCompleted: boolean;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressTracking)
    private progressRepository: Repository<ProgressTracking>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Chapter)
    private chapterRepository: Repository<Chapter>,
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(QuizAttempt)
    private quizAttemptRepository: Repository<QuizAttempt>,
  ) { }

  // CUR-008: Mark a lesson as complete (strict sequential validation)
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

  // CUR-009: Track Course Progress
  async getCourseProgress(courseId: string, studentId: string): Promise<CourseProgressResult> {
    // Load all chapters for the course ordered by sequence
    const chapters = await this.chapterRepository.find({
      where: { courseId },
      order: { sequenceOrder: 'ASC' },
    });

    if (chapters.length === 0) {
      return {
        courseId,
        studentId,
        totalLessons: 0,
        completedLessons: 0,
        progressPercent: 0,
        quizPassed: false,
        courseCompleted: false,
      };
    }

    // Load all lessons for those chapters
    const chapterIds = chapters.map(c => c.id);
    const lessons = await this.lessonRepository.find({
      where: { chapterId: In(chapterIds) },
      order: { sequenceOrder: 'ASC' },
    });

    const totalLessons = lessons.length;

    // Load the student's completion records for these lessons
    let completedLessons = 0;
    if (totalLessons > 0) {
      const lessonIds = lessons.map(l => l.id);
      const completedRecords = await this.progressRepository.find({
        where: { studentId, lessonId: In(lessonIds), isCompleted: true },
      });
      completedLessons = completedRecords.length;
    }

    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // CUR-009: Quiz passed = latest quiz attempt for this course has passed = true
    // Business rule: Quiz contributes to completion; course is complete only when
    // all lessons done AND quiz passed.
    const courseQuizzes = await this.quizRepository.find({ where: { courseId } });
    let quizPassed = false;

    if (courseQuizzes.length > 0) {
      const quizIds = courseQuizzes.map(q => q.id);
      // Find the most recent passed attempt across all quizzes for this course
      const passedAttempt = await this.quizAttemptRepository.findOne({
        where: { studentId, quizId: In(quizIds), passed: true },
        order: { submittedAt: 'DESC' },
      });
      quizPassed = !!passedAttempt;
    } else {
      
      quizPassed = false;
    }

    const courseCompleted = progressPercent === 100 && quizPassed;

    return {
      courseId,
      studentId,
      totalLessons,
      completedLessons,
      progressPercent,
      quizPassed,
      courseCompleted,
    };
  }
}
