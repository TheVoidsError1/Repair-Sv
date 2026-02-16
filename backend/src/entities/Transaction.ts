import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Part } from './Part.js';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  transactionNumber!: string; // เลขที่ธุรกรรม เช่น EXP-STOCK-2026-001, TXN-REP-2026-001

  @Column({ type: 'uuid', nullable: true })
  partId?: string;

  @ManyToOne(() => Part)
  @JoinColumn({ name: 'partId' })
  part?: Part;

  @Column({ type: 'enum', enum: ['purchase', 'adjustment', 'income', 'expense'], default: 'purchase' })
  type!: 'purchase' | 'adjustment' | 'income' | 'expense'; // ประเภทธุรกรรม: ซื้อเข้า, ปรับปรุง, รายได้, รายจ่าย

  @Column({ type: 'integer', nullable: true })
  quantityAdded?: number; // จำนวนที่เพิ่ม (สำหรับสต็อก - ใช้ในการลบ transaction เพื่อคืนสต็อก)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost!: number; // ราคารวม/จำนวนเงิน

  @Column({ type: 'text', nullable: true })
  description?: string; // รายละเอียด (ภาษาอังกฤษ)

  @Column({ type: 'text', nullable: true })
  descriptionTh?: string; // รายละเอียด (ภาษาไทย)

  @CreateDateColumn()
  createdAt!: Date;
}
