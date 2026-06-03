import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';
import { CartItemNotFoundError } from '../../../domain/errors/domain.errors';

export interface UpdateCartItemInput {
  customerId: string;
  cartItemId: string;
  quantity?: number;
  observation?: string;
}

export interface UpdateCartItemOutput {
  cart: Cart;
}

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
  ) {}

  async execute(input: UpdateCartItemInput): Promise<UpdateCartItemOutput> {
    const cart = await this.cartRepo.findByCustomerId(input.customerId);

    if (!cart) {
      throw new CartItemNotFoundError(input.cartItemId);
    }

    const item = cart.cartItems.find((i) => i.id === input.cartItemId);
    if (!item) {
      throw new CartItemNotFoundError(input.cartItemId);
    }

    const updatedCart = cart.updateItem(
      input.cartItemId,
      input.quantity,
      input.observation,
    );

    const savedCart = await this.cartRepo.save(updatedCart);
    return { cart: savedCart };
  }
}
