import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../domain/entities/order.entity';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../ports/restaurant-info.port';
import { CustomerInfoPort, CUSTOMER_INFO_PORT } from '../../ports/customer-info.port';
import { LocationPort, LOCATION_PORT } from '../../ports/location.port';
import { ForbiddenRoleError } from '../../../domain/errors/domain.errors';

export interface EnrichedDeliveryHistoryOrder {
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
  deliveryAddress: {
    id: string;
    details: string | null;
    mainAddress: string | null;
    neighborhood: string;
    latitude: number;
    longitude: number;
    cityName: string;
  } | null;
  customer: {
    userId: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl: string | null;
  } | null;
}

export interface GetDeliveryOrderHistoryInput {
  userId: string;
  role: string;
  page: number;
  limit: number;
}

export interface GetDeliveryOrderHistoryOutput {
  orders: EnrichedDeliveryHistoryOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class GetDeliveryOrderHistoryUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    @Inject(RESTAURANT_INFO_PORT) private readonly restaurantInfoPort: RestaurantInfoPort,
    @Inject(CUSTOMER_INFO_PORT) private readonly customerInfoPort: CustomerInfoPort,
    @Inject(LOCATION_PORT) private readonly locationPort: LocationPort,
  ) {}

  async execute(input: GetDeliveryOrderHistoryInput): Promise<GetDeliveryOrderHistoryOutput> {
    if (input.role !== 'DELIVERY') {
      throw new ForbiddenRoleError(input.role, 'access delivery order history');
    }

    const { orders, total } = await this.orderRepo.findDeliveredByDeliveryId(
      input.userId,
      input.page,
      input.limit,
    );

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const [restaurant, customerInfo] = await Promise.all([
          this.restaurantInfoPort.getRestaurantInfo(order.restaurantId).catch(() => null),
          this.customerInfoPort.getCustomerInfo(order.customerId).catch(() => null),
        ]);

        const deliveryAddress = customerInfo?.deliveryAddress ?? null;

        let restaurantCityName = 'Ciudad desconocida';
        let deliveryCityName = 'Ciudad desconocida';

        const cityIdsToResolve = new Set<string>();
        if (restaurant?.address) cityIdsToResolve.add(restaurant.address.cityId);
        if (deliveryAddress) cityIdsToResolve.add(deliveryAddress.cityId);

        const cityNames = await Promise.all(
          [...cityIdsToResolve].map(async (cityId) => {
            const name = await this.locationPort.getCityName(cityId);
            return { cityId, name };
          }),
        );

        const cityMap = new Map(cityNames.map((c) => [c.cityId, c.name]));

        if (restaurant?.address) {
          restaurantCityName = cityMap.get(restaurant.address.cityId) ?? 'Ciudad desconocida';
        }
        if (deliveryAddress) {
          deliveryCityName = cityMap.get(deliveryAddress.cityId) ?? 'Ciudad desconocida';
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
          deliveryAddress: deliveryAddress
            ? {
                id: deliveryAddress.id,
                details: deliveryAddress.details,
                mainAddress: deliveryAddress.mainAddress,
                neighborhood: deliveryAddress.neighborhood,
                latitude: deliveryAddress.latitude,
                longitude: deliveryAddress.longitude,
                cityName: deliveryCityName,
              }
            : null,
          customer: customerInfo?.profile ?? null,
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
