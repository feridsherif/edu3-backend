# **Module 1 – Identity & Access Management890**

## **Module ID**

MOD-001

## **Purpose**

Provide a secure authentication and authorization mechanism for all platform users using JWT and Role-Based Access Control (RBAC). The module ensures that only authenticated users with appropriate permissions can access system resources.

## **Actors**

* Admin  
* Instructor  
* Curriculum Manager  
* Student

## **Dependencies**

None.

This is the foundational module required by all other modules.

## 

## **User Stories**

### **Story ID**

**IAM-001**

### **Title**

User Login

### **Description**

Registered users should be able to authenticate using their email and password and receive a JWT token for accessing protected resources.

### **Actors**

* Admin  
* Instructor  
* Curriculum Manager  
* Student

### **Preconditions**

* User account exists.  
* Account is active.  
* Password has been set.  
* Invitation (if applicable) has been accepted.

### **Success Flow**

1. User enters email.  
2. User enters password.  
3. System validates credentials.  
4. JWT Access Token is generated.  
5. User information and permissions are returned.  
6. User is redirected to the appropriate dashboard.

### **Alternative Flow**

* Invalid credentials  
* Inactive account  
* Password not yet created

### **Post Conditions**

* User is authenticated.  
* JWT token is issued.  
* Login event is recorded.

### **Permissions Required**

None (Public Endpoint)

### **API Endpoints**

POST /api/auth/login  
POST /api/auth/logout  
POST /api/auth/refresh

### **Database Tables**

#### **users**

| Column | Type |
| ----- | ----- |
| id | uuid |
| department\_id | uuid nullable |
| first\_name | string |
| last\_name | string |
| email | string unique |
| password | string |
| role\_id | uuid |
| status | enum(active,inactive,pending) |
| email\_verified\_at | timestamp |
| last\_login\_at | timestamp |
| created\_at | timestamp |
| updated\_at | timestamp |

### **Validation Rules**

* Email required  
* Email must exist  
* Password required  
* Account must be active

### **Business Rules**

* JWT expires after configured duration.  
* Inactive users cannot log in.  
* Pending invitation users cannot log in.  
* Only one active session policy (optional).  
* Login attempts should be rate limited.

---

## **Story ID**

**IAM-002**

### **Title**

Accept Invitation & Activate Account

### **Description**

An invited Instructor or Curriculum Manager should activate their account using the invitation email before logging into the system.

### **Actors**

* Instructor  
* Curriculum Manager

### **Preconditions**

* Invitation has been created.  
* Invitation token is valid.

### **Success Flow**

1. User clicks invitation link.  
2. System validates token.  
3. User sets password.  
4. Account becomes Active.  
5. User is redirected to login.

### **Permissions Required**

Public Endpoint

### **API Endpoints**

GET /api/invitations/{token}

POST /api/invitations/accept

### **Database Tables**

#### **user\_invitations**

| Column | Type |
| ----- | ----- |
| id | uuid |
| user\_id | uuid |
| token | string |
| expires\_at | timestamp |
| accepted\_at | timestamp nullable |
| created\_at | timestamp |

### **Validation Rules**

* Token must exist.  
* Token must not expire.  
* Password confirmation required.

### **Business Rules**

* Invitation can only be accepted once.  
* Expired invitations become invalid.  
* Password must satisfy password policy.

---

## **Story ID**

**IAM-003**

### **Title**

Role-Based Authorization

### **Description**

Every authenticated request should be authorized according to the user's assigned role and permissions.

### **Actors**

* System

### **Permissions**

Applies to all authenticated requests.

### **Database Tables**

#### **roles**

| Column | Type |
| ----- | ----- |
| id | uuid |
| name | string |
| description | string |

#### **permissions**

| Column | Type |
| ----- | ----- |
| id | uuid |
| name | string |
| code | string |

#### **role\_permissions**

| Column | Type |
| ----- | ----- |
| role\_id | uuid |
| permission\_id | uuid |

### **Business Rules**

* Users inherit permissions from their assigned role.  
* A user can have only one role.  
* Every protected API validates permissions before execution.

---

## **Story ID**

**IAM-004**

### **Title**

View & Update Profile

### **Actors**

* Admin  
* Instructor  
* Curriculum Manager  
* Student

### **Permissions Required**

profile.view

profile.update

### **API Endpoints**

GET /api/profile

PUT /api/profile

### **Database Tables**

Uses

* users

### **Editable Fields**

* First Name  
* Last Name  
* Profile Picture  
* Phone Number

### **Non-editable Fields**

* Email  
* Department  
* Role

### **Business Rules**

* Users may only edit their own profile.  
* Email changes require a separate verification workflow (if supported).  
* Role and department assignments can only be modified by an Admin.

# **Module 2 – Department Management**

# **Module ID**

MOD-002

# **Purpose**

Provide a centralized mechanism for managing departments within the platform. Departments serve as the organizational unit for instructors, curriculum managers, and courses. Every instructor, curriculum manager, and course must belong to exactly one department.

# **Actors**

* Admin  
* Curriculum Manager (Read Only)  
* Instructor (Read Only)

# **Dependencies**

* Module 1 – Identity & Access Management

# **User Stories**

# **Story ID**

**DEP-001**

## **Title**

Create Department

## **Description**

As an Admin, I want to create a department so that instructors, curriculum managers, and courses can be organized under a specific academic or organizational unit.

## **Actors**

* Admin

## **Preconditions**

* User is authenticated.  
* User has department creation permission.

## **Success Flow**

1. Admin navigates to Department Management.  
2. Admin clicks **Create Department**.  
3. Admin enters department details.  
4. System validates uniqueness.  
5. Department is created.  
6. Department becomes available for assignment.

## **Alternative Flow**

* Department name already exists.  
* Invalid input.  
* Unauthorized user.

## **Post Conditions**

* Department record is created.  
* Audit log is recorded.

### **Permissions Required**

department.create

### **API Endpoints**

POST /api/departments

### **Database Tables**

#### **departments**

| Column | Type | Description |
| ----- | ----- | ----- |
| id | UUID | Primary Key |
| name | VARCHAR(150) | Unique Department Name |
| code | VARCHAR(20) | Unique Department Code |
| description | TEXT | Nullable |
| is\_active | BOOLEAN | Default TRUE |
| created\_by | UUID | FK users |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

