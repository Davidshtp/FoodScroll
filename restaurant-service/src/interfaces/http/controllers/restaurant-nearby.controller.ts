import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ServiceSecretGuard } from '../guards/service-secret.guard';
import { GetNearbyRestaurantsUseCase } from '../../../application/usecases/restaurant/get-nearby-restaurants.usecase';

@Controller('restaurant/nearby')
@UseGuards(ServiceSecretGuard)
export class RestaurantNearbyController {
  constructor(
    private readonly getNearbyRestaurantsUseCase: GetNearbyRestaurantsUseCase,
  ) {}

  @Get()
  async findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ): Promise<{ restaurants: any[] }> {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = radius ? parseFloat(radius) : 10;

    if (isNaN(lat) || isNaN(lng)) {
      return { restaurants: [] };
    }

    const restaurants = await this.getNearbyRestaurantsUseCase.execute(
      lat,
      lng,
      rad,
    );

    return { restaurants };
  }
}
