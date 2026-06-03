import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { CartItemOrmEntity } from './cart-item.orm-entity';

@Entity({ name: 'carts' })
export class CartOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Index()
  @Column()
  customerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CartItemOrmEntity, (item) => item.cart)
  cartItems: CartItemOrmEntity[];
}