### **Validation Rules**

* Name is required.  
* Name must be unique.  
* Code is required.  
* Code must be unique.  
* Description optional.

### **Business Rules**

* Department names must be unique.  
* Department codes must be unique.  
* Departments are available immediately after creation.  
* Only Admins may create departments.

---

# **Story ID**

**DEP-002**

## **Title**

Update Department

## **Description**

Allow an Admin to update department information.

## **Actors**

* Admin

## **Preconditions**

* Department exists.  
* User has update permission.

## **Success Flow**

1. Admin opens department.  
2. Updates information.  
3. Saves changes.  
4. System validates uniqueness.  
5. Department updated.

## **Alternative Flow**

* Duplicate department name.  
* Duplicate code.  
* Department not found.

## **Post Conditions**

Department information updated.

### **Permissions Required**

department.update

### **API Endpoints**

PUT /api/departments/{id}

### **Database Tables**

Uses:

* departments

### **Validation Rules**

* Name unique.  
* Code unique.

### **Business Rules**

* Updating a department does not affect existing users.  
* Existing course assignments remain unchanged.

---

# **Story ID**

**DEP-003**

## **Title**

Activate / Deactivate Department

## **Description**

Allow Admins to control whether a department is available for future assignments.

## **Actors**

* Admin

## **Preconditions**

* Department exists.

## **Success Flow**

1. Admin selects department.  
2. Toggles active status.  
3. System updates status.

## **Alternative Flow**

Department not found.

### **Permissions Required**

department.status.update

### **API Endpoints**

PATCH /api/departments/{id}/status

### **Database Tables**

Uses:

* departments

### **Validation Rules**

* Status must be boolean.

### **Business Rules**

* Inactive departments cannot receive new instructors.  
* Inactive departments cannot receive new curriculum managers.  
* Inactive departments cannot receive new courses.  
* Existing users remain assigned.  
* Existing courses remain unchanged.

---

# **Story ID**

**DEP-004**

## **Title**

View Department List

## **Description**

Allow authorized users to browse departments.

## **Actors**

* Admin  
* Instructor  
* Curriculum Manager

## **Preconditions**

Authenticated user.

## **Success Flow**

1. User opens Departments.  
2. System returns department list.  
3. User may search or filter.

### **Permissions Required**

department.view

### **API Endpoints**

GET /api/departments  
GET /api/departments/{id}

### **Database Tables**

Uses:

* departments

### **Business Rules**

* Instructors only see their assigned department.  
* Curriculum Managers only see their assigned department.  
* Admin sees all departments.

---

# **Story ID**

**DEP-005**

## **Title**

View Department Members

## **Description**

Allow authorized users to view instructors and curriculum managers assigned to a department.

## **Actors**

* Admin  
* Curriculum Manager

## **Preconditions**

Department exists.

## **Success Flow**

1. User opens department.  
2. System retrieves members.  
3. Members displayed by role.

### **Permissions Required**

department.members.view

### **API Endpoints**

GET /api/departments/{id}/members

### **Database Tables**

Uses

* departments  
* users

### **Business Rules**

* Admin may view all departments.  
* Curriculum Manager may only view members within their own department.  
* Students have no access.

---

# **Database Schema**

## **departments**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| name | VARCHAR(150) | UNIQUE |
| code | VARCHAR(20) | UNIQUE |
| description | TEXT | NULL |
| is\_active | BOOLEAN | DEFAULT TRUE |
| created\_by | UUID | FK users |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

# **Module 3 – User Management**

# **Module ID**

**MOD-003**

# **Purpose**

Provide centralized user lifecycle management for platform users. The module enables administrators to create, invite, assign, activate, deactivate, and manage users while enforcing department assignments and role-based access control.

# **Actors**

* Admin  
* Instructor (Read Only)  
* Curriculum Manager (Read Only)  
* Student (Self Profile Only)

# **Dependencies**

* Module 1 – Identity & Access Management  
* Module 2 – Department Management

# **User Stories**

# **Story ID**

**USR-001**

## **Title**

Create Instructor

### **Description**

As an Admin, I want to create an Instructor account and assign it to a department so the instructor can develop and manage courses.

### **Actors**

* Admin

### **Preconditions**

* Admin is authenticated.  
* Department exists and is active.  
* Email is not already registered.

### **Success Flow**

1. Admin opens User Management.  
2. Selects **Create Instructor**.  
3. Enters instructor details.  
4. Selects a department.  
5. System creates a pending account.  
6. Invitation email is sent.  
7. User status becomes **Pending Activation**.

### **Alternative Flow**

* Email already exists.  
* Department inactive.  
* Department not found.

### **Post Conditions**

* Instructor account created.  
* Invitation email queued.  
* Audit log recorded.

### **Permissions Required**

user.instructor.create

### **API Endpoints**

POST /api/users/instructors

### **Database Tables**

Uses:

* users  
* departments  
* user\_invitations

### **Validation Rules**

* First name required.  
* Last name required.  
* Valid email.  
* Email unique.  
* Department required.  
* Department must be active.

### **Business Rules**

* Instructor belongs to exactly one department.  
* Instructor receives an invitation email.  
* Account remains pending until invitation is accepted.  
* Only Admins may create instructors.

---

# **Story ID**

**USR-002**

## **Title**

Create Curriculum Manager

### **Description**

Allow an Admin to create a Curriculum Manager responsible for reviewing and approving courses within a department.

### **Actors**

* Admin

### **Preconditions**

* Department exists.  
* Department active.

### **Success Flow**

1. Admin creates Curriculum Manager.  
2. Assigns department.  
3. Invitation email sent.  
4. Account status becomes Pending.

### **Alternative Flow**

* Duplicate email.  
* Department inactive.

### **Post Conditions**

* Curriculum Manager created.  
* Invitation generated.

### **Permissions Required**

user.curriculum\_manager.create

### **API Endpoints**

POST /api/users/curriculum-managers

### **Database Tables**

Uses

* users  
* departments  
* user\_invitations

### **Validation Rules**

* Email unique.  
* Department required.

