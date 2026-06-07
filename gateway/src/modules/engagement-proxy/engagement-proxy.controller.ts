import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../../config/constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsActiveGuard } from '../../common/guards/is-active.guard';
import { ProxyService } from '../../infrastructure/http/proxy.service';
import { HttpClientService } from '../../infrastructure/http/http-client.service';

@Controller('engagement')
export class EngagementProxyController {
  constructor(
    private readonly proxy: ProxyService,
    private readonly httpClient: HttpClientService,
  ) {}

  // ── Likes (solo CUSTOMER) ──

  @Roles(Role.CUSTOMER)
  @UseGuards(IsActiveGuard)
  @Post('likes/toggle/:publicationId')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('publicationId') publicationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ENGAGEMENT',
      path: `/likes/toggle/${publicationId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER)
  @Get('likes/count/:publicationId')
  async getLikeCount(
    @Param('publicationId') publicationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/likes/count/${publicationId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER)
  @Get('likes/check/:publicationId')
  async hasUserLiked(
    @Param('publicationId') publicationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/likes/check/${publicationId}`,
    });
    return result.data;
  }

  // ── Followers (POST/DELETE solo CUSTOMER; GET CUSTOMER + RESTAURANT) ──

  @Roles(Role.CUSTOMER)
  @UseGuards(IsActiveGuard)
  @Post('followers/:userId')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const targetUser = await this.httpClient.forward<{ id: string; role: string; email?: string }>({
      method: 'GET',
      service: 'IDENTITY',
      path: `/users/${userId}`,
    });

    if (targetUser.data.role === Role.DELIVERY) {
      throw new ForbiddenException('No puedes seguir a un usuario de tipo DELIVERY');
    }

    let displayName = targetUser.data.email || userId;

    if (targetUser.data.role === Role.RESTAURANT) {
      try {
        const restaurantInfo = await this.httpClient.forward<{ restaurants: { id: string; name: string }[] }>({
          method: 'GET',
          service: 'RESTAURANT',
          path: `/restaurant/internal/by-user-ids?ids=${userId}`,
        });
        if (restaurantInfo.data.restaurants?.length > 0) {
          displayName = restaurantInfo.data.restaurants[0].name;
        }
      } catch {
        // fallback al email si falla la consulta del restaurante
      }
    }

    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ENGAGEMENT',
      path: `/followers/${userId}`,
    });

    return {
      following: result.data.following,
      message: result.data.following
        ? `Felicidades, ahora sigues a ${displayName}`
        : `Ya sigues a ${displayName}`,
    };
  }

  @Roles(Role.CUSTOMER)
  @UseGuards(IsActiveGuard)
  @Delete('followers/:userId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'ENGAGEMENT',
      path: `/followers/${userId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/followers/${userId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('followers/:userId/count')
  async getFollowersCount(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/followers/${userId}/count`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/followers/following/${userId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('following/:userId/count')
  async getFollowingCount(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/followers/following/${userId}/count`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('mutual/:userId')
  async getMutualFollowers(
    @Param('userId') userId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/followers/mutual/${userId}`,
    });
    return result.data;
  }

  // ── Comments (CUSTOMER + RESTAURANT) ──

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @UseGuards(IsActiveGuard)
  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Body() body: any,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'POST',
      service: 'ENGAGEMENT',
      path: '/comments',
      body,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('comments/:publicationId')
  async getComments(
    @Param('publicationId') publicationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/comments/${publicationId}`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @Get('comments/:publicationId/count')
  async getCommentCount(
    @Param('publicationId') publicationId: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'GET',
      service: 'ENGAGEMENT',
      path: `/comments/${publicationId}/count`,
    });
    return result.data;
  }

  @Roles(Role.CUSTOMER, Role.RESTAURANT)
  @UseGuards(IsActiveGuard)
  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @Param('id') id: string,
    @Req() req: Request,
    @CurrentUser() user: any,
  ) {
    const result = await this.proxy.forwardAuthenticated(req, user, {
      method: 'DELETE',
      service: 'ENGAGEMENT',
      path: `/comments/${id}`,
    });
    return result.data;
  }
}
