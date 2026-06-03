import { Cart } from '../entities/cart.entity';

export interface CartRepository {
  findOrCreateByCustomerId(customerId: string): Promise<Cart>;
  findByCustomerId(customerId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<Cart>;
  deleteByCustomerId(customerId: string): Promise<void>;
}

export const CART_REPOSITORY = 'CART_REPOSITORY';