### **Business Rules**

* Curriculum Manager belongs to one department only.  
* Can only review courses within assigned department.  
* Invitation required before login.

---

# **Story ID**

**USR-003**

## **Title**

View Users

### **Description**

Allow authorized users to browse platform users.

### **Actors**

* Admin  
* Instructor  
* Curriculum Manager

### **Preconditions**

Authenticated user.

### **Success Flow**

1. User opens User Management.  
2. System returns users based on permissions.

### **Alternative Flow**

Unauthorized access.

### **Post Conditions**

None.

### **Permissions Required**

user.view

### **API Endpoints**

GET /api/users  
GET /api/users/{id}

### **Validation Rules**

None.

### **Business Rules**

* Admin sees all users.  
* Instructor may only view students enrolled in their courses.  
* Curriculum Manager may only view instructors within their department.  
* Students cannot access user management.

---

# **Story ID**

**USR-004**

## **Title**

Update User Information

### **Description**

Allow Admin to modify user details.

### **Actors**

* Admin

### **Preconditions**

User exists.

### **Success Flow**

1. Admin opens user.  
2. Updates details.  
3. Saves changes.

### **Alternative Flow**

* User not found.  
* Duplicate email.

### **Post Conditions**

User updated.

### **Permissions Required**

user.update

### **API Endpoints**

PUT /api/users/{id}

### **Database Tables**

Uses

* users

### **Validation Rules**

* Email unique.  
* Department active.

### **Business Rules**

* Role changes are allowed only by Admin.  
* Department changes are allowed only by Admin.  
* Email change requires uniqueness validation.

---

# **Story ID**

**USR-005**

## **Title**

Activate / Deactivate User

### **Description**

Allow Admin to control platform access for users.

### **Actors**

* Admin

### **Preconditions**

User exists.

### **Success Flow**

1. Admin opens user.  
2. Changes status.  
3. User status updated.

### **Alternative Flow**

User not found.

### **Post Conditions**

User can or cannot log in depending on status.

### **Permissions Required**

user.status.update

### **API Endpoints**

PATCH /api/users/{id}/status

### **Database Tables**

Uses

* users

### **Validation Rules**

Status required.

### **Business Rules**

* Inactive users cannot authenticate.  
* Existing records remain unchanged.  
* Historical ownership is preserved.

---

# **Story ID**

**USR-006**

## **Title**

Assign or Transfer Department

### **Description**

Allow Admin to assign or transfer an Instructor or Curriculum Manager to another department.

### **Actors**

* Admin

### **Preconditions**

* User exists.  
* Target department active.

### **Success Flow**

1. Admin selects user.  
2. Chooses department.  
3. Saves assignment.

### **Alternative Flow**

Inactive department.

### **Post Conditions**

Department updated.

### **Permissions Required**

user.department.assign

### **API Endpoints**

PATCH /api/users/{id}/department

### **Database Tables**

Uses

* users  
* departments

### **Validation Rules**

* Department required.  
* Department active.

### **Business Rules**

* User may belong to only one department.  
* Existing courses remain with their original department unless explicitly reassigned.  
* Future permissions are evaluated using the new department.

---

# **Story ID**

**USR-007**

## **Title**

Resend Invitation

### **Description**

Allow an Admin to resend an invitation email to a user who has not yet activated their account.

### **Actors**

* Admin

### **Preconditions**

* User status is Pending.  
* Invitation not accepted.

### **Success Flow**

1. Admin selects pending user.  
2. Clicks **Resend Invitation**.  
3. New invitation email generated.

### **Alternative Flow**

* Account already active.  
* User not found.

### **Post Conditions**

Invitation updated.

### **Permissions Required**

user.invitation.resend

### **API Endpoints**

POST /api/users/{id}/resend-invitation

### **Database Tables**

Uses

* user\_invitations

### **Validation Rules**

Pending account required.

### **Business Rules**

* Previous invitation becomes invalid.  
* Only latest invitation token remains valid.  
* Invitation expiration resets.

---

# **Database Schema**

## **users**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| department\_id | UUID | FK departments (nullable for Admin/Student) |
| role\_id | UUID | FK roles |
| first\_name | VARCHAR(100) |  |
| last\_name | VARCHAR(100) |  |
| email | VARCHAR(255) | UNIQUE |
| phone | VARCHAR(30) | NULL |
| password | VARCHAR(255) | NULL (before activation) |
| status | ENUM(pending, active, inactive) | DEFAULT pending |
| last\_login\_at | TIMESTAMP | NULL |
| email\_verified\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

---

## **user\_invitations**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| user\_id | UUID | FK users |
| token | VARCHAR(255) | UNIQUE |
| expires\_at | TIMESTAMP |  |
| accepted\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP |  |

# **Module 4 – Course Management**

# **Module ID**

**MOD-004**

# **Purpose**

Provide a complete lifecycle for course creation, review, approval, publication, and availability management. The module governs how instructors create educational content, how Curriculum Managers review it, and how courses become available to students.

# **Actors**

* Admin  
* Instructor  
* Curriculum Manager  
* Student (Read Only)

# **Dependencies**

* Module 1 – Identity & Access Management  
* Module 2 – Department Management  
* Module 3 – User Management

# **User Stories**

# **Story ID**

**CRS-001**

## **Title**

Create Course

### **Description**

As an Instructor, I want to create a course under my assigned department so that I can build learning content before submitting it for review.

### **Actors**

* Instructor

### **Preconditions**

* Instructor is authenticated.  
* Instructor belongs to an active department.  
* Course title is unique within the department.

### **Success Flow**

1. Instructor selects **Create Course**.  
2. Enters course information.  
3. Saves the course.  
4. Course is created in **Draft** status.

### **Alternative Flow**

* Department inactive.  
* Duplicate course title.  
* Unauthorized user.

### **Post Conditions**

* Course is created.  
* Instructor becomes the course owner.  
* Audit log recorded.

### **Permissions Required**

course.create

### **API Endpoints**

POST /api/courses

### **Database Tables**

Uses

* courses

### **Validation Rules**

* Title required.  
* Description required.  
* Course image optional.  
* Department assigned automatically from instructor.

### **Business Rules**

