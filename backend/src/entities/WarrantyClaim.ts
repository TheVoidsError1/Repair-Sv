import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Repair } from './Repair.js';

export enum WarrantyClaimStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('warranty_claims')
export class WarrantyClaim {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  claimNumber!: string; // e.g., "WRN-001"

  @Column({ type: 'uuid' })
  repairId!: string;

  @ManyToOne(() => Repair, { nullable: false })
  @JoinColumn({ name: 'repairId' })
  repair!: Repair;

  @Column({ type: 'varchar', length: 15, nullable: true })
  serialNumber?: string; // Serial Number ของเครื่องตอนยื่นเคลม — ใช้ตรวจสอบว่าเครื่องตรงกับงานซ่อมเดิม

  @Column({ type: 'text' })
  claimReason!: string; // เหตุผลการเคลม (ภาษาอังกฤษ)

  @Column({ type: 'text' })
  claimReasonTh!: string; // เหตุผลการเคลม (ภาษาไทย)

  @Column({
    type: 'enum',
    enum: WarrantyClaimStatus,
    default: WarrantyClaimStatus.PENDING,
  })
  status!: WarrantyClaimStatus;

  @Column({ type: 'date' })
  claimDate!: Date; // วันที่ยื่นเคลม

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
