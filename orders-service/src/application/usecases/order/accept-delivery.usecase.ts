import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import {
  OrderNotFoundError,
  ForbiddenRoleError,
  OrderNotAvailableForDeliveryError,
  OrderAlreadyAssignedError,
} from '../../../domain/errors/domain.errors';

export interface AcceptDeliveryInput {
  orderId: string;
  userId: string;
  role: string;
}

export interface AcceptDeliveryOutput {
  order: Order;
}

@Injectable()
export class AcceptDeliveryUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: AcceptDeliveryInput): Promise<AcceptDeliveryOutput> {
    if (input.role !== 'DELIVERY') {
      throw new ForbiddenRoleError(input.role, 'accept orders');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new OrderNotAvailableForDeliveryError(order.status);
    }

    if (order.deliveryId !== null) {
      throw new OrderAlreadyAssignedError(input.orderId);
    }

    const updatedOrder = order.assignDelivery(input.userId);
    const savedOrder = await this.orderRepo.update(updatedOrder);

    return { order: savedOrder };
  }
}
