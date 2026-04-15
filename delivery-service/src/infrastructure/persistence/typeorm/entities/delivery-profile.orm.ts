import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Gender, DocumentType, VehicleType } from '../../../../domain/enums';
import { VehicleOrmEntity } from './vehicle.orm';

@Entity('delivery-profile')
@Index('IDX_delivery_profile_userId', ['userId'], { unique: true })
export class DeliveryProfileOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column()
  documentNumber: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  activeVehicleId: string | null;

  @OneToOne(() => VehicleOrmEntity)
  @JoinColumn({ name: 'activeVehicleId', referencedColumnName: 'id' })
  activeVehicle: VehicleOrmEntity;

  @OneToMany(() => VehicleOrmEntity, (vehicle) => vehicle.profile)
  vehicles: VehicleOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
