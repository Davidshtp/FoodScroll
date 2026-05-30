import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RestaurantOpeningHours } from '../../../domain/entities/restaurant-opening-hours.entity';
import { OnboardingStatus } from '../../../domain/enums/onboarding-status.enum';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import {
  RestaurantNotFoundError,
  DuplicateDayOfWeekError,
} from '../../../domain/errors/domain.errors';
import {
  RESTAURANT_IDENTITY_PORT,
  RestaurantIdentityPort,
} from '../../ports/restaurant-identity.port';
import { RestaurantOnboardingCalculator } from '../../services/restaurant-onboarding-calculator.service';

export interface OpeningHourItem {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export interface UpsertRestaurantOpeningHoursInput {
  userId: string;
  hours: OpeningHourItem[];
  authorization?: string;
}

export interface UpsertRestaurantOpeningHoursOutput {
  hours: RestaurantOpeningHours[];
  access_token: string;
}

@Injectable()
export class UpsertRestaurantOpeningHoursUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    @Inject(RESTAURANT_IDENTITY_PORT)
    private readonly identityPort: RestaurantIdentityPort,
    private readonly onboardingCalculator: RestaurantOnboardingCalculator,
  ) {}

  async execute(
    input: UpsertRestaurantOpeningHoursInput,
  ): Promise<UpsertRestaurantOpeningHoursOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(input.userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(input.userId);
    }

    const seen = new Set<number>();
    for (const hour of input.hours) {
      if (seen.has(hour.dayOfWeek)) {
        throw new DuplicateDayOfWeekError(hour.dayOfWeek);
      }
      seen.add(hour.dayOfWeek);
    }

    const existing = await this.restaurantRepo.findOpeningHoursByRestaurantId(
      restaurant.id,
    );
    const existingMap = new Map(
      existing.map((h) => [h.dayOfWeek, h]),
    );

    const hours: RestaurantOpeningHours[] = input.hours.map((item) => {
      const existingItem = existingMap.get(item.dayOfWeek);
      if (existingItem) {
        return existingItem.update({
          openTime: item.openTime,
          closeTime: item.closeTime,
          isClosed: item.isClosed,
        });
      }
      return RestaurantOpeningHours.create({
        id: uuidv4(),
        restaurantId: restaurant.id,
        dayOfWeek: item.dayOfWeek,
        openTime: item.openTime,
        closeTime: item.closeTime,
        isClosed: item.isClosed,
      });
    });

    const saved = await this.restaurantRepo.upsertOpeningHours(hours);

    const existingHours = await this.restaurantRepo.findOpeningHoursByRestaurantId(
      restaurant.id,
    );
    const totalHoursDays = existingHours.length;

    const status = this.onboardingCalculator.calculate({
      restaurant,
      hasAddress: true,
      totalHoursDays,
    });

    let accessToken = '';
    if (input.authorization) {
      const payload: Record<string, unknown> = {
        onboardingStatus: status,
      };

      if (status === OnboardingStatus.COMPLETED) {
        payload.isActive = true;
      }

      const result = await this.identityPort.updateUserStatus({
        userId: restaurant.userId,
        ...payload,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return { hours: saved, access_token: accessToken };
  }
}
