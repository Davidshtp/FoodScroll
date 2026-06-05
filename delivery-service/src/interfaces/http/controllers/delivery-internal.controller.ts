import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ServiceSecretGuard } from '../guards/service-secret.guard';
import {
  DeliveryProfileRepository,
  DELIVERY_PROFILE_REPOSITORY,
} from '../../../domain/repositories';
import { DeliveryProfileNotFoundError } from '../../../domain/errors/domain.errors';

@Controller('delivery-profile/internal')
@UseGuards(ServiceSecretGuard)
export class DeliveryInternalController {
  constructor(
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
  ) {}

  @Get(':userId')
  async findByUserId(@Param('userId') userId: string) {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new DeliveryProfileNotFoundError(userId);
    }

    return {
      profile: {
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
      },
    };
  }
}
