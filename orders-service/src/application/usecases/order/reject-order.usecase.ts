import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { OrderNotFoundError, ForbiddenRoleError, InvalidOrderStatusTransitionError } from '../../../domain/errors/domain.errors';
import { OrderGateway } from '../../../interfaces/http/gateways/order.gateway';

export interface RejectOrderInput {
  orderId: string;
  userId: string;
  role: string;
}

export interface RejectOrderOutput {
  order: Order;
}

@Injectable()
export class RejectOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly orderGateway: OrderGateway,
  ) {}

  async execute(input: RejectOrderInput): Promise<RejectOrderOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'reject orders');
    }

    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderStatusTransitionError(order.status, OrderStatus.CANCELLED);
    }

    const updatedOrder = order.updateStatus(OrderStatus.CANCELLED);
    const savedOrder = await this.orderRepo.update(updatedOrder);

    this.orderGateway.emitOrderStatusUpdate(savedOrder.id, savedOrder);

    return { order: savedOrder };
  }
}
