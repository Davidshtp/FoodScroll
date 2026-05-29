import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  UpdateRestaurantAddressUseCase,
  GetRestaurantAddressUseCase,
} from '../../../application/usecases/restaurant';
import { UpdateRestaurantAddressDto } from '../dtos';
import { UserId } from '../decorators/user-id.decorator';

@Controller('restaurant/address')
@UseGuards(JwtAuthGuard)
export class RestaurantAddressController {
  constructor(
    private readonly updateRestaurantAddressUseCase: UpdateRestaurantAddressUseCase,
    private readonly getRestaurantAddressUseCase: GetRestaurantAddressUseCase,
  ) {}

  @Get()
  async find(@UserId() userId: string) {
    return this.getRestaurantAddressUseCase.execute({ userId });
  }

  @Put()
  @HttpCode(200)
  async upsert(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: UpdateRestaurantAddressDto,
  ) {
    const result = await this.updateRestaurantAddressUseCase.execute({
      userId,
      address: dto.address,
      cityId: dto.cityId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      authorization,
    });
    return {
      ...result.address,
      access_token: result.access_token,
    };
  }
}
