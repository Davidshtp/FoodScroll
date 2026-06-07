import { Controller, Post, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ToggleLikeUseCase } from '../../../application/usecases/likes/toggle-like.usecase';
import { GetLikeCountUseCase } from '../../../application/usecases/likes/get-like-count.usecase';
import { HasUserLikedUseCase } from '../../../application/usecases/likes/has-user-liked.usecase';
import { GetUserLikedPublicationsUseCase } from '../../../application/usecases/likes/get-user-liked-publications.usecase';

@Controller('likes')
export class LikeController {
  constructor(
    private readonly toggleLikeUseCase: ToggleLikeUseCase,
    private readonly getLikeCountUseCase: GetLikeCountUseCase,
    private readonly hasUserLikedUseCase: HasUserLikedUseCase,
    private readonly getUserLikedPublicationsUseCase: GetUserLikedPublicationsUseCase,
  ) {}

  @Post('toggle/:publicationId')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.toggleLikeUseCase.execute(
      user.id,
      user.role,
      user.appStatus,
      publicationId,
    );
  }

  @Get('count/:publicationId')
  async getLikeCount(@Param('publicationId') publicationId: string) {
    return this.getLikeCountUseCase.execute(publicationId);
  }

  @Get('check/:publicationId')
  async hasUserLiked(
    @Param('publicationId') publicationId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.hasUserLikedUseCase.execute(user.id, user.role, publicationId);
  }

  @Get('user/:userId/publications')
  async getUserLikedPublications(
    @Param('userId') userId: string,
  ) {
    const publicationIds = await this.getUserLikedPublicationsUseCase.execute(userId);
    return { publicationIds };
  }
}
