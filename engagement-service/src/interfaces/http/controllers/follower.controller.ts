import { Controller, Post, Delete, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CurrentUser } from '../decorators/current-user.decorator';
import { FollowUserUseCase } from '../../../application/usecases/followers/follow-user.usecase';
import { UnfollowUserUseCase } from '../../../application/usecases/followers/unfollow-user.usecase';
import { GetFollowersUseCase } from '../../../application/usecases/followers/get-followers.usecase';
import { GetFollowingUseCase } from '../../../application/usecases/followers/get-following.usecase';
import { GetMutualFollowersUseCase } from '../../../application/usecases/followers/get-mutual-followers.usecase';

@Controller('followers')
export class FollowerController {
  constructor(
    private readonly followUserUseCase: FollowUserUseCase,
    private readonly unfollowUserUseCase: UnfollowUserUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getFollowingUseCase: GetFollowingUseCase,
    private readonly getMutualFollowersUseCase: GetMutualFollowersUseCase,
  ) {}

  @Post(':userId')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.followUserUseCase.execute(user.id, user.role, user.appStatus, userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.unfollowUserUseCase.execute(user.id, user.role, userId);
  }

  @Get(':userId')
  async getFollowers(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.getFollowersUseCase.execute(user.id, user.role, userId);
  }

  @Get(':userId/count')
  async getFollowersCount(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    const result = await this.getFollowersUseCase.execute(user.id, user.role, userId);
    return { count: result.count };
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.getFollowingUseCase.execute(user.id, user.role, userId);
  }

  @Get('following/:userId/count')
  async getFollowingCount(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    const result = await this.getFollowingUseCase.execute(user.id, user.role, userId);
    return { count: result.count };
  }

  @Get('mutual/:userId')
  async getMutualFollowers(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string; role: string; appStatus: string },
  ) {
    return this.getMutualFollowersUseCase.execute(user.id, user.role, userId);
  }
}
