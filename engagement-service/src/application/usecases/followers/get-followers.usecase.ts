import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { FollowerRepository, FOLLOWER_REPOSITORY } from '../../../domain/repositories/follower.repository';

@Injectable()
export class GetFollowersUseCase {
  constructor(
    @Inject(FOLLOWER_REPOSITORY)
    private readonly followerRepo: FollowerRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    targetUserId: string,
  ): Promise<{ followers: { id: string; userId: string; createdAt: Date }[]; count: number }> {
    if (userRole !== 'CUSTOMER') {
      throw new ForbiddenException('Solo los usuarios pueden ver seguidores');
    }

    const followers = await this.followerRepo.getFollowers(targetUserId);
    const count = await this.followerRepo.countFollowers(targetUserId);

    return {
      followers: followers.map((f) => ({
        id: f.id,
        userId: f.followerId,
        createdAt: f.createdAt,
      })),
      count,
    };
  }
}
