import { Inject, Injectable } from '@nestjs/common';
import { DeliveryProfile } from '../../../domain/entities';
import { DeliveryProfileRepository, DELIVERY_PROFILE_REPOSITORY } from '../../../domain/repositories';
import { DeliveryProfileNotFoundError } from '../../../domain/errors/domain.errors';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';

export interface UploadAvatarInput {
  userId: string;
  file: Express.Multer.File;
}

export interface UploadAvatarOutput {
  avatarUrl: string;
}

@Injectable()
export class UploadAvatarUseCase {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: UploadAvatarInput): Promise<UploadAvatarOutput> {
    const existing = await this.profileRepo.findByUserId(input.userId);
    if (!existing) {
      throw new DeliveryProfileNotFoundError(input.userId);
    }

    if (existing.avatarUrl && this.cloudinaryService.isCloudinaryUrl(existing.avatarUrl)) {
      await this.cloudinaryService.deleteImage(existing.avatarUrl);
    }

    const avatarUrl = await this.cloudinaryService.uploadImage(input.file);

    const now = new Date();
    const updated = new DeliveryProfile(
      existing.id,
      existing.userId,
      existing.firstName,
      existing.lastName,
      existing.phone,
      existing.documentType,
      existing.documentNumber,
      existing.birthDate,
      existing.gender,
      existing.vehicleType,
      avatarUrl,
      existing.createdAt,
      now,
    );

    await this.profileRepo.save(updated);

    return { avatarUrl };
  }
}
