import { Inject, Injectable } from '@nestjs/common';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';
import {
  RESTAURANT_IDENTITY_PORT,
  RestaurantIdentityPort,
} from '../../ports/restaurant-identity.port';

export interface DeleteRestaurantInput {
  userId: string;
  authorization?: string;
}

export interface DeleteRestaurantOutput {
  message: string;
  access_token: string;
}

@Injectable()
export class DeleteRestaurantUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    @Inject(RESTAURANT_IDENTITY_PORT)
    private readonly identityPort: RestaurantIdentityPort,
  ) {}

  async execute(input: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
    const restaurant = await this.restaurantRepo.findByUserId(input.userId);
    if (!restaurant) {
      throw new RestaurantNotFoundError(input.userId);
    }

    await this.restaurantRepo.deleteAddressById(restaurant.id);
    await this.restaurantRepo.deleteOpeningHoursByRestaurantId(restaurant.id);
    await this.restaurantRepo.deleteById(restaurant.id);

    let accessToken = '';
    if (input.authorization) {
      const result = await this.identityPort.updateUserStatus({
        userId: input.userId,
        onboardingStatus: 'BASIC_INFO',
        isActive: false,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return {
      message: 'Restaurante eliminado correctamente',
      access_token: accessToken,
    };
  }
}
