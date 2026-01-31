import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './Customer.js';
import { Personnel } from './Personnel.js';

export enum RepairStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('repairs')
export class Repair {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  repairNumber!: string; // e.g., "REP-2024-001"

  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.repairs)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => Personnel, (personnel) => personnel.repairs, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: Personnel;

  @Column({ type: 'varchar', length: 100 })
  deviceType!: string; // 'phone', 'tablet', 'laptop', etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceBrand?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceModel?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  deviceSerialNumber?: string;

  @Column({ type: 'text' })
  problemDescription!: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  repairNotes?: string;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    default: RepairStatus.PENDING,
  })
  status!: RepairStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  laborCost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  partsCost!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'date', nullable: true })
  estimatedCompletionDate?: Date;

  @Column({ type: 'date', nullable: true })
  completedDate?: Date;

  @Column({ type: 'text', nullable: true })
  warrantyInfo?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
