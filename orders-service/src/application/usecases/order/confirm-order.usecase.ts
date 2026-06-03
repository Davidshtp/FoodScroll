import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { OrderNotFoundError, ForbiddenRoleError, InvalidOrderStatusTransitionError } from '../../../domain/errors/domain.errors';

export interface ConfirmOrderInput {
  orderId: string;
  userId: string;
  role: string;
}

export interface ConfirmOrderOutput {
  order: Order;
}

@Injectable()
export class ConfirmOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'confirm orders');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusTransitionError(order.status, OrderStatus.CONFIRMED);
    }

    const updatedOrder = order.updateStatus(OrderStatus.CONFIRMED);
    const savedOrder = await this.orderRepo.update(updatedOrder);

    return { order: savedOrder };
  }
}
