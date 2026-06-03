import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CartOrmEntity } from './cart.orm-entity';

@Entity({ name: 'cart_items' })
export class CartItemOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  cartId: string;

  @ManyToOne(() => CartOrmEntity, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: CartOrmEntity;

  @Column()
  publicationId: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  observation: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
