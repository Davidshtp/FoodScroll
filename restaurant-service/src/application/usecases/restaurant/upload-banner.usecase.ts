import { Inject, Injectable } from '@nestjs/common';
import { RestaurantRepository, RESTAURANT_REPOSITORY } from '../../../domain/repositories/restaurant.repository';
import { RestaurantNotFoundError } from '../../../domain/errors/domain.errors';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';

export interface UploadImageInput {
  userId: string;
  file: Express.Multer.File;
}

export interface UploadImageOutput {
  imageUrl: string;
}

@Injectable()
export class UploadBannerUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepo: RestaurantRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: UploadImageInput): Promise<UploadImageOutput> {
    const existing = await this.restaurantRepo.findByUserId(input.userId);
    if (!existing) {
      throw new RestaurantNotFoundError(input.userId);
    }

    if (existing.bannerUrl && this.cloudinaryService.isCloudinaryUrl(existing.bannerUrl)) {
      await this.cloudinaryService.deleteBanner(existing.bannerUrl);
    }

    const bannerUrl = await this.cloudinaryService.uploadBanner(input.file);

    const updated = existing.updateBasicInfo({ bannerUrl });
    await this.restaurantRepo.save(updated);

    return { imageUrl: bannerUrl };
  }
}
