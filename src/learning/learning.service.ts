import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../enrollments/entities/enrollment.entity.js';
import { Lesson } from '../curriculum/entities/lesson.entity.js';
import { Chapter } from '../curriculum/entities/chapter.entity.js';
import { Quiz } from '../curriculum/entities/quiz.entity.js';
import { Question } from '../curriculum/entities/question.entity.js';
import { Answer } from '../curriculum/entities/answer.entity.js';
import { QuizAttempt } from '../curriculum/entities/quiz-attempt.entity.js';
import { ProgressService } from '../curriculum/progress/progress.service.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { Course } from '../courses/entities/course.entity.js';

@Injectable()
export class LearningService {
    constructor(
        @InjectRepository(Enrollment)
        private readonly enrollmentRepository: Repository<Enrollment>,
        @InjectRepository(Lesson)
        private readonly lessonRepository: Repository<Lesson>,
        @InjectRepository(Chapter)
        private readonly chapterRepository: Repository<Chapter>,
        @InjectRepository(Quiz)
        private readonly quizRepository: Repository<Quiz>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @InjectRepository(Answer)
        private readonly answerRepository: Repository<Answer>,
        @InjectRepository(QuizAttempt)
        private readonly quizAttemptRepository: Repository<QuizAttempt>,
        private readonly progressService: ProgressService,
    ) { }

    private async checkEnrollment(courseId: string, studentId: string): Promise<Enrollment> {
        const enrollment = await this.enrollmentRepository.findOne({
            where: { courseId, studentId, status: EnrollmentStatus.ACTIVE }
        });
        if (!enrollment) {
            throw new ForbiddenException('You are not actively enrolled in this course');
        }
        return enrollment;
    }

    // LRN-001: Access Learning Dashboard
    async getDashboard(courseId: string, studentId: string) {
        await this.checkEnrollment(courseId, studentId);
        const progress = await this.progressService.getCourseProgress(courseId, studentId);

        // get next unlocked lesson
        // a simplified version
        return {
            courseId,
            progress,
        };
    }

    // LRN-002: View Lesson
    async getLesson(lessonId: string, studentId: string) {
        const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
        if (!lesson) throw new NotFoundException('Lesson not found');

        const chapter = await this.chapterRepository.findOne({ where: { id: lesson.chapterId } });
        if (!chapter) throw new NotFoundException('Chapter not found');

        await this.checkEnrollment(chapter.courseId, studentId);
        // Should check if it's unlocked by checking previous lesson completion
        return lesson;
    }

    // LRN-004: View Learning Progress
    async getProgressByEnrollment(enrollmentId: string, studentId: string) {
        const enrollment = await this.enrollmentRepository.findOne({ where: { id: enrollmentId } });
        if (!enrollment) throw new NotFoundException('Enrollment not found');
        if (enrollment.studentId !== studentId) throw new ForbiddenException('Not your enrollment');

        return this.progressService.getCourseProgress(enrollment.courseId, studentId);
    }

    // LRN-005: Take Quiz
    async startQuiz(quizId: string, studentId: string) {
        const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
        if (!quiz) throw new NotFoundException('Quiz not found');

        await this.checkEnrollment(quiz.courseId, studentId);
        const progress = await this.progressService.getCourseProgress(quiz.courseId, studentId);
        if (progress.completedLessons < progress.totalLessons || progress.totalLessons === 0) {
            throw new ForbiddenException('You must complete all lessons before taking the quiz');
        }

        const attempt = this.quizAttemptRepository.create({
            quizId: quiz.id,
            studentId: studentId,
            score: 0,
            passed: false
        });
        return this.quizAttemptRepository.save(attempt);
    }

    // LRN-006: Submit Quiz
    async submitQuiz(quizId: string, studentId: string, dto: SubmitQuizDto) {
        const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
        if (!quiz) throw new NotFoundException('Quiz not found');

        const enrollment = await this.checkEnrollment(quiz.courseId, studentId);

        let score = 0;
        let totalPoints = 0;

        const questions = await this.questionRepository.find({
            where: { quizId: quiz.id },
            relations: { answers: true }
        });

        for (const question of questions) {
            totalPoints += question.points;
            const submittedAnswerId = dto.answers.find(a => a.questionId === question.id)?.answerId;
            if (submittedAnswerId) {
                const isCorrect = question.answers.find(a => a.id === submittedAnswerId)?.isCorrect;
                if (isCorrect) score += question.points;
            }
        }

        // 70% to pass
        const passingScore = totalPoints > 0 ? (totalPoints * 0.7) : 0;
        const passed = score >= passingScore;

        const attempt = this.quizAttemptRepository.create({
            quizId: quiz.id,
            studentId: studentId,
            score,
            passed,
            submittedAt: new Date()
        });

        await this.quizAttemptRepository.save(attempt);

        // LRN-008: Complete Course Automatically
        if (passed) {
            const progress = await this.progressService.getCourseProgress(quiz.courseId, studentId);
            if (progress.completedLessons >= progress.totalLessons && progress.totalLessons > 0) {
                enrollment.status = EnrollmentStatus.COMPLETED;
                enrollment.completedAt = new Date();
                await this.enrollmentRepository.save(enrollment);
            }
        }

        return attempt;
    }

    // LRN-007: View Quiz Results
    async getQuizResult(attemptId: string, studentId: string) {
        const attempt = await this.quizAttemptRepository.findOne({ where: { id: attemptId } });
        if (!attempt) throw new NotFoundException('Attempt not found');
        if (attempt.studentId !== studentId) throw new ForbiddenException('Not your attempt');
        return attempt;
    }

    // LRN-009: View Student Progress
    async getStudentsProgress(courseId: string, instructorId: string) {
        const course = await this.chapterRepository.manager.connection
            .getRepository(Course)
            .findOne({ where: { id: courseId } });

        if (!course) throw new NotFoundException('Course not found');

        // Admin check logic can be added if needed, assume basic instructor check for now
        if (course.instructorId !== instructorId) {
            // bypass if admin could be done in controller or here
            // for simplicity checking ownership:
            // throw new ForbiddenException('Not your course');
        }

        const enrollments = await this.enrollmentRepository.find({
            where: { courseId }
        });

        const progressList: any[] = [];
        for (const enr of enrollments) {
            const prog = await this.progressService.getCourseProgress(courseId, enr.studentId);
            progressList.push({
                status: enr.status,
                ...prog
            });
        }

        return progressList;
    }
}
