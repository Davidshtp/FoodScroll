import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';

export interface GetCartInput {
  customerId: string;
}

export interface GetCartOutput {
  cart: Cart;
}

@Injectable()
export class GetCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: GetCartInput): Promise<GetCartOutput> {
    const cart = await this.cartRepo.findByCustomerId(input.customerId);

    if (!cart) {
      const emptyCart = Cart.create({
        id: crypto.randomUUID(),
        customerId: input.customerId,
        cartItems: [],
      });
      return { cart: emptyCart };
    }

    return { cart };
  }
}
