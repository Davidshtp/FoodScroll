import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard, ServiceSecretGuard } from '../guards';
import { UserId } from '../decorators/user-id.decorator';
import { GetFeedUseCase } from '../../../application/usecases/get-feed.usecase';

@Controller('feed')
@UseGuards(JwtAuthGuard, ServiceSecretGuard)
export class FeedController {
  constructor(
    private readonly getFeedUseCase: GetFeedUseCase,
  ) {}

  @Get()
  async getFeed(
    @UserId() userId: string,
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;

    const result = await this.getFeedUseCase.execute({
      userId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      latitude: lat,
      longitude: lng,
    });

    // Get customer's address for nearby automatic detection if no lat/lng provided
    if (lat === undefined && lng === undefined) {
      // Fall back to feed without nearby
    }

    return result;
  }
}