* Every course belongs to one department.  
* Every course has one owner.  
* Initial status is **Draft**.  
* Initial availability is **Disabled**.

---

# **Story ID**

**CRS-002**

## **Title**

Update Course

### **Description**

Allow an Instructor to modify a course while it is in Draft or Rejected status.

### **Actors**

* Instructor

### **Preconditions**

* Instructor owns the course.  
* Course status is Draft or Rejected.

### **Success Flow**

1. Instructor edits course.  
2. Saves changes.  
3. Course updated.

### **Alternative Flow**

* Course already under review.  
* Course published.  
* Unauthorized access.

### **Post Conditions**

Course updated.

### **Permissions Required**

course.update

### **API Endpoints**

PUT /api/courses/{id}

### **Business Rules**

* Approved and Published courses cannot be edited directly.  
* Rejected courses may be edited and resubmitted.

---

# **Story ID**

**CRS-003**

## **Title**

Delete Course

### **Description**

Allow an Instructor to permanently remove a course that has not yet been submitted for review.

### **Actors**

* Instructor

### **Preconditions**

* Instructor owns the course.  
* Status \= Draft.

### **Success Flow**

1. Instructor deletes course.  
2. System confirms.  
3. Course removed.

### **Alternative Flow**

* Course already submitted.  
* Students enrolled.

### **Post Conditions**

Course deleted.

### **Permissions Required**

course.delete

### **API Endpoints**

DELETE /api/courses/{id}

### **Business Rules**

* Only Draft courses can be deleted.  
* Published courses cannot be deleted.  
* Soft deletes are recommended.

---

# **Story ID**

**CRS-004**

## **Title**

Submit Course for Review

### **Description**

Allow an Instructor to submit a completed course to the Curriculum Manager for review.

### **Actors**

* Instructor

### **Preconditions**

* Course is Draft or Rejected.  
* Minimum required content exists.  
* At least one chapter.  
* At least one lesson.  
* At least one quiz.

### **Success Flow**

1. Instructor clicks **Submit for Review**.  
2. Validation performed.  
3. Status changes to **Pending Review**.  
4. Curriculum Manager notified.

### **Alternative Flow**

* Missing required content.  
* Already submitted.

### **Post Conditions**

Course enters review workflow.

### **Permissions Required**

course.submit

### **API Endpoints**

POST /api/courses/{id}/submit

### **Business Rules**

* Course becomes read-only.  
* Only Curriculum Managers from the same department can review it.

---

# **Story ID**

**CRS-005**

## **Title**

Review Course

### **Description**

Allow the Curriculum Manager to evaluate submitted courses.

### **Actors**

* Curriculum Manager

### **Preconditions**

* Course status is Pending Review.  
* Same department.

### **Success Flow**

1. Curriculum Manager opens course.  
2. Reviews curriculum.  
3. Chooses Approve or Reject.

### **Alternative Flow**

* Different department.  
* Course already reviewed.

### **Post Conditions**

Review completed.

### **Permissions Required**

course.review

### **API Endpoints**

GET /api/courses/{id}/review

### **Business Rules**

* Reviewer cannot review courses outside their department.  
* Reviewer cannot modify course content.

---

# **Story ID**

**CRS-006**

## **Title**

Approve Course

### **Description**

Approve a reviewed course so it becomes eligible for publication.

### **Actors**

* Curriculum Manager

### **Preconditions**

* Course pending review.

### **Success Flow**

1. Click Approve.  
2. Status changes to Approved.  
3. Instructor notified.

### **Alternative Flow**

Already approved.

### **Post Conditions**

Course ready for publication.

### **Permissions Required**

course.approve

### **API Endpoints**

PATCH /api/courses/{id}/approve

### **Business Rules**

* Only Curriculum Manager can approve.  
* Approval timestamp recorded.  
* Approver recorded.

---

# **Story ID**

**CRS-007**

## **Title**

Reject Course

### **Description**

Reject a course and provide revision comments.

### **Actors**

* Curriculum Manager

### **Preconditions**

Pending Review.

### **Success Flow**

1. Click Reject.  
2. Enter comments.  
3. Status becomes Rejected.  
4. Instructor notified.

### **Alternative Flow**

Comments omitted.

### **Post Conditions**

Course editable again.

### **Permissions Required**

course.reject

### **API Endpoints**

PATCH /api/courses/{id}/reject

### **Business Rules**

* Comments mandatory.  
* Course becomes editable.  
* Review history preserved.

---

# **Story ID**

**CRS-008**

## **Title**

Publish Course

### **Description**

Allow an Instructor to publish an approved course.

### **Actors**

* Instructor

### **Preconditions**

* Course Approved.  
* Instructor owns course.

### **Success Flow**

1. Instructor clicks Publish.  
2. Status becomes Published.  
3. Course available for activation.

### **Alternative Flow**

Not approved.

### **Post Conditions**

Course published.

### **Permissions Required**

course.publish

### **API Endpoints**

PATCH /api/courses/{id}/publish

### **Business Rules**

* Only Approved courses may be published.  
* Published timestamp recorded.

---

# **Story ID**

**CRS-009**

## **Title**

Toggle Course Availability

### **Description**

Allow Instructor or Admin to control whether students can enroll in a published course.

### **Actors**

* Instructor  
* Admin

### **Preconditions**

Course Published.

### **Success Flow**

1. Toggle availability.  
2. Status updated.

### **Alternative Flow**

Course unpublished.

### **Post Conditions**

Enrollment enabled or disabled.

### **Permissions Required**

course.availability.update

### **API Endpoints**

PATCH /api/courses/{id}/availability

### **Business Rules**

* Only Published courses may be activated.  
* Existing enrollments remain unaffected.  
* Disabled courses disappear from the public catalog but remain visible to enrolled students.

---

# **Story ID**

**CRS-010**

## **Title**

View Course Catalog

### **Description**

Allow users to browse available courses according to their role.

### **Actors**

* Student  
* Instructor  
* Curriculum Manager  
* Admin

### **Preconditions**

None.

### **Success Flow**

1. User opens course catalog.  
2. System returns visible courses.

### **Permissions Required**

course.view

### **API Endpoints**

