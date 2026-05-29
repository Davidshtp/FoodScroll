import { Controller, Get, Post, Patch, Put, Delete, Body, Req, } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';

@Roles(Role.RESTAURANT)
@Controller('restaurant')
export class RestaurantProxyController {
  constructor(private readonly proxy: ProxyService) { }

  @Post('profile')
  async createProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'RESTAURANT',
      path: '/restaurant',
      body,
    });
    return result.data;
  }

  @Get('profile')
  async getProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'RESTAURANT',
      path: '/restaurant',
    });
    return result.data;
  }

  @Patch('profile')
  async updateProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'RESTAURANT',
      path: '/restaurant',
      body,
    });
    return result.data;
  }

  @Delete('profile')
  async deleteProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'RESTAURANT',
      path: '/restaurant',
    });
    return result.data;
  }

  @Put('address')
  async upsertAddress(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PUT',
      service: 'RESTAURANT',
      path: '/restaurant/address',
      body,
    });
    return result.data;
  }

  @Get('address')
  async getAddress(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'RESTAURANT',
      path: '/restaurant/address',
    });
    return result.data;
  }

  @Put('opening-hours')
  async upsertOpeningHours(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PUT',
      service: 'RESTAURANT',
      path: '/restaurant/opening-hours',
      body,
    });
    return result.data;
  }

  @Get('opening-hours')
  async getOpeningHours(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'RESTAURANT',
      path: '/restaurant/opening-hours',
    });
    return result.data;
  }
}
