import { Inject, Injectable } from '@nestjs/common';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
  VEHICLE_REPOSITORY,
  VehicleRepository,
} from '../../../domain/repositories';
import {
  LicenseNotFoundError,
} from '../../../domain/errors/domain.errors';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { OnboardingCalculator } from '../../services/onboarding-calculator.service';

export interface DeleteLicenseInput {
  userId: string;
  authorization?: string;
}

export interface DeleteLicenseOutput {
  message: string;
  access_token: string;
}

@Injectable()
export class DeleteLicenseUseCase {
  constructor(
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly onboardingCalculator: OnboardingCalculator,
  ) {}

  async execute(input: DeleteLicenseInput): Promise<DeleteLicenseOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const license = await this.licenseRepo.findByProfileId(profile.id);
    if (!license) {
      throw new LicenseNotFoundError(profile.id);
    }

    await this.licenseRepo.softDelete(license.documentNumber);

    const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
    const hasActiveVehicle = vehicles.length > 0;

    const onboarding = this.onboardingCalculator.calculate({
      vehicleType: profile.vehicleType,
      hasActiveVehicle,
      hasActiveLicense: false,
      soatVigente: false,
      rtmVigente: false,
      licenseActiva: false,
    });

    let accessToken = '';
    if (input.authorization) {
      const result = await this.identityPort.updateUserStatus({
        userId: profile.userId,
        onboardingStatus: onboarding.onboardingStatus,
        isActive: onboarding.isActive,
        authorization: input.authorization,
      });
      accessToken = result.access_token;
    }

    return { message: 'Licencia eliminada correctamente', access_token: accessToken };
  }
}
