import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1783939104384 implements MigrationInterface {
    name = 'AddPasswordResetFields1783939104384'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`);
    }

}
