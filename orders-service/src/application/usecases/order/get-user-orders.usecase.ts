import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { CustomerIdentityPort, CUSTOMER_IDENTITY_PORT } from '../../ports/customer-identity.port';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../ports/restaurant-info.port';

export interface EnrichedUserOrder {
  order: Order;
  restaurant: {
    id: string;
    name: string;
    logoUrl: string;
  } | null;
}

export interface GetUserOrdersInput {
  userId: string;
  authorization: string;
}

export interface GetUserOrdersOutput {
  orders: EnrichedUserOrder[];
}

@Injectable()
export class GetUserOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(CUSTOMER_IDENTITY_PORT) private readonly customerIdentityPort: CustomerIdentityPort,
    @Inject(RESTAURANT_INFO_PORT) private readonly restaurantInfoPort: RestaurantInfoPort,
  ) {}

  async execute(input: GetUserOrdersInput): Promise<GetUserOrdersOutput> {
    await this.customerIdentityPort.validateUserId(input.userId, input.authorization);

    const orders = await this.orderRepo.findByCustomerId(input.userId);

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const restaurant = await this.restaurantInfoPort
          .getRestaurantInfo(order.restaurantId)
          .catch(() => null);

        return {
          order,
          restaurant: restaurant
            ? {
                id: restaurant.id,
                name: restaurant.name,
                logoUrl: restaurant.logoUrl,
              }
            : null,
        };
      }),
    );

    return { orders: enrichedOrders };
  }
}