GET /api/courses  
GET /api/courses/{id}

### **Business Rules**

* Students only see Published and Active courses.  
* Instructors see their own courses.  
* Curriculum Managers see departmental courses.  
* Admin sees all courses.

---

# **Database Schema**

## **courses**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| instructor\_id | UUID | FK users |
| department\_id | UUID | FK departments |
| title | VARCHAR(255) |  |
| slug | VARCHAR(255) | UNIQUE |
| short\_description | VARCHAR(500) |  |
| description | LONGTEXT |  |
| thumbnail | VARCHAR(255) | NULL |
| difficulty\_level | ENUM(Beginner, Intermediate, Advanced) |  |
| estimated\_duration | INTEGER | Minutes |
| language | VARCHAR(50) |  |
| status | ENUM(Draft, Pending Review, Approved, Rejected, Published) |  |
| is\_active | BOOLEAN | DEFAULT FALSE |
| rejection\_comments | TEXT | NULL |
| approved\_by | UUID | FK users |
| approved\_at | TIMESTAMP | NULL |
| published\_at | TIMESTAMP | NULL |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |
| deleted\_at | TIMESTAMP | Soft Delete |

# **Module 5 – Curriculum Management**

# **Module ID**

**MOD-005**

# **Purpose**

Provide a structured system for building course content including chapters, lessons, and quizzes. This module defines how learning materials are organized, sequenced, delivered, and completed by students in a strict linear learning path.

# **Actors**

* Instructor  
* Curriculum Manager (Read Only)  
* Student  
* Admin (Read Only)

# **Dependencies**

* Module 1 – Identity & Access Management  
* Module 2 – Department Management  
* Module 3 – User Management  
* Module 4 – Course Management

# **Core Principle**

Curriculum is strictly sequential. Students cannot skip lessons, chapters, or quizzes.

# **User Stories**

# **Story ID**

**CUR-001**

## **Title**

Create Chapter

### **Description**

As an Instructor, I want to create chapters inside a course so I can organize learning content into structured sections.

### **Actors**

* Instructor

### **Preconditions**

* Course exists.  
* Course belongs to instructor.  
* Course is in Draft or Rejected state.

### **Success Flow**

1. Instructor opens course.  
2. Clicks “Add Chapter”.  
3. Enters chapter title.  
4. System assigns sequence order.  
5. Chapter is created.

### **Alternative Flow**

* Course is Published and locked.  
* Invalid course ownership.

### **Post Conditions**

* Chapter added to course structure.

### **Permissions Required**

chapter.create

### **API Endpoints**

POST /api/courses/{courseId}/chapters

### **Database Tables**

Uses:

* courses  
* chapters

### **Validation Rules**

* Title required  
* Course must be editable  
* Sequence auto-generated unless overridden

### **Business Rules**

* Chapters must belong to a single course.  
* Chapters must follow strict order.  
* Sequence cannot be duplicated within a course.

# **Story ID**

**CUR-002**

## **Title**

Create Lesson (WYSIWYG Content)

### **Description**

As an Instructor, I want to create lessons using a rich text editor so that I can add structured learning content.

### **Actors**

* Instructor

### **Preconditions**

* Chapter exists.  
* Course is editable.

### **Success Flow**

1. Instructor selects chapter.  
2. Clicks “Add Lesson”.  
3. Enters title and content.  
4. Uses WYSIWYG editor.  
5. Saves lesson.

### **Post Conditions**

Lesson is stored and linked to chapter.

### **Permissions Required**

lesson.create

### **API Endpoints**

POST /api/chapters/{chapterId}/lessons

### **Database Tables**

* lessons

### **Validation Rules**

* Title required  
* Content required (HTML)  
* Chapter must exist  
* Sequence auto-assigned

### **Business Rules**

* Lesson content stored as HTML.  
* Lessons follow strict sequence.  
* No skipping allowed for students.

---

# **Story ID**

**CUR-003**

## **Title**

Update Lesson

### **Actors**

* Instructor

### **Preconditions**

* Lesson belongs to instructor’s course  
* Course not published

### **Business Rules**

* Published courses cannot be modified  
* Changes are versioned or blocked

### **API**

PUT /api/lessons/{id}

# **Story ID**

**CUR-004**

## **Title**

Delete Lesson

### **Business Rules**

* Only allowed in Draft/Rejected courses  
* Cannot delete lessons if students enrolled (optional strict rule)

---

# **Story ID**

**CUR-005**

## **Title**

Create Quiz for Course

### **Description**

Each course has one or more quizzes tied to learning completion.

### **Actors**

* Instructor

### **Preconditions**

* Course exists  
* Course editable

### **API**

POST /api/courses/{courseId}/quizzes

### **Business Rules**

* At least one quiz required before submission  
* Quiz is tied to course completion logic

---

# **Story ID**

**CUR-006**

## **Title**

Add Quiz Questions

### **Description**

Instructor creates multiple-choice questions with weighted scoring.

### **Actors**

* Instructor

### **Features**

* Multiple Choice Only  
* Sequence ordering  
* Variable points per question

### **API**

POST /api/quizzes/{quizId}/questions

### **Database Rules**

* Each question has:  
  * text  
  * points  
  * order

### **Business Rules**

* Each question must have at least 2 options  
* Only one correct answer per question  
* Points vary per question

---

# **Story ID**

**CUR-007**

## **Title**

Define Curriculum Sequence Rules

### **Description**

Ensure strict learning order across chapters and lessons.

### **Rules**

* Chapter order must be sequential  
* Lesson order must be sequential  
* Student cannot access:  
  * Next lesson unless current is completed  
  * Next chapter unless all lessons complete

---

# **Story ID**

**CUR-008**

## **Title**

Mark Lesson as Complete

### **Actors**

* Student

### **Preconditions**

* Lesson is unlocked

### **Success Flow**

1. Student views lesson  
2. Clicks “Mark Complete”  
3. System validates progression  
4. Lesson marked complete  
5. Next lesson unlocked

### **Business Rules**

* Completion must be server-validated  
* Cannot mark future lessons complete  
* Progress is strictly tracked

---

# **Story ID**

**CUR-009**

## **Title**

Track Course Progress

### **Actors**

