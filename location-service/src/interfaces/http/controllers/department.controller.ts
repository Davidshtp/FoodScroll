import { Controller, Get } from '@nestjs/common';
import { GetAllDepartmentsUseCase } from '../../../application/usecases/department/get-all-departments.usecase';

@Controller('department')
export class DepartmentController {
  constructor(
    private readonly getAllDepartmentsUseCase: GetAllDepartmentsUseCase,
  ) {}

  @Get()
  async findAll() {
    const result = await this.getAllDepartmentsUseCase.execute();
    return result.departments;
  }
}
