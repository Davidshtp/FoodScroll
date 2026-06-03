import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

@Entity({ name: 'order_items' })
export class OrderItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => OrderOrmEntity, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderOrmEntity;

  @Column()
  publicationId: string;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  observation: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}