import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';
import { CartItemNotFoundError } from '../../../domain/errors/domain.errors';

export interface RemoveFromCartInput {
  customerId: string;
  cartItemId: string;
}

export interface RemoveFromCartOutput {
  cart: Cart;
}

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: RemoveFromCartInput): Promise<RemoveFromCartOutput> {
    const cart = await this.cartRepo.findByCustomerId(input.customerId);

    if (!cart) {
      throw new CartItemNotFoundError(input.cartItemId);
    }

    const item = cart.cartItems.find((i) => i.id === input.cartItemId);
    if (!item) {
      throw new CartItemNotFoundError(input.cartItemId);
    }

    const updatedCart = cart.removeItem(input.cartItemId);
    const savedCart = await this.cartRepo.save(updatedCart);
    return { cart: savedCart };
  }
}
