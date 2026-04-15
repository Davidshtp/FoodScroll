import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VehicleOrmEntity } from './vehicle.orm';

@Entity('vehicle_soats')
export class VehicleSoatOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicleId: string;

  @ManyToOne(() => VehicleOrmEntity, (vehicle) => vehicle.soats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: VehicleOrmEntity;

  @Column({ nullable: true })
  policyNumber: string;

  @Column({ nullable: true })
  insurer: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  issuanceStatus: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  tariffType: string;

  @Column({ type: 'date', nullable: true })
  issuedAt: Date;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
