import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VehicleOrmEntity } from './vehicle.orm';

@Entity('vehicle_technos')
export class VehicleTechnoOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => VehicleOrmEntity, (vehicle) => vehicle.technos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: VehicleOrmEntity;

  @Column({ nullable: true })
  certificateNumber: string;

  @Column({ nullable: true })
  reviewType: string;

  @Column({ nullable: true })
  cdaName: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  isCurrent: string;

  @Column({ type: 'date', nullable: true })
  issuedAt: Date;

  @Column({ type: 'date', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  plate: string;

  @Column({ nullable: true })
  consistency: string;

  @Column({ nullable: true })
  certificateUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
