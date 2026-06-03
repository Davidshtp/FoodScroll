import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';

export interface ClearCartInput {
  customerId: string;
}

export interface ClearCartOutput {
  cart: Cart;
}

@Injectable()
export class ClearCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: ClearCartInput): Promise<ClearCartOutput> {
    const cart = await this.cartRepo.findByCustomerId(input.customerId);

    if (cart) {
      await this.cartRepo.deleteByCustomerId(input.customerId);
    }

    const emptyCart = Cart.create({
      id: crypto.randomUUID(),
      customerId: input.customerId,
      cartItems: [],
    });

    return { cart: emptyCart };
  }
}
