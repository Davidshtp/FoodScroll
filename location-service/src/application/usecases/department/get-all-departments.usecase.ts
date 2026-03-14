import { Inject, Injectable } from '@nestjs/common';
import { Department } from '../../../domain/entities/department.entity';
import { DepartmentRepository, DEPARTMENT_REPOSITORY } from '../../../domain/repositories/department.repository';

export interface GetAllDepartmentsOutput {
  departments: Department[];
}

@Injectable()
export class GetAllDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
  ) { }

  async execute(): Promise<GetAllDepartmentsOutput> {
    const departments = await this.departmentRepo.findAll();
    return { departments };
  }
}
