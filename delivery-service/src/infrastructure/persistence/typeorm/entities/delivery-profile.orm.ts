import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
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

  @Column({ type: 'enum', enum: VehicleType, nullable: true })
  vehicleType: VehicleType | null;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => VehicleOrmEntity, (vehicle) => vehicle.profile)
  vehicles: VehicleOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;
}
