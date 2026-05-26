import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
} from '../../../domain/repositories/driver-license.repository';
import {
  DELIVERY_PROFILE_REPOSITORY,
  DeliveryProfileRepository,
} from '../../../domain/repositories/delivery-profile.repository';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';
import { OnboardingCalculator } from '../../services/onboarding-calculator.service';

export interface DeleteVehicleOutput {
  message: string;
  access_token: string;
}

@Injectable()
export class DeleteVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    @Inject(DELIVERY_PROFILE_REPOSITORY)
    private readonly profileRepo: DeliveryProfileRepository,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly onboardingCalculator: OnboardingCalculator,
  ) {}

  async execute(
    userId: string,
    authorization?: string,
  ): Promise<DeleteVehicleOutput> {
    const { profile } = await this.getProfileUseCase.execute(userId);

    if (
      profile.vehicleType === VehicleType.BICYCLE ||
      profile.vehicleType === VehicleType.WALKING ||
      profile.vehicleType === null
    ) {
      throw new BadRequestException(
        'No tienes un vehículo con SOAT y revisión tecnomecánica para eliminar',
      );
    }

    const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
    const activeVehicle = vehicles.find((v) => !v.deletedAt);

    if (!activeVehicle) {
      throw new NotFoundException('No tienes un vehículo activo para eliminar');
    }

    await this.vehicleRepo.softDelete(activeVehicle.id);

    await this.profileRepo.updateVehicleType(profile.id, null);

    const license = await this.licenseRepo.findByProfileId(profile.id);
    const onboarding = this.onboardingCalculator.calculate({
      vehicleType: profile.vehicleType,
      hasActiveVehicle: false,
      hasActiveLicense: !!license,
      soatVigente: false,
      rtmVigente: false,
      licenseActiva: license?.isActive ?? false,
    });

    let accessToken = '';
    if (authorization) {
      const result = await this.identityPort.updateUserStatus({
        userId,
        onboardingStatus: onboarding.onboardingStatus,
        isActive: onboarding.isActive,
        authorization,
      });
      accessToken = result.access_token;
    }

    return {
      message: 'Vehículo eliminado correctamente',
      access_token: accessToken,
    };
  }
}
