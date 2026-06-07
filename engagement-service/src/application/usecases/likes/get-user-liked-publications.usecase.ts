import { Inject, Injectable } from '@nestjs/common';
import {
  LikeRepository,
  LIKE_REPOSITORY,
} from '../../../domain/repositories/like.repository';

@Injectable()
export class GetUserLikedPublicationsUseCase {
  constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly likeRepository: LikeRepository,
  ) {}

  async execute(userId: string): Promise<string[]> {
    return this.likeRepository.getUserLikedPublications(userId);
  }
}
