import { Inject, Injectable } from '@nestjs/common';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { CustomerProfileNotFoundError } from '../../../domain/errors/domain.errors';
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
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: UploadAvatarInput): Promise<UploadAvatarOutput> {
    const existing = await this.profileRepo.findByUserId(input.userId);
    if (!existing) {
      throw new CustomerProfileNotFoundError(input.userId);
    }

    if (existing.avatarUrl && this.cloudinaryService.isCloudinaryUrl(existing.avatarUrl)) {
      await this.cloudinaryService.deleteImage(existing.avatarUrl);
    }

    const avatarUrl = await this.cloudinaryService.uploadImage(input.file);

    const updated = existing.update({ avatarUrl });
    await this.profileRepo.save(updated);

    return { avatarUrl };
  }
}
