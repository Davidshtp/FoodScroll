import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../../../domain/entities/address.entity';
import { AddressRepository } from '../../../../domain/repositories/address.repository';
import { AddressOrmEntity } from '../entities/address.orm-entity';
import { AddressMapper } from '../mappers/address.mapper';

@Injectable()
export class TypeOrmAddressRepository implements AddressRepository {
  constructor(
    @InjectRepository(AddressOrmEntity)
    private readonly repo: Repository<AddressOrmEntity>,
  ) {}

  async save(address: Address): Promise<void> {
    const orm = AddressMapper.toOrm(address);
    await this.repo.save(orm);
  }

  async findById(id: string): Promise<Address | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? AddressMapper.toDomain(orm) : null;
  }

  async findByCustomerId(customerId: string): Promise<Address[]> {
    const orms = await this.repo.find({
      where: { customerId },
      order: { createdAt: 'ASC' },
    });
    return orms.map(AddressMapper.toDomain);
  }

  async remove(address: Address): Promise<void> {
    await this.repo.softDelete(address.id);
  }
}
