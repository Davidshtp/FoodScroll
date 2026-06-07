import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { FollowerRepository, FOLLOWER_REPOSITORY } from '../../../domain/repositories/follower.repository';

@Injectable()
export class GetMutualFollowersUseCase {
  constructor(
    @Inject(FOLLOWER_REPOSITORY)
    private readonly followerRepo: FollowerRepository,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    otherUserId: string,
  ): Promise<{ mutual: { id: string; userId: string }[] }> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('Solo customers y restaurantes pueden ver seguidores en común');
    }

    const mutual = await this.followerRepo.getMutualFollowers(userId, otherUserId);

    return {
      mutual: mutual.map((f) => ({
        id: f.id,
        userId: f.followerId,
      })),
    };
  }
}
