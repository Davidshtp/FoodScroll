import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CustomerProfile } from '../../../domain/entities/customer-profile.entity';
import { Gender } from '../../../domain/value-objects/gender.vo';
import { CustomerProfileRepository, CUSTOMER_PROFILE_REPOSITORY } from '../../../domain/repositories/customer-profile.repository';
import { CustomerProfileAlreadyExistsError } from '../../../domain/errors/domain.errors';
import { APP_STATUS_EVENTS_PUBLISHER, AppStatusEventsPublisher, createAppStatusUpdatedEvent } from '../../ports/customer-events.port';

export interface CreateCustomerProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl?: string;
  birthDate: string;
  gender: Gender;
}

export interface CreateCustomerProfileOutput {
  profile: CustomerProfile;
}

@Injectable()
export class CreateCustomerProfileUseCase {
  constructor(
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profileRepo: CustomerProfileRepository,
    @Inject(APP_STATUS_EVENTS_PUBLISHER)
    private readonly appStatusEventsPublisher: AppStatusEventsPublisher,
  ) { }

  async execute(input: CreateCustomerProfileInput): Promise<CreateCustomerProfileOutput> {
    const exists = await this.profileRepo.existsByUserId(input.userId);
    if (exists) {
      throw new CustomerProfileAlreadyExistsError(input.userId);
    }

    const avatarUrl = input.avatarUrl ?? this.generateDefaultAvatar(input.firstName, input.lastName);

    const profile = CustomerProfile.create({
      id: uuid(),
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarUrl,
      birthDate: new Date(input.birthDate),
      gender: input.gender,
    });

    await this.profileRepo.save(profile);

    await this.appStatusEventsPublisher.publishAppStatusUpdated(
      createAppStatusUpdatedEvent({
        userId: profile.userId,
        updatedAt: profile.updatedAt,
        onboardingStatus: profile.onboardingStatus,
      }),
    );

    return { profile };
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
