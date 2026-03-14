import { Inject, Injectable } from '@nestjs/common';
import {GeocodingServicePort,GEOCODING_SERVICE_PORT} from '../../ports/geocoding-service.port';
import {CityRepository,CITY_REPOSITORY} from '../../../domain/repositories/city.repository';
import {DepartmentRepository,DEPARTMENT_REPOSITORY} from '../../../domain/repositories/department.repository';

export interface ReverseGeocodeInput {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeOutput {
  cityId: string | null;
  mainAddress: string | null;
  latitude: number;
  longitude: number;
}

@Injectable()
export class ReverseGeocodeUseCase {
  constructor(
    @Inject(GEOCODING_SERVICE_PORT)
    private readonly geocodingService: GeocodingServicePort,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
    @Inject(CITY_REPOSITORY)
    private readonly cityRepo: CityRepository,
  ) {}

  async execute(input: ReverseGeocodeInput): Promise<ReverseGeocodeOutput> {
    const result = await this.geocodingService.reverseGeocode(
      input.latitude,
      input.longitude,
    );

    let cityId: string | null = null;

    if (result.departmentName && result.cityName) {
      const department = await this.departmentRepo.findByName(
        result.departmentName,
      );

      if (department) {
        const city = await this.cityRepo.findByNameAndDepartmentId(
          result.cityName,
          department.id,
        );
        cityId = city?.id ?? null;
      }
    }

    return {
      cityId,
      mainAddress: result.mainAddress,
      latitude: result.latitude,
      longitude: result.longitude,
    };
  }
}
