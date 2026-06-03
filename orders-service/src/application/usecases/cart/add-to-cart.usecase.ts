import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../../../domain/entities/cart.entity';
import { CartItem } from '../../../domain/entities/cart-item.entity';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';
import { PublicationPort, PUBLICATION_PORT } from '../../ports/publication.port';

export interface AddToCartInput {
  customerId: string;
  publicationId: string;
  quantity?: number;
  observation?: string;
  authorization: string;
}

export interface AddToCartOutput {
  cart: Cart;
}

@Injectable()
export class AddToCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
    @Inject(PUBLICATION_PORT) private readonly publicationPort: PublicationPort,
  ) {}

  async execute(input: AddToCartInput): Promise<AddToCartOutput> {
    await this.publicationPort.getPublicationById(input.publicationId, input.authorization);

    const cart = await this.cartRepo.findOrCreateByCustomerId(input.customerId);

    const existingItem = cart.findItemByPublicationId(input.publicationId);

    let updatedCart: Cart;

    if (existingItem) {
      const newQuantity = existingItem.quantity + (input.quantity ?? 1);
      updatedCart = cart.updateItem(existingItem.id, newQuantity);
    } else {
      const newItem = CartItem.create({
        id: crypto.randomUUID(),
        publicationId: input.publicationId,
        quantity: input.quantity ?? 1,
        observation: input.observation,
      });
      updatedCart = cart.addItem(newItem);
    }

    const savedCart = await this.cartRepo.save(updatedCart);
    return { cart: savedCart };
  }
}
