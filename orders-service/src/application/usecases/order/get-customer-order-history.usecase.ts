import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { CustomerIdentityPort, CUSTOMER_IDENTITY_PORT } from '../../ports/customer-identity.port';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../ports/restaurant-info.port';
import { DeliveryInfoPort, DELIVERY_INFO_PORT } from '../../ports/delivery-info.port';
import { LocationPort, LOCATION_PORT } from '../../ports/location.port';

export interface EnrichedCustomerHistoryOrder {
  order: Order;
  restaurant: {
    id: string;
    name: string;
    phone: string;
    email: string;
    logoUrl: string;
    address: {
      id: string;
      address: string;
      cityName: string;
      latitude: number;
      longitude: number;
    } | null;
  } | null;
  delivery: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
  } | null;
}

export interface GetCustomerOrderHistoryInput {
  userId: string;
  page: number;
  limit: number;
  authorization: string;
}

export interface GetCustomerOrderHistoryOutput {
  orders: EnrichedCustomerHistoryOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class GetCustomerOrderHistoryUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(CUSTOMER_IDENTITY_PORT) private readonly customerIdentityPort: CustomerIdentityPort,
    @Inject(RESTAURANT_INFO_PORT) private readonly restaurantInfoPort: RestaurantInfoPort,
    @Inject(DELIVERY_INFO_PORT) private readonly deliveryInfoPort: DeliveryInfoPort,
    @Inject(LOCATION_PORT) private readonly locationPort: LocationPort,
  ) {}

  async execute(input: GetCustomerOrderHistoryInput): Promise<GetCustomerOrderHistoryOutput> {
    await this.customerIdentityPort.validateUserId(input.userId, input.authorization);

    const { orders, total } = await this.orderRepo.findDeliveredByCustomerId(
      input.userId,
      input.page,
      input.limit,
    );

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [restaurant, deliveryInfo] = await Promise.all([
          this.restaurantInfoPort.getRestaurantInfo(order.restaurantId).catch(() => null),
          order.deliveryId
            ? this.deliveryInfoPort.getDeliveryInfo(order.deliveryId).catch(() => null)
            : Promise.resolve(null),
        ]);

        let restaurantCityName = 'Ciudad desconocida';

        if (restaurant?.address) {
          restaurantCityName = await this.locationPort.getCityName(restaurant.address.cityId).catch(() => 'Ciudad desconocida');
        }

        return {
          order,
          restaurant: restaurant
            ? {
                id: restaurant.id,
                name: restaurant.name,
                phone: restaurant.phone,
                email: restaurant.email,
                logoUrl: restaurant.logoUrl,
                address: restaurant.address
                  ? {
                      id: restaurant.address.id,
                      address: restaurant.address.address,
                      cityName: restaurantCityName,
                      latitude: restaurant.address.latitude,
                      longitude: restaurant.address.longitude,
                    }
                  : null,
              }
            : null,
          delivery: deliveryInfo
            ? {
                userId: deliveryInfo.userId,
                firstName: deliveryInfo.firstName,
                lastName: deliveryInfo.lastName,
                phone: deliveryInfo.phone,
                avatarUrl: deliveryInfo.avatarUrl,
              }
            : null,
        };
      }),
    );

    return {
      orders: enrichedOrders,
      pagination: {
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }
}
