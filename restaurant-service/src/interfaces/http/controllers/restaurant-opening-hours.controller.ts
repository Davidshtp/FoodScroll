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
  UpsertRestaurantOpeningHoursUseCase,
  GetRestaurantOpeningHoursUseCase,
  OpeningHourItem,
} from '../../../application/usecases/restaurant';
import { UpsertOpeningHoursDto } from '../dtos';
import { UserId } from '../decorators/user-id.decorator';

@Controller('restaurant/opening-hours')
@UseGuards(JwtAuthGuard)
export class RestaurantOpeningHoursController {
  constructor(
    private readonly upsertOpeningHoursUseCase: UpsertRestaurantOpeningHoursUseCase,
    private readonly getRestaurantOpeningHoursUseCase: GetRestaurantOpeningHoursUseCase,
  ) {}

  @Get()
  async find(@UserId() userId: string) {
    return this.getRestaurantOpeningHoursUseCase.execute({ userId });
  }

  @Put()
  @HttpCode(200)
  async upsert(
    @UserId() userId: string,
    @Headers('authorization') authorization: string,
    @Body() dto: UpsertOpeningHoursDto,
  ) {
    const hours: OpeningHourItem[] = dto.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      openTime: h.openTime ?? null,
      closeTime: h.closeTime ?? null,
      isClosed: h.isClosed ?? false,
    }));
    const result = await this.upsertOpeningHoursUseCase.execute({
      userId,
      hours,
      authorization,
    });
    return {
      hours: result.hours,
      access_token: result.access_token,
    };
  }
}
