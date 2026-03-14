import { Inject, Injectable } from '@nestjs/common';
import { City } from '../../../domain/entities/city.entity';
import { CityRepository, CITY_REPOSITORY } from '../../../domain/repositories/city.repository';
import { CityNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetCityByIdInput {
  id: string;
}

export interface GetCityByIdOutput {
  city: City;
  departmentId: string;
}

@Injectable()
export class GetCityByIdUseCase {
  constructor(
    @Inject(CITY_REPOSITORY)
    private readonly cityRepo: CityRepository,
  ) { }

  async execute(input: GetCityByIdInput): Promise<GetCityByIdOutput> {
    const city = await this.cityRepo.findById(input.id);

    if (!city) {
      throw new CityNotFoundError(input.id);
    }

    return {
      city,
      departmentId: city.departmentId,
    };
  }
}
