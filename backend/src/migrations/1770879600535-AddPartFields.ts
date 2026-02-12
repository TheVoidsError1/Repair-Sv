import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPartFields1770879600535 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add costPrice column
    await queryRunner.addColumn(
      'parts',
      new TableColumn({
        name: 'costPrice',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
      })
    );

    // Add nameTh column
    await queryRunner.addColumn(
      'parts',
      new TableColumn({
        name: 'nameTh',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );

    // Add categoryTh column
    await queryRunner.addColumn(
      'parts',
      new TableColumn({
        name: 'categoryTh',
        type: 'varchar',
        length: '50',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove categoryTh column
    await queryRunner.dropColumn('parts', 'categoryTh');

    // Remove nameTh column
    await queryRunner.dropColumn('parts', 'nameTh');

    // Remove costPrice column
    await queryRunner.dropColumn('parts', 'costPrice');
  }
}
