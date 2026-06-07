import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { OrderNotFoundError, ForbiddenRoleError, InvalidOrderStatusTransitionError } from '../../../domain/errors/domain.errors';
import { OrderGateway } from '../../../interfaces/http/gateways/order.gateway';

export interface StartPreparingInput {
  orderId: string;
  userId: string;
  role: string;
}

export interface StartPreparingOutput {
  order: Order;
}

@Injectable()
export class StartPreparingUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly orderGateway: OrderGateway,
  ) {}

  async execute(input: StartPreparingInput): Promise<StartPreparingOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'start preparing orders');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new InvalidOrderStatusTransitionError(order.status, OrderStatus.PREPARING);
    }

    const updatedOrder = order.updateStatus(OrderStatus.PREPARING);
    const savedOrder = await this.orderRepo.update(updatedOrder);

    this.orderGateway.emitOrderStatusUpdate(savedOrder.id, savedOrder);

    return { order: savedOrder };
  }
}
