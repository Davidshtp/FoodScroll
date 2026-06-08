import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CommentRepository, COMMENT_REPOSITORY } from '../../../domain/repositories/comment.repository';
import { Comment } from '../../../domain/entities/comment.entity';
import { CustomerInfoPort, CUSTOMER_INFO_PORT } from '../../ports/customer-info.port';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../ports/restaurant-info.port';

export interface EnrichedComment {
  id: string;
  userId: string;
  userRole: string;
  publicationId: string;
  text: string;
  parentId: string | null;
  createdAt: Date;
  userName: string;
  userAvatarUrl: string | null;
}

@Injectable()
export class GetCommentsUseCase {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepo: CommentRepository,
    @Inject(CUSTOMER_INFO_PORT)
    private readonly customerInfoPort: CustomerInfoPort,
    @Inject(RESTAURANT_INFO_PORT)
    private readonly restaurantInfoPort: RestaurantInfoPort,
  ) {}

  async execute(
    userId: string,
    userRole: string,
    publicationId: string,
  ): Promise<EnrichedComment[]> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('No tienes permiso para ver comentarios');
    }

    const comments = await this.commentRepo.findByPublicationId(publicationId);

    const enriched = await Promise.all(
      comments.map(async (comment) => {
        let userName = comment.userId.split('-')[0] || comment.userId;
        let userAvatarUrl: string | null = null;

        try {
          if (comment.userRole === 'CUSTOMER') {
            const info = await this.customerInfoPort.getCustomerInfo(comment.userId);
            userName = `${info.firstName} ${info.lastName}`.trim() || comment.userId;
            userAvatarUrl = info.avatarUrl;
          } else if (comment.userRole === 'RESTAURANT') {
            const info = await this.restaurantInfoPort.getRestaurantInfoByUserId(comment.userId);
            userName = info.name || comment.userId;
            userAvatarUrl = info.logoUrl || null;
          }
        } catch {
          userName = comment.userRole === 'CUSTOMER' ? 'Cliente' : 'Restaurante';
        }

        return {
          id: comment.id,
          userId: comment.userId,
          userRole: comment.userRole,
          publicationId: comment.publicationId,
          text: comment.text,
          parentId: comment.parentId ?? null,
          createdAt: comment.createdAt,
          userName,
          userAvatarUrl,
        };
      }),
    );

    return enriched;
  }

  async countByPublication(
    userId: string,
    userRole: string,
    publicationId: string,
  ): Promise<number> {
    if (userRole !== 'CUSTOMER' && userRole !== 'RESTAURANT') {
      throw new ForbiddenException('No tienes permiso para ver comentarios');
    }

    return this.commentRepo.countByPublication(publicationId);
  }
}
