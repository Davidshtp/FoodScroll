import {Entity,Column,PrimaryColumn,CreateDateColumn,UpdateDateColumn,DeleteDateColumn,ManyToOne,JoinColumn} from 'typeorm';
import { CustomerProfileOrmEntity } from './customer-profile.orm-entity';

@Entity({ name: 'address' })
export class AddressOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'city_id' })
  cityId: string;

  @Column({ type: 'varchar', length: 50 })
  alias: string;

  @Column({ name: 'main_address', type: 'varchar', length: 255, nullable: true })
  mainAddress: string | null;

  @Column({ type: 'varchar', length: 150 })
  neighborhood: string;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @Column({ type: 'double' })
  latitude: number;

  @Column({ type: 'double' })
  longitude: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => CustomerProfileOrmEntity, (profile) => profile.addresses, {
    nullable: false,
  })
  @JoinColumn({ name: 'customer_id', referencedColumnName: 'userId' })
  profile: CustomerProfileOrmEntity;
}
