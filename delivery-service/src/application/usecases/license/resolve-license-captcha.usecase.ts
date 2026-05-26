import { Inject, Injectable } from '@nestjs/common';
import {
  DriverLicense,
  Vehicle,
  VehicleSoat,
  VehicleTechno,
} from '../../../domain';
import {
  DRIVER_LICENSE_REPOSITORY,
  DriverLicenseRepository,
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  LicenseVerificationError,
  LicenseAlreadyExistsError,
  VehicleNotFoundError,
} from '../../../domain/errors/domain.errors';
import {
  LICENSE_VERIFICATION_PORT,
  RuntLicenseVerificationPort,
} from '../../ports/runt-license-verification.port';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import { VehicleSharedHelper } from '../vehicle/vehicle-shared.helper';
import { OnboardingCalculator } from '../../services/onboarding-calculator.service';

export interface ResolveLicenseCaptchaInput {
  userId: string;
  sessionId: string;
  captchaText: string;
  documentType?: string;
  documentNumber?: string;
  authorization?: string;
}

export interface ResolveLicenseCaptchaOutput {
  license: DriverLicense;
  status: {
    canWork: boolean;
    reasons: string[];
  };
  access_token: string;
}

@Injectable()
export class ResolveLicenseCaptchaUseCase {
  constructor(
    @Inject(DRIVER_LICENSE_REPOSITORY)
    private readonly licenseRepo: DriverLicenseRepository,
    @Inject(LICENSE_VERIFICATION_PORT)
    private readonly licensePort: RuntLicenseVerificationPort,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly onboardingCalculator: OnboardingCalculator,
  ) {}

  async execute(
    input: ResolveLicenseCaptchaInput,
  ): Promise<ResolveLicenseCaptchaOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const existing = await this.licenseRepo.findByProfileId(profile.id);
    if (existing) {
      throw new LicenseAlreadyExistsError(profile.id);
    }

    const vehicles = await this.vehicleRepo.findAllByProfileId(profile.id);
    const activeVehicle = vehicles.length > 0 ? vehicles[0] : null;
    if (!activeVehicle) {
      throw new VehicleNotFoundError('active');
    }

    const runtAccessToken =
      input.authorization?.replace(/^Bearer\s+/i, '').trim() || '';
    const result = await this.licensePort.verifyManual({
      sessionId: input.sessionId,
      documentType: input.documentType || 'CC',
      documentNumber: input.documentNumber || profile.documentNumber,
      captchaText: input.captchaText,
      accessToken: runtAccessToken,
    });

    if (result.error || !result.licenseInfo) {
      throw new LicenseVerificationError(
        result.message || 'Error en verificación de licencia con CAPTCHA manual',
        result.code || 'LICENSE_VERIFICATION_ERROR',
      );
    }

    const info = result.licenseInfo;
    const isActive = (info.status || '').toUpperCase() === 'ACTIVA';
    const issueDate = info.issueDate ? new Date(info.issueDate) : null;

    const existingByDoc =
      await this.licenseRepo.findByDocumentNumberIncludingDeleted(
        profile.documentNumber,
      );
    if (existingByDoc?.deletedAt) {
      await this.licenseRepo.restore(profile.documentNumber);
    }

    const license = DriverLicense.create(
      profile.documentNumber,
      profile.id,
      info.licenseNumber,
      info.issuingOffice,
      issueDate || undefined,
      info.status,
      isActive,
      new Date(),
    );

    const saved = await this.licenseRepo.save(license);

    const { soatVigente, rtmVigente } = await this.getVehicleStatus(
      activeVehicle,
    );

    const onboarding = this.onboardingCalculator.calculate({
      vehicleType: profile.vehicleType,
      hasActiveVehicle: true,
      hasActiveLicense: true,
      soatVigente,
      rtmVigente,
      licenseActiva: saved.isActive,
    });

    let accessToken = '';
    if (input.authorization) {
      const identityResult = await this.identityPort.updateUserStatus({
        userId: profile.userId,
        onboardingStatus: onboarding.onboardingStatus,
        isActive: onboarding.isActive,
        authorization: input.authorization,
      });
      accessToken = identityResult.access_token;
    }

    const reasons: string[] = [];
    if (!soatVigente) reasons.push('SOAT_NO_VIGENTE');
    if (!rtmVigente) reasons.push('RTM_NO_VIGENTE');
    if (!saved.isActive) reasons.push('LICENCIA_NO_ACTIVA');

    return {
      license: saved,
      status: { canWork: onboarding.isActive, reasons },
      access_token: accessToken,
    };
  }

  private async getVehicleStatus(vehicle: Vehicle): Promise<{
    soatVigente: boolean;
    rtmVigente: boolean;
  }> {
    const soats: VehicleSoat[] =
      await this.vehicleRepo.findSoatsByVehicleId(vehicle.id);
    const technos: VehicleTechno[] =
      await this.vehicleRepo.findTechnosByVehicleId(vehicle.id);

    const latestSoat = VehicleSharedHelper.getLatestFromArray(soats, 'endDate');
    const latestTechno = VehicleSharedHelper.getLatestFromArray(
      technos,
      'expiresAt',
    );

    const soatVigente = latestSoat ? latestSoat.isVigente() : false;
    const rtmVigente = latestTechno ? latestTechno.isVigente() : false;

    return { soatVigente, rtmVigente };
  }
}