* Student

### **Business Rules**

* Progress \= completed lessons / total lessons  
* Quiz contributes to completion requirement  
* Course is completed only when:  
  * All lessons complete  
  * Quiz passed

# **Database Schema**

## **chapters**

| Field | Type |
| ----- | ----- |
| id | UUID |
| course\_id | UUID |
| title | string |
| sequence\_order | integer |
| created\_at | timestamp |

---

## **lessons**

| Field | Type |
| ----- | ----- |
| id | UUID |
| chapter\_id | UUID |
| title | string |
| content\_html | longtext |
| sequence\_order | integer |
| is\_locked | boolean |

---

## **quizzes**

| Field | Type |
| ----- | ----- |
| id | UUID |
| course\_id | UUID |
| title | string |

---

## **questions**

| Field | Type |
| ----- | ----- |
| id | UUID |
| quiz\_id | UUID |
| question\_text | text |
| points | integer |
| sequence\_order | integer |

---

## **answers**

| Field | Type |
| ----- | ----- |
| id | UUID |
| question\_id | UUID |
| text | string |
| is\_correct | boolean |

---

## **progress\_tracking**

| Field | Type |
| ----- | ----- |
| id | UUID |
| student\_id | UUID |
| lesson\_id | UUID |
| is\_completed | boolean |
| completed\_at | timestamp |

---

## **quiz\_attempts**

| Field | Type |
| ----- | ----- |
| id | UUID |
| student\_id | UUID |
| quiz\_id | UUID |
| score | integer |
| passed | boolean |
| submitted\_at | timestamp |

# **Module 6 – Enrollment Management**

# **Module ID**

**MOD-006**

# **Purpose**

Provide a complete enrollment lifecycle allowing students to enroll in published courses, manage their enrollments, and establish the relationship between students and courses. This module acts as the entry point to the learning journey and serves as the foundation for progress tracking, assessments, and certificate generation.

# **Actors**

* Student  
* Instructor (Read Only)  
* Admin  
* Curriculum Manager (Read Only)

# **Dependencies**

* Module 1 – Identity & Access Management  
* Module 3 – User Management  
* Module 4 – Course Management

# **User Stories**

# **Story ID**

**ENR-001**

## **Title**

Enroll in Course

### **Description**

As a Student, I want to enroll in an available course so that I can begin learning.

### **Actors**

* Student

### **Preconditions**

* Student is authenticated.  
* Course is Published.  
* Course is Active.  
* Student is not already enrolled.

### **Success Flow**

1. Student opens course details.  
2. Clicks **Enroll**.  
3. System validates eligibility.  
4. Enrollment record is created.  
5. Student gains access to the first lesson.

### **Alternative Flow**

* Already enrolled.  
* Course inactive.  
* Course unpublished.  
* Unauthorized access.

### **Post Conditions**

* Enrollment created.  
* Learning progress initialized.  
* Audit log recorded.

### **Permissions Required**

course.enroll

### **API Endpoints**

POST /api/courses/{courseId}/enroll

### **Database Tables**

Uses

* enrollments  
* courses  
* users

### **Validation Rules**

* Student required.  
* Course must be Published.  
* Course must be Active.  
* Duplicate enrollments prohibited.

### **Business Rules**

* Students may enroll only once per course.  
* Enrollment unlocks access to the first lesson only.  
* Enrollment date is recorded.

---

# **Story ID**

**ENR-002**

## **Title**

View My Enrollments

### **Description**

Allow students to view all courses they are currently enrolled in.

### **Actors**

* Student

### **Preconditions**

Authenticated student.

### **Success Flow**

1. Student opens dashboard.  
2. System returns enrolled courses.  
3. Progress percentage displayed.

### **Permissions Required**

enrollment.view.own

### **API Endpoints**

GET /api/enrollments

### **Business Rules**

* Only the authenticated student's enrollments are returned.  
* Progress percentage is displayed.  
* Course status is displayed.

---

# **Story ID**

**ENR-003**

## **Title**

View Course Enrollments

### **Description**

Allow Instructors and Administrators to view students enrolled in a course.

### **Actors**

* Instructor  
* Admin

### **Preconditions**

* Course exists.  
* Instructor owns the course.

### **Success Flow**

1. Open course.  
2. View enrolled students.  
3. Filter/search students.

### **Permissions Required**

enrollment.view

### **API Endpoints**

GET /api/courses/{courseId}/enrollments

### **Business Rules**

* Instructor only sees enrollments for their own courses.  
* Admin may view all enrollments.  
* Curriculum Managers have read-only access to enrollment counts (optional).

---

# **Story ID**

**ENR-004**

## **Title**

View Enrollment Details

### **Description**

Allow authorized users to view detailed information about a specific enrollment.

### **Actors**

* Student  
* Instructor  
* Admin

### **Preconditions**

Enrollment exists.

### **Success Flow**

1. User selects enrollment.  
2. System displays enrollment details.

### **Permissions Required**

enrollment.detail.view

### **API Endpoints**

GET /api/enrollments/{id}

### **Business Rules**

* Students may view only their own enrollment.  
* Instructors may view enrollments for their courses.  
* Admin may view any enrollment.

---

# **Story ID**

**ENR-005**

## **Title**

Cancel Enrollment

### **Description**

Allow a student to cancel an enrollment before any learning progress has been recorded.

### **Actors**

* Student

### **Preconditions**

* Enrollment exists.  
* No lessons completed.

### **Success Flow**

1. Student selects Cancel Enrollment.  
2. System validates progress.  
3. Enrollment removed.

### **Alternative Flow**

* Progress already exists.  
* Enrollment completed.

### **Post Conditions**

Enrollment removed.

### **Permissions Required**

course.unenroll

### **API Endpoints**

DELETE /api/enrollments/{id}

### **Business Rules**

* Students may only cancel before starting the course.  
* Once lesson progress exists, cancellation is not permitted.  
* Historical audit log retained.

---

# **Story ID**

**ENR-006**

## **Title**

Suspend Enrollment

### **Description**

Allow an Admin to suspend a student's enrollment when necessary.

### **Actors**

* Admin

### **Preconditions**

Enrollment exists.

### **Success Flow**

