import { Controller, Get, Query } from '@nestjs/common';
import { ReverseGeocodeUseCase } from '../../../application/usecases/geocode/reverse-geocode.usecase';
import { ReverseGeocodeDto } from '../dto/reverse-geocode.dto';

@Controller('geocode')
export class GeocodeController {
  constructor(
    private readonly reverseGeocodeUseCase: ReverseGeocodeUseCase,
  ) {}

  @Get('reverse')
  async reverse(@Query() dto: ReverseGeocodeDto) {
    return this.reverseGeocodeUseCase.execute({
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }
}
