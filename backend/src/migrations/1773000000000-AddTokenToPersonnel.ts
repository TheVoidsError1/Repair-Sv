import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokenToPersonnel1773000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add token column to personnel table
    await queryRunner.addColumn(
      'personnel',
      new TableColumn({
        name: 'token',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove token column
    await queryRunner.dropColumn('personnel', 'token');
  }
}
