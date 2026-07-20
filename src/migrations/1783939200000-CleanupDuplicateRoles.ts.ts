import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cleans up 4 stale duplicate role rows left over from an earlier,
 * coarser permission scheme (SCREAMING_CASE codes like VIEW_USERS,
 * MANAGE_CURRICULUM). The current, correct roles use granular codes
 * (e.g. department.view.all, course.submit) and are what every
 * @RequirePermissions() check in the codebase actually relies on.
 *
 * Any user still pointing at a stale role_id is reassigned to the
 * correct role first, then the stale role rows (and their
 * role_permissions join rows) are removed.
 */
export class CleanupDuplicateRoles1783939200000 implements MigrationInterface {

  name = 'CleanupDuplicateRoles1783939200000';

  // Correct (current) role IDs — keep these
  private readonly ADMIN_OK = '4fd6de12-ce79-41f3-993d-b3e29657863b';
  private readonly CURRICULUM_MANAGER_OK = '2f64415a-51d9-4b6c-baad-848ba3bf33f1';
  private readonly INSTRUCTOR_OK = '221701bb-48bf-4464-9c5e-3e22d76f34c7';
  private readonly STUDENT_OK = 'c05a3b79-4d12-48cc-9f72-31d12dd08762';

  // Stale (legacy) role IDs — reassign users off these, then delete
  private readonly ADMIN_STALE = 'f021b0c3-22c0-4acc-94f8-da3c992ad59a'; // 'admin'
  private readonly CURRICULUM_SUPERVISOR_STALE = '62f2ced4-ab7a-49b0-b0e0-27e96b93bac1'; // 'curriculum_supervisor'
  private readonly INSTRUCTOR_STALE = '065baea5-6647-465c-9f44-5b2dad2a197d'; // 'instructor'
  private readonly STUDENT_STALE = '558912de-e9be-45d6-b091-6f013d435fff'; // 'student'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Reassign any users still pointing at a stale role to the correct one
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" = $2`,
      [this.ADMIN_OK, this.ADMIN_STALE],
    );
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" = $2`,
      [this.CURRICULUM_MANAGER_OK, this.CURRICULUM_SUPERVISOR_STALE],
    );
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" = $2`,
      [this.INSTRUCTOR_OK, this.INSTRUCTOR_STALE],
    );
    await queryRunner.query(
      `UPDATE "users" SET "role_id" = $1 WHERE "role_id" = $2`,
      [this.STUDENT_OK, this.STUDENT_STALE],
    );

    // 2. Remove the stale roles' permission assciations first (in case
    // the FK isn't set to CASCADE), then the stale role rows themselves.
    const staleIds = [
      this.ADMIN_STALE,
      this.CURRICULUM_SUPERVISOR_STALE,
      this.INSTRUCTOR_STALE,
      this.STUDENT_STALE,
    ];

    await queryRunner.query(
      `DELETE FROM "role_permissions" WHERE "role_id" = ANY($1)`,
      [staleIds],
    );

    await queryRunner.query(
      `DELETE FROM "roles" WHERE "id" = ANY($1)`,
      [staleIds],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {

    throw new Error(
      'This migration is not reversible by design. Restore from a backup taken before it ran, if a rollback is required.',
    );
  }
}