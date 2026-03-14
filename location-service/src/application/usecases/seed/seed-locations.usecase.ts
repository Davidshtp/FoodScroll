import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Department } from '../../../domain/entities/department.entity';
import { City } from '../../../domain/entities/city.entity';
import {DepartmentRepository,DEPARTMENT_REPOSITORY,} from '../../../domain/repositories/department.repository';
import {CityRepository,CITY_REPOSITORY,} from '../../../domain/repositories/city.repository';
import { colombiaData } from '../../../infrastructure/data/colombia.data';

export interface SeedLocationsOutput {
  seeded: boolean;
  departmentsCount: number;
  citiesCount: number;
}

@Injectable()
export class SeedLocationsUseCase {
  private readonly logger = new Logger(SeedLocationsUseCase.name);

  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepo: DepartmentRepository,
    @Inject(CITY_REPOSITORY)
    private readonly cityRepo: CityRepository,
  ) {}

  async execute(): Promise<SeedLocationsOutput> {
    // Verificar si ya hay datos
    const count = await this.departmentRepo.count();
    if (count > 0) {
      this.logger.log('La base de datos ya tiene datos. No se necesita seeding.');
      return { seeded: false, departmentsCount: count, citiesCount: 0 };
    }

    this.logger.log('Iniciando el proceso de seeding...');
    
    let totalCities = 0;

    for (const dpto of colombiaData) {
      // Crear departamento
      const department = Department.create(uuidv4(), dpto.departamento);
      await this.departmentRepo.save(department);

      // Crear ciudades del departamento
      for (const cityName of dpto.ciudades) {
        const city = City.create(uuidv4(), cityName, department.id);
        await this.cityRepo.save(city);
        totalCities++;
      }
    }

    this.logger.log('Seeding completado exitosamente.');
    
    return { 
      seeded: true, 
      departmentsCount: colombiaData.length, 
      citiesCount: totalCities,
    };
  }
}
