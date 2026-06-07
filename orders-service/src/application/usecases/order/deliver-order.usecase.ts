import { Inject, Injectable, Logger } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import {
  OrderNotFoundError,
  ForbiddenRoleError,
  OrderNotAssignedToYouError,
  OrderNotOutForDeliveryError,
} from '../../../domain/errors/domain.errors';
import { OrderGateway } from '../../../interfaces/http/gateways/order.gateway';
import { RedisService } from '../../../infrastructure/redis/redis.service';

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
  private readonly logger = new Logger(DeliverOrderUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly orderGateway: OrderGateway,
    private readonly redisService: RedisService,
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

    this.orderGateway.emitOrderStatusUpdate(savedOrder.id, savedOrder);

    try {
      await this.redisService.del(`delivery:track:${savedOrder.id}`);
      await this.redisService.del(`delivery:lastpos:${savedOrder.id}`);
    } catch (error) {
      this.logger.error(`Error cleaning Redis tracking data for order ${savedOrder.id}: ${error.message}`);
    }

    return { order: savedOrder };
  }
}
