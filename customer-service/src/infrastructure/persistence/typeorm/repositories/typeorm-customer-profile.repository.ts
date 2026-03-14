import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerProfile } from '../../../../domain/entities/customer-profile.entity';
import { CustomerProfileRepository } from '../../../../domain/repositories/customer-profile.repository';
import { CustomerProfileOrmEntity } from '../entities/customer-profile.orm-entity';
import { CustomerProfileMapper } from '../mappers/customer-profile.mapper';

@Injectable()
export class TypeOrmCustomerProfileRepository implements CustomerProfileRepository {
  constructor(
    @InjectRepository(CustomerProfileOrmEntity)
    private readonly repo: Repository<CustomerProfileOrmEntity>,
  ) {}

  async save(profile: CustomerProfile): Promise<void> {
    const orm = CustomerProfileMapper.toOrm(profile);
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<CustomerProfile | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? CustomerProfileMapper.toDomain(orm) : null;
  }

  async findByUserId(userId: string): Promise<CustomerProfile | null> {
    const orm = await this.repo.findOne({ where: { userId } });
    return orm ? CustomerProfileMapper.toDomain(orm) : null;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return this.repo.existsBy({ userId });
  }
}
