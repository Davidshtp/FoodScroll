import { City } from '../entities/city.entity';

export const CITY_REPOSITORY = Symbol('CITY_REPOSITORY');

export interface CityRepository {
  save(city: City): Promise<City>;
  findById(id: string): Promise<City | null>;
  findByDepartmentId(departmentId: string): Promise<City[]>;
  findByNameAndDepartmentId(
    name: string,
    departmentId: string,
  ): Promise<City | null>;
}
