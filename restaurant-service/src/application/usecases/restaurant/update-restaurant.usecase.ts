import { Inject, Injectable } from '@nestjs/common';
import { Restaurant } from '../../../domain/entities/restaurant.entity';
import {
  RestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';

export interface UpdateRestaurantInput {
  userId: string;
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export interface UpdateRestaurantOutput {
  restaurant: Restaurant;
}

@Injectable()
export class UpdateRestaurantUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
  ) {}

  async execute(input: UpdateRestaurantInput): Promise<UpdateRestaurantOutput> {
    const existing = await this.restaurantRepo.findByUserId(input.userId);
    if (!existing) {
      throw new RestaurantNotFoundError(input.userId);
    }

    const updated = existing.updateBasicInfo({
      name: input.name,
      description: input.description,
      phone: input.phone,
      email: input.email,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
    });

    const saved = await this.restaurantRepo.save(updated);
    return { restaurant: saved };
  }
}
