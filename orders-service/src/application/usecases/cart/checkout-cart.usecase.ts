import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { CartRepository, CART_REPOSITORY } from '../../../domain/repositories/cart.repository';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { PublicationPort, PUBLICATION_PORT } from '../../ports/publication.port';
import { CartEmptyError } from '../../../domain/errors/domain.errors';

export interface CheckoutCartInput {
  customerId: string;
  customerAddressId: string;
  authorization: string;
}

export interface CheckoutCartOutput {
  orders: Order[];
}

@Injectable()
export class CheckoutCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly cartRepo: CartRepository,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(PUBLICATION_PORT) private readonly publicationPort: PublicationPort,
  ) {}

  async execute(input: CheckoutCartInput): Promise<CheckoutCartOutput> {
    const cart = await this.cartRepo.findByCustomerId(input.customerId);

    if (!cart || cart.isEmpty()) {
      throw new CartEmptyError();
    }

    const itemsByRestaurant = new Map<string, {
      publicationId: string;
      title: string;
      price: number;
      quantity: number;
      observation?: string;
    }[]>();

    for (const item of cart.cartItems) {
      const publication = await this.publicationPort.getPublicationById(
        item.publicationId,
        input.authorization,
      );

      const existing = itemsByRestaurant.get(publication.restaurantId) ?? [];
      existing.push({
        publicationId: item.publicationId,
        title: publication.title,
        price: publication.price,
        quantity: item.quantity,
        observation: item.observation ?? undefined,
      });
      itemsByRestaurant.set(publication.restaurantId, existing);
    }

    const createdOrders: Order[] = [];

    for (const [restaurantId, items] of itemsByRestaurant) {
      const orderItems: OrderItem[] = [];
      let totalAmount = 0;

      for (const item of items) {
        const orderItem = OrderItem.create({
          id: crypto.randomUUID(),
          publicationId: item.publicationId,
          productName: item.title,
          quantity: item.quantity,
          unitPrice: item.price,
          observation: item.observation,
        });
        orderItems.push(orderItem);
        totalAmount += orderItem.totalPrice;
      }

      const order = Order.create({
        id: crypto.randomUUID(),
        customerId: input.customerId,
        restaurantId,
        deliveryId: null,
        customerAddressId: input.customerAddressId,
        status: OrderStatus.PENDING,
        totalAmount,
        orderItems,
      });

      const savedOrder = await this.orderRepo.createWithItems(order, orderItems);
      createdOrders.push(savedOrder);
    }

    await this.cartRepo.deleteByCustomerId(input.customerId);

    return { orders: createdOrders };
  }
}