1. Admin opens enrollment.  
2. Clicks Suspend.  
3. Student loses course access.

### **Alternative Flow**

Enrollment not found.

### **Post Conditions**

Enrollment status updated.

### **Permissions Required**

enrollment.suspend

### **API Endpoints**

PATCH /api/enrollments/{id}/suspend

### **Business Rules**

* Suspended students cannot continue learning.  
* Progress is preserved.  
* Suspension may later be reversed.

---

# **Story ID**

**ENR-007**

## **Title**

Resume Enrollment

### **Description**

Allow an Admin to restore access to a previously suspended enrollment.

### **Actors**

* Admin

### **Preconditions**

Enrollment suspended.

### **Success Flow**

1. Admin clicks Resume.  
2. Enrollment reactivated.  
3. Student regains access.

### **Permissions Required**

enrollment.resume

### **API Endpoints**

PATCH /api/enrollments/{id}/resume

### **Business Rules**

* Progress resumes from last completed lesson.  
* Enrollment history remains unchanged.

---

# **Database Schema**

## **enrollments**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| student\_id | UUID | FK users |
| course\_id | UUID | FK courses |
| enrolled\_at | TIMESTAMP |  |
| completed\_at | TIMESTAMP | NULL |
| status | ENUM(Active, Suspended, Completed, Cancelled) |  |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

# **Module 7 – Learning & Progress Management**

# **Module ID**

**MOD-007**

# **Purpose**

Provide the student learning experience by delivering lessons, enforcing sequential progression, tracking learning progress, managing quiz attempts, and determining course completion.

# **Actors**

* Student  
* Instructor (Read Only)  
* Admin (Read Only)

# **Dependencies**

* Module 1 – Identity & Access Management  
* Module 4 – Course Management  
* Module 5 – Curriculum Management  
* Module 6 – Enrollment Management

# **User Stories**

---

# **Story ID**

**LRN-001**

## **Title**

Access Learning Dashboard

### **Description**

Allow students to access the learning interface for their enrolled courses.

### **Actors**

* Student

### **Preconditions**

* Student authenticated  
* Active enrollment exists

### **Success Flow**

1. Student opens enrolled course.  
2. Current lesson displayed.  
3. Progress displayed.  
4. Locked lessons indicated.

### **Permissions Required**

learning.view

### **API Endpoints**

GET /api/learning/{courseId}

### **Business Rules**

* Student must be enrolled.  
* Only active enrollments may access learning.

---

# **Story ID**

**LRN-002**

## **Title**

View Lesson

### **Description**

Allow students to view unlocked lessons.

### **Actors**

* Student

### **Preconditions**

* Lesson unlocked.  
* Enrollment active.

### **Success Flow**

1. Student selects lesson.  
2. System validates lesson accessibility.  
3. Lesson content rendered.

### **Permissions Required**

lesson.view

### **API Endpoints**

GET /api/lessons/{lessonId}

### **Business Rules**

* Lesson content rendered from stored HTML.  
* Locked lessons cannot be accessed.  
* Server validates access.

---

# **Story ID**

**LRN-003**

## **Title**

Complete Lesson

### **Description**

Allow students to mark a lesson as completed.

### **Actors**

* Student

### **Preconditions**

* Lesson viewed.  
* Previous lessons completed.

### **Success Flow**

1. Student clicks **Complete Lesson**.  
2. System validates progression.  
3. Lesson marked complete.  
4. Next lesson unlocked.  
5. Progress recalculated.

### **Permissions Required**

lesson.complete

### **API Endpoints**

POST /api/lessons/{lessonId}/complete

### **Business Rules**

* Lesson completion occurs only once.  
* Future lessons remain locked.  
* Completion time recorded.

---

# **Story ID**

**LRN-004**

## **Title**

View Learning Progress

### **Description**

Allow students to monitor their progress within a course.

### **Actors**

* Student

### **Success Flow**

1. Student opens dashboard.  
2. Progress percentage displayed.  
3. Completed lessons highlighted.

### **Permissions Required**

progress.view

### **API Endpoints**

GET /api/enrollments/{id}/progress

### **Business Rules**

* Progress calculated dynamically.  
* Progress based on completed lessons.  
* Quiz completion contributes to overall completion.

---

# **Story ID**

**LRN-005**

## **Title**

Take Quiz

### **Description**

Allow students to complete the course assessment.

### **Actors**

* Student

### **Preconditions**

* All lessons completed.  
* Quiz unlocked.

### **Success Flow**

1. Student starts quiz.  
2. Answers questions.  
3. Submits quiz.

### **Permissions Required**

quiz.attempt

### **API Endpoints**

POST /api/quizzes/{quizId}/attempt

### **Business Rules**

* Quiz available only after completing all lessons.  
* Answers saved during submission.

---

# **Story ID**

**LRN-006**

## **Title**

Submit Quiz

### **Description**

Evaluate quiz answers and calculate score.

### **Actors**

* Student

### **Preconditions**

Quiz started.

### **Success Flow**

1. Student submits answers.  
2. System grades quiz.  
3. Score calculated.  
4. Pass/Fail determined.

### **Permissions Required**

quiz.submit

### **API Endpoints**

POST /api/quizzes/{quizId}/submit

### **Business Rules**

* Each question uses configured points.  
* Only one submission allowed (configurable).  
* Score recorded permanently.

---

# **Story ID**

**LRN-007**

## **Title**

View Quiz Results

### **Description**

Allow students to review quiz results.

### **Actors**

* Student

### **Success Flow**

1. Quiz completed.  
2. Results displayed.  
3. Score shown.

### **Permissions Required**

quiz.result.view

### **API Endpoints**

GET /api/quiz-attempts/{id}

### **Business Rules**

* Students may only view their own attempts.  
* Instructors may view attempts for their courses.

---

# **Story ID**

**LRN-008**

## **Title**

Complete Course

### **Description**

Automatically complete a course when all requirements have been satisfied.

### **Actors**

* System

### **Preconditions**

* All lessons complete.  
* Quiz passed.

### **Success Flow**

1. System validates completion.  
2. Enrollment marked Completed.  
3. Certificate generation event triggered.

### **Permissions Required**

System Process

