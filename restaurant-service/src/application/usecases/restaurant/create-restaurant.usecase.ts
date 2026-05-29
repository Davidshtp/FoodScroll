import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Restaurant } from '../../../domain/entities/restaurant.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantAlreadyExistsError } from '../../../domain/errors/domain.errors';
import {
  RESTAURANT_IDENTITY_PORT,
  RestaurantIdentityPort,
} from '../../ports/restaurant-identity.port';
import { RestaurantOnboardingCalculator } from '../../services/restaurant-onboarding-calculator.service';

export interface CreateRestaurantInput {
  userId: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  authorization?: string;
}

export interface CreateRestaurantOutput {
  restaurant: Restaurant;
  access_token: string;
}

@Injectable()
export class CreateRestaurantUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    @Inject(RESTAURANT_IDENTITY_PORT)
    private readonly identityPort: RestaurantIdentityPort,
    private readonly onboardingCalculator: RestaurantOnboardingCalculator,
  ) {}

  async execute(input: CreateRestaurantInput): Promise<CreateRestaurantOutput> {
    const existing = await this.restaurantRepo.findByUserId(input.userId);
    if (existing) {
      throw new RestaurantAlreadyExistsError(input.userId);
    }

    const initials = input.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const banners = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    ];
    const bannerUrl = banners[Math.floor(Math.random() * banners.length)];

    const restaurant = Restaurant.create({
      id: uuidv4(),
      userId: input.userId,
      name: input.name,
      description: input.description,
      phone: input.phone,
      email: input.email,
      logoUrl: `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&rounded=true`,
      bannerUrl,
    });

    const saved = await this.restaurantRepo.save(restaurant);

    let accessToken = '';
    if (input.authorization) {
      const status = this.onboardingCalculator.calculate({
        restaurant: saved,
        hasAddress: false,
        totalHoursDays: 0,
      });
      const result = await this.identityPort.updateUserStatus({
        userId: saved.userId,
        onboardingStatus: status,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return { restaurant: saved, access_token: accessToken };
  }
}
