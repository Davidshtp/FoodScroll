import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Department } from '../../../domain/entities/department.entity';
import { DepartmentRepository, DEPARTMENT_REPOSITORY } from '../../../domain/repositories/department.repository';
import { DuplicateDepartmentError } from '../../../domain/errors/domain.errors';

export interface CreateDepartmentInput {
  name: string;
}

export interface CreateDepartmentOutput {
  department: Department;
}

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
  ) {}

  async execute(input: CreateDepartmentInput): Promise<CreateDepartmentOutput> {
    // Verificar si ya existe
    const existing = await this.departmentRepo.findByName(input.name);
    if (existing) {
      throw new DuplicateDepartmentError(input.name);
    }

    // Crear departamento
    const department = Department.create(uuidv4(), input.name);
    const saved = await this.departmentRepo.save(department);

    return { department: saved };
  }
}