### **Business Rules**

* Completion automatic.  
* Manual completion prohibited.  
* Completion timestamp recorded.

---

# **Story ID**

**LRN-009**

## **Title**

View Student Progress

### **Description**

Allow instructors to monitor learner progress.

### **Actors**

* Instructor  
* Admin

### **Success Flow**

1. Instructor opens enrolled students.  
2. Progress shown.  
3. Completion percentages displayed.

### **Permissions Required**

progress.view.students

### **API Endpoints**

GET /api/courses/{courseId}/progress

### **Business Rules**

* Instructor only sees own courses.  
* Admin sees all courses.

---

# **Database Schema**

## **lesson\_progress**

| Field | Type |
| ----- | ----- |
| id | UUID |
| enrollment\_id | UUID |
| lesson\_id | UUID |
| completed | BOOLEAN |
| completed\_at | TIMESTAMP |

---

## **quiz\_attempts**

| Field | Type |
| ----- | ----- |
| id | UUID |
| enrollment\_id | UUID |
| quiz\_id | UUID |
| score | DECIMAL(5,2) |
| total\_points | INTEGER |
| passed | BOOLEAN |
| started\_at | TIMESTAMP |
| submitted\_at | TIMESTAMP |

---

## **quiz\_answers**

| Field | Type |
| ----- | ----- |
| id | UUID |
| quiz\_attempt\_id | UUID |
| question\_id | UUID |
| answer\_id | UUID |
| points\_awarded | INTEGER |

# **Module 8 – Certificate Management**

# **Module ID**

**MOD-008**

# **Purpose**

Provide an automated certificate issuance process for students who successfully complete a course. The module is responsible for generating certificate metadata, assigning a unique certificate number, generating a QR code, creating a downloadable certificate, and preparing the certificate for blockchain registration.

# **Actors**

* System  
* Student  
* Instructor (Read Only)  
* Admin

# **Dependencies**

* Module 4 – Course Management  
* Module 6 – Enrollment Management  
* Module 7 – Learning & Progress Management

# **User Stories**

# **Story ID**

**CRT-001**

## **Title**

Generate Certificate

### **Description**

Automatically generate a certificate when a student successfully completes all course requirements.

### **Actors**

* System

### **Preconditions**

* Course completed.  
* Enrollment status \= Completed.  
* Quiz passed.

### **Success Flow**

1. Course completion event received.  
2. Certificate number generated.  
3. Certificate record created.  
4. QR Code generated.  
5. Blockchain registration event queued.

### **Alternative Flow**

* Certificate already exists.  
* Enrollment incomplete.

### **Post Conditions**

* Certificate created.  
* Student notified.

### **Permissions Required**

System Process

### **API Endpoints**

POST /api/certificates/generate

### **Business Rules**

* One certificate per completed enrollment.  
* Certificate generation is automatic.  
* Duplicate certificates are prohibited.

---

# **Story ID**

**CRT-002**

## **Title**

View My Certificates

### **Description**

Allow students to view all certificates they have earned.

### **Actors**

* Student

### **Preconditions**

Authenticated student.

### **Success Flow**

1. Student opens Certificates page.  
2. System returns earned certificates.

### **Permissions Required**

certificate.view.own

### **API Endpoints**

GET /api/certificates

### **Business Rules**

* Students may only view their own certificates.

---

# **Story ID**

**CRT-003**

## **Title**

View Certificate Details

### **Description**

Allow authorized users to view detailed certificate information.

### **Actors**

* Student  
* Instructor  
* Admin

### **Preconditions**

Certificate exists.

### **Permissions Required**

certificate.view

### **API Endpoints**

GET /api/certificates/{id}

### **Business Rules**

* Students view only their certificates.  
* Instructors view certificates issued for their courses.  
* Admin may view all certificates.

---

# **Story ID**

**CRT-004**

## **Title**

Download Certificate

### **Description**

Allow students to download their certificate.

### **Actors**

* Student

### **Preconditions**

Certificate generated.

### **Success Flow**

1. Student clicks Download.  
2. PDF generated (or retrieved).  
3. Download begins.

### **Permissions Required**

certificate.download

### **API Endpoints**

GET /api/certificates/{id}/download

### **Business Rules**

* Only certificate owner may download.  
* Downloaded certificate always reflects latest blockchain verification state.

---

# **Story ID**

**CRT-005**

## **Title**

Generate QR Code

### **Description**

Generate a QR code that links directly to the public certificate verification page.

### **Actors**

* System

### **Preconditions**

Certificate created.

### **Success Flow**

1. QR generated.  
2. Stored with certificate.

### **Business Rules**

* QR must reference a public verification URL.  
* QR generated only once.

---

# **Story ID**

**CRT-006**

## **Title**

Regenerate Certificate

### **Description**

Allow an administrator to regenerate a certificate document if formatting or branding changes without issuing a new certificate.

### **Actors**

* Admin

### **Preconditions**

Certificate exists.

### **Permissions Required**

certificate.regenerate

### **API Endpoints**

POST /api/certificates/{id}/regenerate

### **Business Rules**

* Certificate ID remains unchanged.  
* Blockchain hash is not regenerated.  
* Only document layout changes.

---

# **Story ID**

**CRT-007**

## **Title**

Issue Certificate Notification

### **Description**

Notify students once a certificate has been successfully issued.

### **Actors**

* System

### **Success Flow**

1. Certificate generated.  
2. Email notification sent.  
3. Dashboard notification created.

### **Business Rules**

* Notification sent once.  
* Failure to send email does not invalidate certificate issuance.

---

# **Database Schema**

## **certificates**

| Field | Type | Constraints |
| ----- | ----- | ----- |
| id | UUID | PK |
| certificate\_number | VARCHAR(100) | UNIQUE |
| enrollment\_id | UUID | FK enrollments |
| student\_id | UUID | FK users |
| course\_id | UUID | FK courses |
| qr\_code\_url | VARCHAR(255) |  |
| certificate\_hash | VARCHAR(255) | NULL |
| pdf\_path | VARCHAR(255) |  |
| issued\_at | TIMESTAMP |  |
| created\_at | TIMESTAMP |  |
| updated\_at | TIMESTAMP |  |

