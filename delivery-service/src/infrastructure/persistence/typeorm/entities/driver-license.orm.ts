import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DeliveryProfileOrmEntity } from './delivery-profile.orm';

@Entity('driver_license')
@Index('IDX_driver_license_profileId', ['profileId'], { unique: true })
export class DriverLicenseOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  documentNumber: string;

  @Column({ type: 'uuid', unique: true })
  profileId: string;

  @OneToOne(() => DeliveryProfileOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: DeliveryProfileOrmEntity;

  @Column({ type: 'varchar', length: 50, nullable: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  issuingOffice: string;

  @Column({ type: 'date', nullable: true })
  issueDate: Date;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
