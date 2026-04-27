import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Vehicle, VehicleSoat, VehicleTechno } from '../../../domain';
import {
  VehicleRepository,
  VEHICLE_REPOSITORY,
} from '../../../domain/repositories';
import {
  RuntVerificationPort,
  RUNT_VERIFICATION_PORT,
} from '../../../application/ports/runt-verification.port';
import { GetDeliveryProfileUseCase } from '../delivery-profile';
import {
  RuntVerificationError,
  VehicleAlreadyExistsError,
} from '../../../domain/errors/domain.errors';
import {
  DELIVERY_IDENTITY_PORT,
  DeliveryIdentityPort,
} from '../../ports/delivery-identity.port';
import { VehicleSharedHelper } from './vehicle-shared.helper';

export interface ResolveCaptchaInput {
  userId: string;
  sessionId: string;
  captchaText: string;
  plate?: string;
  documentType?: string;
  documentNumber?: string;
  authorization?: string;
}

export interface ResolveCaptchaOutput {
  vehicle: Vehicle;
  soats: VehicleSoat[];
  technos: VehicleTechno[];
  status: {
    canWork: boolean;
    reasons: string[];
  };
  access_token: string;
}

@Injectable()
export class ResolveCaptchaUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepo: VehicleRepository,
    @Inject(RUNT_VERIFICATION_PORT)
    private readonly runtPort: RuntVerificationPort,
    @Inject(DELIVERY_IDENTITY_PORT)
    private readonly identityPort: DeliveryIdentityPort,
    private readonly getProfileUseCase: GetDeliveryProfileUseCase,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: ResolveCaptchaInput): Promise<ResolveCaptchaOutput> {
    const { profile } = await this.getProfileUseCase.execute(input.userId);

    const existingVehicles = await this.vehicleRepo.findAllByProfileId(
      profile.id,
    );
    if (existingVehicles.length > 0) {
      throw new VehicleAlreadyExistsError(profile.id);
    }

    const runtAccessToken =
      input.authorization?.replace(/^Bearer\s+/i, '').trim() || '';
    const result = await this.runtPort.verifyManual({
      sessionId: input.sessionId,
      plate: input.plate || '',
      documentType: input.documentType || 'CC',
      documentNumber: input.documentNumber || '',
      captchaText: input.captchaText,
      accessToken: runtAccessToken,
    });

    if (result.error || !result.vehicleInfo) {
      throw new RuntVerificationError(
        result.message || 'Error en verificación RUNT con CAPTCHA manual',
        result.code || 'RUNT_VERIFICATION_ERROR',
      );
    }

    const vehicleInfo = result.vehicleInfo;
    const vehicleType = VehicleSharedHelper.deriveVehicleType(
      vehicleInfo.classification,
      vehicleInfo.vehicleClass,
    );

    const latestSoat = VehicleSharedHelper.findLatestSoat(
      result.soatHistory || [],
    );
    const latestTechno = VehicleSharedHelper.findLatestTechno(
      result.rtmHistory || [],
    );

    return await this.dataSource.transaction(async (manager) => {
      const saveResult = await VehicleSharedHelper.saveVehicleWithHistory(
        manager,
        {
          profileId: profile.id,
          vehicleType: vehicleType,
          plate: vehicleInfo.plate,
          brand: vehicleInfo.brand ?? null,
          line: vehicleInfo.line ?? null,
          modelYear: vehicleInfo.modelYear ?? null,
          color: vehicleInfo.color ?? null,
          soatStatus: result.soatStatus ?? null,
          soatExpiry: latestSoat?.endDate ? new Date(latestSoat.endDate) : null,
          rtmStatus: result.rtmStatus ?? null,
          rtmExpiry: latestTechno?.expiresAt
            ? new Date(latestTechno.expiresAt)
            : null,
          soatHistory: result.soatHistory || [],
          rtmHistory: result.rtmHistory || [],
          authorization: input.authorization,
          identityPort: this.identityPort,
          userId: profile.userId,
        },
      );

      return {
        vehicle: saveResult.vehicle,
        soats: saveResult.soats,
        technos: saveResult.technos,
        status: { canWork: saveResult.canWork, reasons: saveResult.reasons },
        access_token: saveResult.accessToken,
      };
    });
  }
}
