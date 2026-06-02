import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RestaurantAddressOrmEntity } from './restaurant-address.orm';
import { RestaurantOpeningHoursOrmEntity } from './restaurant-opening-hours.orm';

@Entity({ name: 'restaurant' })
export class RestaurantOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index({ unique: true, where: 'deleted_at IS NULL' })
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500 })
  logoUrl: string;

  @Column({ name: 'banner_url', type: 'varchar', length: 500 })
  bannerUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => RestaurantAddressOrmEntity, (address) => address.restaurant)
  addresses: RestaurantAddressOrmEntity[];

  @OneToMany(
    () => RestaurantOpeningHoursOrmEntity,
    (hours) => hours.restaurant,
  )
  openingHours: RestaurantOpeningHoursOrmEntity[];
}
