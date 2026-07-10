import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Question } from '../entities/question.entity';
import { Answer } from '../entities/answer.entity';
import { Course, CourseStatus } from '../../courses/entities/course.entity';
import { CreateQuizDto } from '../dto/create-quiz.dto';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  private validateCourseEditable(course: Course, instructorId: string) {
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('You do not own this course');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new ForbiddenException('Course is not in an editable state');
    }
  }

  async createQuiz(courseId: string, instructorId: string, createQuizDto: CreateQuizDto): Promise<Quiz> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.validateCourseEditable(course, instructorId);

    const quiz = this.quizRepository.create({
      ...createQuizDto,
      courseId,
    });

    return this.quizRepository.save(quiz);
  }

  async addQuestion(quizId: string, instructorId: string, createQuestionDto: CreateQuestionDto): Promise<Question> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const course = await this.courseRepository.findOne({ where: { id: quiz.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.validateCourseEditable(course, instructorId);

    // Validate that exactly one answer is correct
    const correctAnswersCount = createQuestionDto.answers.filter(a => a.isCorrect).length;
    if (correctAnswersCount !== 1) {
      throw new BadRequestException('Exactly one correct answer is required per question');
    }

    let sequenceOrder = createQuestionDto.sequenceOrder;
    if (sequenceOrder === undefined) {
      const lastQuestion = await this.questionRepository.findOne({
        where: { quizId },
        order: { sequenceOrder: 'DESC' },
      });
      sequenceOrder = lastQuestion ? lastQuestion.sequenceOrder + 1 : 1;
    } else {
      const existing = await this.questionRepository.findOne({ where: { quizId, sequenceOrder } });
      if (existing) {
        throw new BadRequestException('Question with this sequence order already exists in this quiz');
      }
    }

    const question = this.questionRepository.create({
      questionText: createQuestionDto.questionText,
      points: createQuestionDto.points,
      sequenceOrder,
      quizId,
    });

    const savedQuestion = await this.questionRepository.save(question);

    const answers = createQuestionDto.answers.map(ans => this.answerRepository.create({
      ...ans,
      questionId: savedQuestion.id,
    }));

    await this.answerRepository.save(answers);

    const result = await this.questionRepository.findOne({
      where: { id: savedQuestion.id },
      relations: { answers: true },
    });
    
    if (!result) throw new NotFoundException('Question not found after creation');
    
    return result;
  }
}
