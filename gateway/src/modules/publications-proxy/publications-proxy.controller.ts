import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';

@Roles(Role.CUSTOMER)
@Controller('publications')
export class PublicationsProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Get('feed')
  async getFeed(
    @Req() req: Request,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    const query: Record<string, string> = {};
    if (page) query.page = page;
    if (limit) query.limit = limit;
    if (latitude) query.latitude = latitude;
    if (longitude) query.longitude = longitude;

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'PUBLICATIONS',
      path: '/feed',
      query,
    });
    return result.data;
  }
}
