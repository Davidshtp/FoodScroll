import { Inject, Injectable } from '@nestjs/common';
import { RestaurantRepository, RESTAURANT_REPOSITORY } from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';

export interface DeleteImageInput {
  userId: string;
}

export interface DeleteImageOutput {
  imageUrl: string;
}

@Injectable()
export class DeleteBannerUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: DeleteImageInput): Promise<DeleteImageOutput> {
    const existing = await this.restaurantRepo.findByUserId(input.userId);
    if (!existing) {
      throw new RestaurantNotFoundError(input.userId);
    }

    if (existing.bannerUrl && this.cloudinaryService.isCloudinaryUrl(existing.bannerUrl)) {
      await this.cloudinaryService.deleteBanner(existing.bannerUrl);
    }

    const banners = [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a',
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17',
    ];
    const defaultBannerUrl = banners[Math.floor(Math.random() * banners.length)];

    const updated = existing.updateBasicInfo({ bannerUrl: defaultBannerUrl });
    await this.restaurantRepo.save(updated);

    return { imageUrl: defaultBannerUrl };
  }
}
