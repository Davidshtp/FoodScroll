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
export class UploadLogoUseCase {
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

    if (existing.logoUrl && this.cloudinaryService.isCloudinaryUrl(existing.logoUrl)) {
      await this.cloudinaryService.deleteLogo(existing.logoUrl);
    }

    const logoUrl = await this.cloudinaryService.uploadLogo(input.file);

    const updated = existing.updateBasicInfo({ logoUrl });
    await this.restaurantRepo.save(updated);

    return { imageUrl: logoUrl };
  }
}
