import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { Publication } from '../../domain/entities/publication.entity';

@Injectable()
export class CreatePublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(
    restaurantId: string,
    title: string,
    description: string,
    type: string,
    price: number,
    imageUrls: string[],
  ): Promise<Publication> {
    const publication = Publication.create(
      restaurantId,
      title,
      description,
      type,
      price,
      imageUrls,
    );

    return await this.publicationRepository.create(publication);
  }
}
