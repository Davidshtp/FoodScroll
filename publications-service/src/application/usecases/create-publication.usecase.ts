import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { Publication } from '../../domain/entities/publication.entity';
import { PublicationType } from '../../domain/value-objects/publication-type.value-object';

@Injectable()
export class CreatePublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(
    restaurantId: string,
    title: string,
    description: string,
    type: string,
    imageUrls: string[],
  ): Promise<Publication> {
    const publicationType = PublicationType.fromString(type);

    const publication = Publication.create(
      restaurantId,
      title,
      description,
      publicationType,
      imageUrls,
    );

    return await this.publicationRepository.create(publication);
  }
}
