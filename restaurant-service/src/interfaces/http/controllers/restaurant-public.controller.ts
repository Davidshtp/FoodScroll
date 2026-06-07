import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { GetPublicRestaurantProfileUseCase } from '../../../application/usecases/restaurant';

@Controller('restaurant/public')
export class RestaurantPublicController {
  constructor(
    private readonly getPublicRestaurantProfileUseCase: GetPublicRestaurantProfileUseCase,
  ) {}

  @Get(':restaurantId')
  async getProfile(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.getPublicRestaurantProfileUseCase.execute(restaurantId);
  }
}
