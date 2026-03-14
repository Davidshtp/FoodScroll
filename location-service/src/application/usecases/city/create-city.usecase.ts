import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { City } from '../../../domain/entities/city.entity';
import { CityRepository, CITY_REPOSITORY } from '../../../domain/repositories/city.repository';
import {DepartmentRepository,DEPARTMENT_REPOSITORY,} from '../../../domain/repositories/department.repository';
import { DepartmentNotFoundError } from '../../../domain/errors/domain.errors';

export interface CreateCityInput {
  name: string;
  departmentId: string;
}

export interface CreateCityOutput {
  city: City;
}

@Injectable()
export class CreateCityUseCase {
  constructor(
    @Inject(CITY_REPOSITORY)
    private readonly cityRepo: CityRepository,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
  ) {}

  async execute(input: CreateCityInput): Promise<CreateCityOutput> {
    // Verificar que el departamento existe
    const department = await this.departmentRepo.findById(input.departmentId);
    if (!department) {
      throw new DepartmentNotFoundError(input.departmentId);
    }

    // Crear ciudad
    const city = City.create(uuidv4(), input.name, input.departmentId);
    const saved = await this.cityRepo.save(city);

    return { city: saved };
  }
}
