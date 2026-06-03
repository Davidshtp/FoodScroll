import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
import { OrderItemOrmEntity } from './order-item.orm-entity';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';

@Entity({ name: 'orders' })
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column()
  customerId: string;

  @Index()
  @Column()
  restaurantId: string;

  @Column({ type: 'varchar', nullable: true })
  deliveryId: string | null;

  @Column()
  customerAddressId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => OrderItemOrmEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemOrmEntity[];
}