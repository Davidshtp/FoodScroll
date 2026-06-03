import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantPort, RESTAURANT_PORT } from '../../ports/restaurant.port';
import { OrderNotFoundError, UnauthorizedOrderAccessError } from '../../../domain/errors/domain.errors';

export interface GetOrderInput {
  orderId: string;
  userId: string;
  role: string;
  authorization: string;
}

export interface GetOrderOutput {
  order: Order;
}

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_PORT) private readonly restaurantPort: RestaurantPort,
  ) {}

  async execute(input: GetOrderInput): Promise<GetOrderOutput> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    let authorized = false;

    if (input.role === 'CUSTOMER') {
      authorized = order.customerId === input.userId;
    } else if (input.role === 'RESTAURANT') {
      const restaurantId = await this.restaurantPort.getRestaurantByUserId(input.userId, input.authorization);
      authorized = order.restaurantId === restaurantId;
    } else if (input.role === 'DELIVERY') {
      authorized = order.deliveryId === input.userId;
    }

    if (!authorized) {
      throw new UnauthorizedOrderAccessError(input.orderId);
    }

    return { order };
  }
}
