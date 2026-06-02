import { Injectable, Inject } from '@nestjs/common';
import { LikeRepository, LIKE_REPOSITORY } from '../../../domain/repositories/like.repository';

@Injectable()
export class GetLikeCountUseCase {
  constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly likeRepo: LikeRepository,
  ) {}

  async execute(publicationId: string): Promise<{ count: number }> {
    const count = await this.likeRepo.getLikeCount(publicationId);
    return { count };
  }
}
