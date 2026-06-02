import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { FollowerRepository, FOLLOWER_REPOSITORY } from '../../../domain/repositories/follower.repository';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    @Inject(FOLLOWER_REPOSITORY)
    private readonly followerRepo: FollowerRepository,
  ) {}

  async execute(
    followerId: string,
    userRole: string,
    followedId: string,
  ): Promise<{ following: boolean }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los usuarios pueden dejar de seguir');
    }

    const result = await this.followerRepo.unfollow(followerId, followedId);
    return { following: !result };
  }
}
