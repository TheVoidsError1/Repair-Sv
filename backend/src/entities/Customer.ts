import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Repair } from './Repair.js';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  fullName?: string; // สำหรับเก็บชื่อเต็ม (รองรับกรณีที่ไม่มี firstName/lastName)

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  lineId?: string;

  @Column({ type: 'text', nullable: true })
  lineIdRes?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  device?: string; // ยี่ห้อ/รุ่นเครื่องของลูกค้า

  @OneToMany(() => Repair, (repair) => repair.customer)
  repairs!: Repair[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

}
