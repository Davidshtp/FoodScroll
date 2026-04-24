import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { CreateAddressUseCase } from '../../../application/usecases/address/create-address.usecase';
import { GetAddressesUseCase } from '../../../application/usecases/address/get-addresses.usecase';
import { UpdateAddressUseCase } from '../../../application/usecases/address/update-address.usecase';
import { DeleteAddressUseCase } from '../../../application/usecases/address/delete-address.usecase';
import { CreateAddressDto, UpdateAddressDto } from '../dtos/address.dto';
import { UserId } from '../decorators/user-id.decorator';

@Controller('address')
export class AddressController {
  constructor(
    private readonly createAddressUseCase: CreateAddressUseCase,
    private readonly getAddressesUseCase: GetAddressesUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
  ) {}

@Post()
  async create(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateAddressDto,
  ) {
    const result = await this.createAddressUseCase.execute({
      customerId: userId,
      ...dto,
      authorization,
    });
    const response: any = { ...result.address };
    if (result.access_token) {
      response.access_token = result.access_token;
    }
    return response;
  }

  @Get()
  async findMyAddresses(@UserId() userId: string) {
    const result = await this.getAddressesUseCase.execute({ customerId: userId });
    return result.addresses;
  }

  @Patch(':addressId')
  async update(
    @UserId() userId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const result = await this.updateAddressUseCase.execute({
      addressId,
      customerId: userId,
      ...dto,
    });
    return result.address;
  }

@Delete(':addressId')
  async remove(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Param('addressId') addressId: string,
  ) {
    const result = await this.deleteAddressUseCase.execute({
      addressId,
      customerId: userId,
      authorization,
    });
    const response: any = { ...result.deletedAddress };
    if (result.access_token) {
      response.access_token = result.access_token;
    }
    return response;
  }
}
