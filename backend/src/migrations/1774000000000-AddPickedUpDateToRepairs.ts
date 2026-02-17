import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPickedUpDateToRepairs1774000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'repairs',
      new TableColumn({
        name: 'pickedUpDate',
        type: 'date',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('repairs', 'pickedUpDate');
  }
}

