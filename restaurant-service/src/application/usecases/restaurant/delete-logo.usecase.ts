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
export class DeleteLogoUseCase {
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

    if (existing.logoUrl && this.cloudinaryService.isCloudinaryUrl(existing.logoUrl)) {
      await this.cloudinaryService.deleteLogo(existing.logoUrl);
    }

    const initials = existing.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const defaultLogoUrl = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&rounded=true`;

    const updated = existing.updateBasicInfo({ logoUrl: defaultLogoUrl });
    await this.restaurantRepo.save(updated);

    return { imageUrl: defaultLogoUrl };
  }
}
