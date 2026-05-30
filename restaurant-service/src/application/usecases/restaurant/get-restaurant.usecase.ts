import { Inject, Injectable } from '@nestjs/common';
import { Restaurant } from '../../../domain/entities/restaurant.entity';
import { OnboardingStatus } from '../../../domain/enums/onboarding-status.enum';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';
import { RestaurantOnboardingCalculator } from '../../services/restaurant-onboarding-calculator.service';

export interface GetRestaurantOutput {
  restaurant: Restaurant;
  onboardingStatus: OnboardingStatus;
}

@Injectable()
export class GetRestaurantUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    private readonly onboardingCalculator: RestaurantOnboardingCalculator,
  ) {}

  async execute(userId: string): Promise<GetRestaurantOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(userId);
    }

    const address = await this.restaurantRepo.findAddressByRestaurantId(restaurant.id);
    const hours = await this.restaurantRepo.findOpeningHoursByRestaurantId(restaurant.id);

    const onboardingStatus = this.onboardingCalculator.calculate({
      restaurant,
      hasAddress: !!address,
      totalHoursDays: hours.length,
    });

    return { restaurant, onboardingStatus };
  }
}
