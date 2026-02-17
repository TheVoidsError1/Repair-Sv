import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWarrantyDaysToRepairs1775000000000 implements MigrationInterface {
  name = "AddWarrantyDaysToRepairs1775000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repairs"
      ADD COLUMN IF NOT EXISTS "warrantyDays" integer NOT NULL DEFAULT 90
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "repairs"
      DROP COLUMN IF EXISTS "warrantyDays"
    `);
  }
}

