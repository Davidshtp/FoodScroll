import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { Publication } from '../../domain/entities/publication.entity';

@Injectable()
export class GetPublicationsByRestaurantUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(restaurantId: string): Promise<Publication[]> {
    return await this.publicationRepository.findByRestaurantId(restaurantId);
  }
}
