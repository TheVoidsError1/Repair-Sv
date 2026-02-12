import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSelectedPartIds1771000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add selectedPartIds column to store JSON array of part IDs
    await queryRunner.addColumn(
      'repairs',
      new TableColumn({
        name: 'selectedPartIds',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove selectedPartIds column
    await queryRunner.dropColumn('repairs', 'selectedPartIds');
  }
}
