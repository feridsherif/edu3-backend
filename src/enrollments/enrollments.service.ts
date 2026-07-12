import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class EnrollmentsService {
    constructor(
        @InjectRepository(Enrollment)
        private readonly enrollmentsRepository: Repository<Enrollment>,
        private readonly coursesService: CoursesService,
        private readonly usersService: UsersService,
    ) { }

    async enroll(courseId: string, requester: any): Promise<Enrollment> {
        const user = await this.usersService.findByIdWithPermissions(requester.id || requester.sub);
        const course = await this.coursesService.findOne(courseId);

        if (course.status !== 'Published') { // CourseStatus.PUBLISHED but we compare string
            throw new BadRequestException('Course is not published');
        }
        if (!course.isActive) {
            throw new BadRequestException('Course is not active');
        }

        const existingEnrollment = await this.enrollmentsRepository.findOne({
            where: { studentId: user.id, courseId: course.id }
        });

        if (existingEnrollment) {
            throw new ConflictException('Already enrolled in this course');
        }

        const enrollment = this.enrollmentsRepository.create({
            student: user,
            course: course,
            status: EnrollmentStatus.ACTIVE
        });

        return this.enrollmentsRepository.save(enrollment);
    }

    async findMyEnrollments(requester: any): Promise<Enrollment[]> {
        const studentId = requester.id || requester.sub;
        return this.enrollmentsRepository.find({
            where: { studentId },
            relations: { course: true }
        });
    }

    async findCourseEnrollments(courseId: string, requester: any): Promise<Enrollment[]> {
        const user = await this.usersService.findByIdWithPermissions(requester.id || requester.sub);
        const course = await this.coursesService.findOne(courseId);

        // Business Rules:
        // Instructor only sees enrollments for their own courses.
        // Admin may view all enrollments.
        const isAdmin = user.role.name.toLowerCase() === 'admin';
        const isInstructor = user.role.name.toLowerCase() === 'instructor';

        if (isInstructor && course.instructorId !== user.id && !isAdmin) {
            throw new ForbiddenException('You can only view enrollments for your own courses');
        }

        return this.enrollmentsRepository.find({
            where: { courseId },
            relations: { student: true, course: true }
        });
    }

    async findOneFor(id: string, requester: any): Promise<Enrollment> {
        const user = await this.usersService.findByIdWithPermissions(requester.id || requester.sub);
        const enrollment = await this.enrollmentsRepository.findOne({
            where: { id },
            relations: { student: true, course: true }
        });

        if (!enrollment) {
            throw new NotFoundException(`Enrollment with ID ${id} not found`);
        }

        const isAdmin = user.role.name.toLowerCase() === 'admin';
        const isInstructor = user.role.name.toLowerCase() === 'instructor';
        const isStudent = user.role.name.toLowerCase() === 'student';

        if (isStudent && enrollment.studentId !== user.id) {
            throw new ForbiddenException('You can only view your own enrollments');
        }

        if (isInstructor && enrollment.course.instructorId !== user.id && !isAdmin) {
            throw new ForbiddenException('You can only view enrollments for your own courses');
        }

        return enrollment;
    }

    async cancelEnrollment(id: string, requester: any): Promise<void> {
        const enrollment = await this.findOneFor(id, requester);
        const user = await this.usersService.findByIdWithPermissions(requester.id || requester.sub);
        // Only student can cancel their own enrollment
        if (user.role.name.toLowerCase() === 'student' && enrollment.studentId !== user.id) {
            throw new ForbiddenException('You can only cancel your own enrollments');
        }

        // TODO: we have to Ensure no lesson progress has been recorded (Depends on MOD-007)
        // For now we will allow cancellation directly as long as it's not completed
        if (enrollment.status === EnrollmentStatus.COMPLETED || enrollment.completedAt) {
            throw new BadRequestException('Cannot cancel a completed enrollment');
        }

        await this.enrollmentsRepository.remove(enrollment);
    }

    async updateStatus(id: string, status: string): Promise<Enrollment> {
        const enrollment = await this.enrollmentsRepository.findOne({ where: { id } });
        if (!enrollment) throw new NotFoundException(`Enrollment with ID ${id} not found`);

        if (status === 'Suspended') enrollment.status = EnrollmentStatus.SUSPENDED;
        if (status === 'Active') enrollment.status = EnrollmentStatus.ACTIVE;

        return this.enrollmentsRepository.save(enrollment);
    }
}
