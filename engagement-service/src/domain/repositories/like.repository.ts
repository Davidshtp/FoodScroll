import { Like } from '../entities/like.entity';

export interface LikeRepository {
  toggleLike(userId: string, publicationId: string): Promise<boolean>;
  getLikeCount(publicationId: string): Promise<number>;
  hasUserLiked(userId: string, publicationId: string): Promise<boolean>;
}

export const LIKE_REPOSITORY = 'LIKE_REPOSITORY';
