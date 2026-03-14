import { Inject, Injectable } from '@nestjs/common';
import { Address } from '../../../domain/entities/address.entity';
import { AddressRepository, ADDRESS_REPOSITORY } from '../../../domain/repositories/address.repository';
import { AddressNotFoundError, AddressOwnershipError } from '../../../domain/errors/domain.errors';

export interface UpdateAddressInput {
  addressId: string;
  customerId: string;
  alias?: string;
  neighborhood?: string;
  details?: string;
}

export interface UpdateAddressOutput {
  address: Address;
}

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepo: AddressRepository,
  ) { }

  async execute(input: UpdateAddressInput): Promise<UpdateAddressOutput> {
    const address = await this.addressRepo.findById(input.addressId);
    if (!address) {
      throw new AddressNotFoundError(input.addressId);
    }

    if (address.customerId !== input.customerId) {
      throw new AddressOwnershipError();
    }

    const updated = address.update({
      alias: input.alias,
      neighborhood: input.neighborhood,
      details: input.details !== undefined ? input.details : undefined,
    });

    await this.addressRepo.save(updated);

    return { address: updated };
  }
}
