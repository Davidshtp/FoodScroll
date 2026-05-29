import { Inject, Injectable } from '@nestjs/common';
import { RestaurantAddress } from '../../../domain/entities/restaurant-address.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetRestaurantAddressInput {
  userId: string;
}

export interface GetRestaurantAddressOutput {
  address: RestaurantAddress | null;
}

@Injectable()
export class GetRestaurantAddressUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(input: GetRestaurantAddressInput): Promise<GetRestaurantAddressOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(input.userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(input.userId);
    }

    const address = await this.restaurantRepo.findAddressByRestaurantId(restaurant.id);
    return { address };
  }
}
