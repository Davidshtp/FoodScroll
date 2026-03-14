import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ProxyService } from '../../infrastructure/http/proxy.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('location')
export class LocationProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // ───── Departamentos ─────

  @Get('department')
  async findAllDepartments(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'LOCATION',
      path: '/department',
    });
    return result.data;
  }

  // ───── Ciudades ─────

  @Get('city/by-department/:departmentId')
  async findCitiesByDepartment(
    @Param('departmentId') departmentId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'LOCATION',
      path: `/city/by-department/${departmentId}`,
    });
    return result.data;
  }

  @Get('city/:id')
  async findCityById(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'LOCATION',
      path: `/city/${id}`,
    });
    return result.data;
  }

  // ───── Geocodificación ─────

  @Get('geocode/reverse')
  async reverseGeocode(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'LOCATION',
      path: '/geocode/reverse',
      query: { latitude, longitude },
    });
    return result.data;
  }
}
