import { Controller, Get, Post, Patch, Body, Headers } from '@nestjs/common';
import { CreateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/create-customer-profile.usecase';
import { GetCustomerProfileUseCase } from '../../../application/usecases/customer-profile/get-customer-profile.usecase';
import { UpdateCustomerProfileUseCase } from '../../../application/usecases/customer-profile/update-customer-profile.usecase';
import { CreateCustomerProfileDto } from '../dtos/customer-profile.dto';
import { UpdateCustomerProfileDto } from '../dtos/customer-profile.dto';
import { UserId } from '../decorators/user-id.decorator';

@Controller('customer-profile')
export class CustomerProfileController {
  constructor(
    private readonly createProfileUseCase: CreateCustomerProfileUseCase,
    private readonly getProfileUseCase: GetCustomerProfileUseCase,
    private readonly updateProfileUseCase: UpdateCustomerProfileUseCase,
  ) {}

  @Post()
  async create(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: CreateCustomerProfileDto,
  ) {
    const accessToken = authorization?.replace('Bearer ', '');
    const result = await this.createProfileUseCase.execute({
      userId,
      ...dto,
      accessToken,
    });
    return result.profile;
  }

  @Get()
  async findMe(@UserId() userId: string) {
    const result = await this.getProfileUseCase.execute({ userId });
    return {
      ...result.profile,
      addresses: result.addresses,
    };
  }

  @Patch()
  async update(
    @UserId() userId: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const result = await this.updateProfileUseCase.execute({
      userId,
      ...dto,
    });
    return result.profile;
  }
}
