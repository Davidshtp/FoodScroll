import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { VehicleType } from '../../../../domain/enums';
import { DeliveryProfileOrmEntity } from './delivery-profile.orm';
import { VehicleSoatOrmEntity } from './vehicle-soat.orm';
import { VehicleTechnoOrmEntity } from './vehicle-techno.orm';

@Entity('vehicle')
export class VehicleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  profileId: string;

  @ManyToOne(() => DeliveryProfileOrmEntity, (profile) => profile.vehicles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profileId' })
  profile: DeliveryProfileOrmEntity;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ nullable: true })
  plate: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  line: string;

  @Column({ type: 'int', nullable: true })
  modelYear: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  soatStatus: string;

  @Column({ type: 'date', nullable: true })
  soatExpiry: Date;

  @Column({ nullable: true })
  technoStatus: string;

  @Column({ type: 'date', nullable: true })
  technoExpiry: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  @OneToMany(() => VehicleSoatOrmEntity, (soat) => soat.vehicle)
  soats: VehicleSoatOrmEntity[];

  @OneToMany(() => VehicleTechnoOrmEntity, (techno) => techno.vehicle)
  technos: VehicleTechnoOrmEntity[];
}
