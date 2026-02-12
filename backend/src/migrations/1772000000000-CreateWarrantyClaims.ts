import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWarrantyClaims1772000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create warranty_claims table
    await queryRunner.createTable(
      new Table({
        name: 'warranty_claims',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'claimNumber',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'repairId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'serialNumber',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'claimReason',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'claimReasonTh',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'claimDate',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create foreign key to repairs table
    await queryRunner.createForeignKey(
      'warranty_claims',
      new TableForeignKey({
        columnNames: ['repairId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'repairs',
        onDelete: 'CASCADE',
      })
    );

    // Create index on claimNumber for faster lookups
    await queryRunner.createIndex(
      'warranty_claims',
      new TableIndex({
        name: 'IDX_warranty_claims_claimNumber',
        columnNames: ['claimNumber'],
        isUnique: true,
      })
    );

    // Create index on repairId for faster joins
    await queryRunner.createIndex(
      'warranty_claims',
      new TableIndex({
        name: 'IDX_warranty_claims_repairId',
        columnNames: ['repairId'],
      })
    );

    // Create index on status for filtering
    await queryRunner.createIndex(
      'warranty_claims',
      new TableIndex({
        name: 'IDX_warranty_claims_status',
        columnNames: ['status'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('warranty_claims', 'IDX_warranty_claims_status');
    await queryRunner.dropIndex('warranty_claims', 'IDX_warranty_claims_repairId');
    await queryRunner.dropIndex('warranty_claims', 'IDX_warranty_claims_claimNumber');

    // Drop foreign key
    const table = await queryRunner.getTable('warranty_claims');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('repairId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('warranty_claims', foreignKey);
    }

    // Drop table
    await queryRunner.dropTable('warranty_claims');
  }
}
