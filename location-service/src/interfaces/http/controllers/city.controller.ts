import { Controller, Get, Param } from '@nestjs/common';
import { GetCityByIdUseCase } from '../../../application/usecases/city/get-city-by-id.usecase';
import { GetCitiesByDepartmentUseCase } from '../../../application/usecases/city/get-cities-by-department.usecase';
import { Public } from '../decorators';

@Controller('city')
export class CityController {
  constructor(
    private readonly getCityByIdUseCase: GetCityByIdUseCase,
    private readonly getCitiesByDepartmentUseCase: GetCitiesByDepartmentUseCase,
  ) {}

  @Public()
  @Get('by-department/:departmentId')
  async findByDepartment(@Param('departmentId') departmentId: string) {
    const result = await this.getCitiesByDepartmentUseCase.execute({ departmentId });
    return result.cities;
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.getCityByIdUseCase.execute({ id });
    return result.city;
  }
}
