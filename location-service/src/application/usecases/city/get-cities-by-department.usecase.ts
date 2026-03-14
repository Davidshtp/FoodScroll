import { Inject, Injectable } from '@nestjs/common';
import { City } from '../../../domain/entities/city.entity';
import { CityRepository, CITY_REPOSITORY } from '../../../domain/repositories/city.repository';
import { DepartmentRepository, DEPARTMENT_REPOSITORY } from '../../../domain/repositories/department.repository';
import { DepartmentNotFoundError } from '../../../domain/errors/domain.errors';

export interface GetCitiesByDepartmentInput {
  departmentId: string;
}

export interface GetCitiesByDepartmentOutput {
  cities: City[];
}

@Injectable()
export class GetCitiesByDepartmentUseCase {
  constructor(
    @Inject(CITY_REPOSITORY)
    private readonly cityRepo: CityRepository,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
  ) { }

  async execute(input: GetCitiesByDepartmentInput): Promise<GetCitiesByDepartmentOutput> {
    // Verificar que el departamento existe
    const department = await this.departmentRepo.findById(input.departmentId);
    if (!department) {
      throw new DepartmentNotFoundError(input.departmentId);
    }

    const cities = await this.cityRepo.findByDepartmentId(input.departmentId);
    return { cities };
  }
}
