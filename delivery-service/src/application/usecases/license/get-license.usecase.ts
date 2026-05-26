import { Inject, Injectable } from '@nestjs/common';
import { DriverLicense } from '../../../domain/entities/driver-license.entity';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
} from '../../../domain/repositories/driver-license.repository';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { VehicleType } from '../../../domain/enums/vehicle-type.enum';

export interface GetLicenseOutput {
  license: DriverLicense | null;
  message: string;
}

@Injectable()
export class GetLicenseUseCase {
  constructor(
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
  ) {}

  async execute(userId: string): Promise<GetLicenseOutput> {
    const { profile } = await this.getProfileUseCase.execute(userId);

    if (
      profile.vehicleType === VehicleType.BICYCLE ||
      profile.vehicleType === VehicleType.WALKING
    ) {
      return { license: null, message: 'No requiere licencia de conducción' };
    }

    const license = await this.licenseRepo.findByProfileId(profile.id);
    if (!license) {
      return {
        license: null,
        message: 'No has verificado tu licencia de conducción aún',
      };
    }

    return { license, message: '' };
  }
}
