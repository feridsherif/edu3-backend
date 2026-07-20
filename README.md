# Edu3 Backend (Edu-Onchain)

A progressive Node.js framework for building efficient and scalable server-side applications for an educational and e-learning platform.

## Overview

Edu3-Backend is a comprehensive learning management system (LMS) designed with a strict Role-Based Access Control (RBAC) architecture. It empowers organizations to manage courses, instructors, students, and curriculum seamlessly. 

The platform supports an entire course lifecycle—from drafting curriculum to managerial reviews and final publication—alongside robust student enrollment and progress-tracking capabilities.

## User Stories & Core Features

### 1. Role-Based Access Control (RBAC) & Departments
- **Roles:** The system supports `Admin`, `Curriculum Manager`, `Instructor`, and `Student` roles.
- **Departments:** Users such as Instructors and Curriculum Managers are tied to specific departments, enabling granular access control and isolated workflows.

### 2. Invitations System
- **Admins** can securely invite Instructors and Curriculum Managers to join the platform via email links.
- Users can accept invitations, set their passwords, and activate their accounts.
- Admins have the ability to resend invitations if they expire or get lost.

### 3. Course Creation Lifecycle
- **Instructors** can create and manage courses. 
- Courses go through a structured lifecycle: `DRAFT` ➔ `PENDING_REVIEW` ➔ `APPROVED` (or `REJECTED`) ➔ `PUBLISHED`.
- **Curriculum Managers** review courses submitted by instructors in their department and can approve or reject them with mandatory comments.

### 4. Curriculum Management
- While a course is in the `DRAFT` or `REJECTED` state, **Instructors** can build out the curriculum.
- **Chapters & Lessons:** Organize content sequentially.
- **Quizzes & Questions:** Create assessments with multiple-choice questions and defined correct answers to test student knowledge.
- The curriculum is locked from edits once the course is submitted for review or published.

### 5. Enrollments & Learning
- **Students** can view the catalog of published courses and enroll in them.
- **Progress Tracking:** Students can access curriculum content, complete lessons, take quizzes, and track their overall progress throughout the course.

## Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Database:** PostgreSQL (via [TypeORM](https://typeorm.io/))
- **Authentication:** JWT (JSON Web Tokens) & Passport
- **Background Jobs:** BullMQ / Redis (for email sending & heavy tasks)
- **API Documentation:** Swagger / OpenAPI
- **Testing:** Jest

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Redis (for BullMQ)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd edu3-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and configure your database, Redis, JWT secrets, and mail provider settings.

4. Run Database Migrations (if applicable):
   ```bash
   npm run migration:run
   ```

### Running the Application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Documentation

Once the application is running, you can access the interactive API documentation (Swagger UI) at:
`http://localhost:3000/api` (or whichever port you have configured). 

The Swagger UI provides detailed information on all available endpoints, required payloads, and authorization requirements.
