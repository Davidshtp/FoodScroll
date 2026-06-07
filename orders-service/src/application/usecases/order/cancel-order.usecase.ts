import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { OrderNotFoundError, OrderCannotBeCancelledError, UnauthorizedOrderAccessError } from '../../../domain/errors/domain.errors';
import { OrderGateway } from '../../../interfaces/http/gateways/order.gateway';

export interface CancelOrderInput {
  orderId: string;
  userId: string;
}

export interface CancelOrderOutput {
  order: Order;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly orderGateway: OrderGateway,
  ) {}

  async execute(input: CancelOrderInput): Promise<CancelOrderOutput> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.customerId !== input.userId) {
      throw new UnauthorizedOrderAccessError(input.orderId);
    }

    const cancellableStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ];
    if (!cancellableStatuses.includes(order.status)) {
      throw new OrderCannotBeCancelledError(order.status);
    }

    const cancelledOrder = order.softDelete();
    await this.orderRepo.softDeleteWithItems(order.id);

    this.orderGateway.emitOrderStatusUpdate(input.orderId, cancelledOrder);

    return { order: cancelledOrder };
  }
}
