import { Injectable } from '@nestjs/common';
import { Restaurant } from '../../domain/entities/restaurant.entity';
import { OnboardingStatus } from '../../domain/enums/onboarding-status.enum';

@Injectable()
export class RestaurantOnboardingCalculator {
  calculate(params: {
    restaurant: Restaurant | null;
    hasAddress: boolean;
    totalHoursDays: number;
  }): OnboardingStatus {
    if (!params.restaurant || params.restaurant.deletedAt !== null) {
      return OnboardingStatus.BASIC_INFO;
    }
    if (!params.hasAddress) return OnboardingStatus.ADDRESS_REQUIRED;
    if (params.totalHoursDays < 7) return OnboardingStatus.OPENING_HOURS_REQUIRED;
    return OnboardingStatus.COMPLETED;
  }
}
