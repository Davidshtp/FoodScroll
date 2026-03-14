import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../../../domain/entities/department.entity';
import { DepartmentRepository } from '../../../../domain/repositories/department.repository';
import { DepartmentOrmEntity } from '../entities/department.orm-entity';
import { DepartmentMapper } from '../mappers/department.mapper';

@Injectable()
export class TypeOrmDepartmentRepository implements DepartmentRepository {
  constructor(
    @InjectRepository(DepartmentOrmEntity)
    private readonly repo: Repository<DepartmentOrmEntity>,
  ) {}

  async save(department: Department): Promise<Department> {
    const orm = DepartmentMapper.toOrm(department);
    const saved = await this.repo.save(orm);
    return DepartmentMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Department | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? DepartmentMapper.toDomain(orm) : null;
  }

  async findByName(name: string): Promise<Department | null> {
    const orm = await this.repo.findOne({ where: { name } });
    return orm ? DepartmentMapper.toDomain(orm) : null;
  }

  async findAll(): Promise<Department[]> {
    const orms = await this.repo.find({ order: { name: 'ASC' } });
    return orms.map(DepartmentMapper.toDomain);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
