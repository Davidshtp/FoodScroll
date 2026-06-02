import { Comment } from '../entities/comment.entity';

export interface CommentRepository {
  save(comment: Comment): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByPublicationId(publicationId: string): Promise<Comment[]>;
  findByParentId(parentId: string): Promise<Comment[]>;
  delete(id: string): Promise<void>;
  countByPublication(publicationId: string): Promise<number>;
}

export const COMMENT_REPOSITORY = 'COMMENT_REPOSITORY';
