import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RestaurantAddress } from '../../../domain/entities/restaurant-address.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import {
  RestaurantNotFoundError,
} from '../../../domain/errors/domain.errors';
import {
  RESTAURANT_IDENTITY_PORT,
  RestaurantIdentityPort,
} from '../../ports/restaurant-identity.port';
import { RestaurantOnboardingCalculator } from '../../services/restaurant-onboarding-calculator.service';

export interface UpdateRestaurantAddressInput {
  userId: string;
  address: string;
  cityId: string;
  latitude: number;
  longitude: number;
  authorization?: string;
}

export interface UpdateRestaurantAddressOutput {
  address: RestaurantAddress;
  access_token: string;
}

@Injectable()
export class UpdateRestaurantAddressUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    @Inject(RESTAURANT_IDENTITY_PORT)
    private readonly identityPort: RestaurantIdentityPort,
    private readonly onboardingCalculator: RestaurantOnboardingCalculator,
  ) {}

  async execute(
    input: UpdateRestaurantAddressInput,
  ): Promise<UpdateRestaurantAddressOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(input.userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(input.userId);
    }

    let address = await this.restaurantRepo.findAddressByRestaurantId(
      restaurant.id,
    );

    if (address) {
      address = address.update({
        address: input.address,
        cityId: input.cityId,
        latitude: input.latitude,
        longitude: input.longitude,
      });
    } else {
      address = RestaurantAddress.create({
        id: uuidv4(),
        restaurantId: restaurant.id,
        address: input.address,
        cityId: input.cityId,
        latitude: input.latitude,
        longitude: input.longitude,
      });
    }

    const saved = await this.restaurantRepo.saveAddress(address);

    let accessToken = '';
    if (input.authorization) {
      const status = this.onboardingCalculator.calculate({
        restaurant,
        hasAddress: true,
        totalHoursDays: 0,
      });
      const result = await this.identityPort.updateUserStatus({
        userId: restaurant.userId,
        onboardingStatus: status,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return { address: saved, access_token: accessToken };
  }
}
