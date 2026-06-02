import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { PublicationNotFoundError } from '../../domain/errors/domain.errors';
import { Publication } from '../../domain/entities/publication.entity';
import { PublicationType } from '../../domain/value-objects/publication-type.value-object';

@Injectable()
export class UpdatePublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(
    id: string,
    title: string | undefined,
    description: string | undefined,
    type: string | undefined,
    imageUrls: string[] | undefined,
  ): Promise<Publication> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new PublicationNotFoundError(id);
    }

    let publicationType: PublicationType | undefined;
    if (type !== undefined) {
      publicationType = PublicationType.fromString(type);
    }

    const updatedPublication = publication.update(
      title ?? publication.getTitle(),
      description ?? publication.getDescription(),
      publicationType ?? publication.getType(),
      imageUrls,
    );

    return await this.publicationRepository.update(updatedPublication);
  }
}
