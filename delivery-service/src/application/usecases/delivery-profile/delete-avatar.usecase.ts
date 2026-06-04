import { Inject, Injectable } from '@nestjs/common';
import { DeliveryProfile } from '../../../domain/entities';
import { DeliveryProfileRepository, DELIVERY_PROFILE_REPOSITORY } from '../../../domain/repositories';
import { DeliveryProfileNotFoundError } from '../../../domain/errors/domain.errors';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';

export interface DeleteAvatarInput {
  userId: string;
}

export interface DeleteAvatarOutput {
  avatarUrl: string;
}

@Injectable()
export class DeleteAvatarUseCase {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(input: DeleteAvatarInput): Promise<DeleteAvatarOutput> {
    const existing = await this.profileRepo.findByUserId(input.userId);
    if (!existing) {
      throw new DeliveryProfileNotFoundError(input.userId);
    }

    if (existing.avatarUrl && this.cloudinaryService.isCloudinaryUrl(existing.avatarUrl)) {
      await this.cloudinaryService.deleteImage(existing.avatarUrl);
    }

    const defaultAvatarUrl = this.generateDefaultAvatar(existing.firstName, existing.lastName);

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
      defaultAvatarUrl,
      existing.createdAt,
      now,
    );

    await this.profileRepo.save(updated);

    return { avatarUrl: defaultAvatarUrl };
  }

  private generateDefaultAvatar(firstName: string, lastName: string): string {
    const colors = [
      'FF5733', 'C0392B', '8E44AD', '2980B9', '1ABC9C',
      '27AE60', 'F39C12', 'D35400', '2C3E50', 'E91E63',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const name = encodeURIComponent(`${firstName} ${lastName}`);
    return `https://ui-avatars.com/api/?name=${name}&background=${color}&color=fff&rounded=true`;
  }
}
