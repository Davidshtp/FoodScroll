import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { OrderNotFoundError } from '../../../domain/errors/domain.errors';
import { OrderGateway } from '../../../interfaces/http/gateways/order.gateway';

export interface UpdateOrderStatusInput {
  orderId: string;
  userId: string;
  status: OrderStatus;
  authorization: string;
}

export interface UpdateOrderStatusOutput {
  order: Order;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly orderGateway: OrderGateway,
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<UpdateOrderStatusOutput> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    const updatedOrder = order.updateStatus(input.status);
    const savedOrder = await this.orderRepo.update(updatedOrder);

    this.orderGateway.emitOrderStatusUpdate(savedOrder.id, savedOrder);

    return { order: savedOrder };
  }
}
