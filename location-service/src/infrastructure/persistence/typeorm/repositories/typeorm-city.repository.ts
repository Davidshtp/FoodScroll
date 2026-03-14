import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../../../../domain/entities/city.entity';
import { CityRepository } from '../../../../domain/repositories/city.repository';
import { CityOrmEntity } from '../entities/city.orm-entity';
import { CityMapper } from '../mappers/city.mapper';

@Injectable()
export class TypeOrmCityRepository implements CityRepository {
  constructor(
    @InjectRepository(CityOrmEntity)
    private readonly repo: Repository<CityOrmEntity>,
  ) {}

  async save(city: City): Promise<City> {
    const orm = CityMapper.toOrm(city);
    const saved = await this.repo.save(orm);
    return CityMapper.toDomain(saved);
  }

  async findById(id: string): Promise<City | null> {
    const orm = await this.repo.findOne({ 
      where: { id },
      relations: ['department'],
    });
    return orm ? CityMapper.toDomain(orm) : null;
  }

  async findByDepartmentId(departmentId: string): Promise<City[]> {
    const orms = await this.repo.find({ 
      where: { departmentId },
      order: { name: 'ASC' },
    });
    return orms.map(CityMapper.toDomain);
  }

  async findByNameAndDepartmentId(
    name: string,
    departmentId: string,
  ): Promise<City | null> {
    const orm = await this.repo.findOne({
      where: { name, departmentId },
    });
    return orm ? CityMapper.toDomain(orm) : null;
  }
}
