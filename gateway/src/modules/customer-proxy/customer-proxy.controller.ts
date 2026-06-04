import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProxyService } from '../../infrastructure/http/proxy.service';
import FormData from 'form-data';

/**
 * Proxy de clientes.
 * Reenvía las peticiones al customer service.
 * Requiere JWT y rol CUSTOMER.
 */
@Roles(Role.CUSTOMER)
@Controller('customer')
export class CustomerProxyController {
  constructor(private readonly proxy: ProxyService) {}

  // ───── Perfil ─────

  @Post('profile')
  async createProfile(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'CUSTOMER',
      path: '/customer-profile',
      body,
    });
    return result.data;
  }

  @Get('profile')
  async getProfile(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'CUSTOMER',
      path: '/customer-profile',
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
      service: 'CUSTOMER',
      path: '/customer-profile',
      body,
    });
    return result.data;
  }

  // ───── Avatar ─────

  @Patch('profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'CUSTOMER',
      path: '/customer-profile/avatar',
      body: formData,
      isMultipart: true,
    });
    return result.data;
  }

  @Delete('profile/avatar')
  async deleteAvatar(
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'CUSTOMER',
      path: '/customer-profile/avatar',
    });
    return result.data;
  }

  // ───── Direcciones ─────

  @Post('address')
  async createAddress(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'CUSTOMER',
      path: '/address',
      body,
    });
    return result.data;
  }

  @Get('address')
  async getAddresses(@Req() req: Request, @CurrentUser() user: any) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'CUSTOMER',
      path: '/address',
    });
    return result.data;
  }

  @Patch('address/:addressId')
  async updateAddress(
    @Param('addressId') addressId: string,
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'PATCH',
      service: 'CUSTOMER',
      path: `/address/${addressId}`,
      body,
    });
    return result.data;
  }

  @Delete('address/:addressId')
  async removeAddress(
    @Param('addressId') addressId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'CUSTOMER',
      path: `/address/${addressId}`,
    });
    return result.data;
  }
}
