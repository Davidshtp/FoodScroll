import { Inject, Injectable } from '@nestjs/common';
import { RestaurantOpeningHours } from '../../../domain/entities/restaurant-opening-hours.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetRestaurantOpeningHoursInput {
  userId: string;
}

export interface GetRestaurantOpeningHoursOutput {
  hours: RestaurantOpeningHours[];
}

@Injectable()
export class GetRestaurantOpeningHoursUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(input: GetRestaurantOpeningHoursInput): Promise<GetRestaurantOpeningHoursOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(input.userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(input.userId);
    }

    const hours = await this.restaurantRepo.findOpeningHoursByRestaurantId(restaurant.id);
    return { hours };
  }
}
