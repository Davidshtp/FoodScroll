import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import {
  OrderNotFoundError,
  ForbiddenRoleError,
  OrderNotAssignedToYouError,
  OrderNotOutForDeliveryError,
} from '../../../domain/errors/domain.errors';

export interface DeliverOrderInput {
  orderId: string;
  userId: string;
  role: string;
}

export interface DeliverOrderOutput {
  order: Order;
}

@Injectable()
export class DeliverOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: DeliverOrderInput): Promise<DeliverOrderOutput> {
    if (input.role !== 'DELIVERY') {
      throw new ForbiddenRoleError(input.role, 'deliver orders');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.deliveryId !== input.userId) {
      throw new OrderNotAssignedToYouError(input.orderId);
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new OrderNotOutForDeliveryError(order.status);
    }

    const updatedOrder = order.markAsDelivered();
    const savedOrder = await this.orderRepo.update(updatedOrder);

    return { order: savedOrder };
  }
}
