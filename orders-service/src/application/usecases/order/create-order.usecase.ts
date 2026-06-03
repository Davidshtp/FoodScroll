import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderItem } from '../../../domain/entities/order-item.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { CustomerIdentityPort, CUSTOMER_IDENTITY_PORT } from '../../ports/customer-identity.port';
import { PublicationPort, PUBLICATION_PORT } from '../../ports/publication.port';

export interface CreateOrderInput {
  customerId: string;
  customerAddressId: string;
  orderItems: {
    publicationId: string;
    quantity: number;
    observation?: string;
  }[];
  authorization: string;
}

export interface CreateOrderOutput {
  order: Order;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(PUBLICATION_PORT) private readonly publicationPort: PublicationPort,
    @Inject(CUSTOMER_IDENTITY_PORT) private readonly customerIdentityPort: CustomerIdentityPort,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    await this.customerIdentityPort.validateUserId(input.customerId, input.authorization);

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    let restaurantId: string | null = null;

    for (const itemDto of input.orderItems) {
      const publication = await this.publicationPort.getPublicationById(
        itemDto.publicationId,
        input.authorization,
      );

      if (!restaurantId) {
        restaurantId = publication.restaurantId;
      }

      const orderItem = OrderItem.create({
        id: crypto.randomUUID(),
        publicationId: itemDto.publicationId,
        productName: publication.title,
        quantity: itemDto.quantity,
        unitPrice: publication.price,
        observation: itemDto.observation,
      });
      orderItems.push(orderItem);
      totalAmount += orderItem.totalPrice;
    }

    const order = Order.create({
      id: crypto.randomUUID(),
      customerId: input.customerId,
      restaurantId: restaurantId!,
      deliveryId: null,
      customerAddressId: input.customerAddressId,
      status: OrderStatus.PENDING,
      totalAmount,
      orderItems,
    });

    const savedOrder = await this.orderRepo.createWithItems(order, orderItems);

    return { order: savedOrder };
  }
}
