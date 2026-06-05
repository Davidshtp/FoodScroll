import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantPort, RESTAURANT_PORT } from '../../ports/restaurant.port';
import { ForbiddenRoleError } from '../../../domain/errors/domain.errors';

export interface GetRestaurantOrderHistoryInput {
  userId: string;
  role: string;
  page: number;
  limit: number;
  authorization: string;
}

export interface GetRestaurantOrderHistoryOutput {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class GetRestaurantOrderHistoryUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_PORT) private readonly restaurantPort: RestaurantPort,
  ) {}

  async execute(input: GetRestaurantOrderHistoryInput): Promise<GetRestaurantOrderHistoryOutput> {
    if (input.role !== 'RESTAURANT') {
      throw new ForbiddenRoleError(input.role, 'access restaurant order history');
    }

    const restaurantId = await this.restaurantPort.getRestaurantByUserId(input.userId, input.authorization);

    const { orders, total } = await this.orderRepo.findDeliveredByRestaurantId(
      restaurantId,
      input.page,
      input.limit,
    );

    return {
      orders,
      pagination: {
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }
}
