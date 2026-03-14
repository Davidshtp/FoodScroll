import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
import { AddressOrmEntity } from './address.orm-entity';

@Entity({ name: 'customer_profile' })
export class CustomerProfileOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  userId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({
    type: 'enum',
    enum: ['HOMBRE', 'MUJER', 'OTRO', 'PREFIERO_NO_DECIRLO'],
  })
  gender: string;

  @Column({
    type: 'enum',
    enum: ['REQUIRED_BASIC_CONFIG', 'REQUIRED_ADDRESS', 'COMPLETED'],
    default: 'REQUIRED_ADDRESS',
  })
  onboardingStatus: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => AddressOrmEntity, (address) => address.profile)
  addresses: AddressOrmEntity[];
}
