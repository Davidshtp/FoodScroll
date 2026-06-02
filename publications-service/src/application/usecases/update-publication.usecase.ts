import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { PublicationNotFoundError } from '../../domain/errors/domain.errors';
import { Publication } from '../../domain/entities/publication.entity';

@Injectable()
export class UpdatePublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(
    id: string,
    title: string | undefined,
    description: string | undefined,
    type: string | undefined,
    price: number | undefined,
    imageUrls: string[] | undefined,
  ): Promise<Publication> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new PublicationNotFoundError(id);
    }

    const updatedPublication = publication.update(
      title ?? publication.getTitle(),
      description ?? publication.getDescription(),
      type ?? publication.getType(),
      price,
      imageUrls,
    );

    return await this.publicationRepository.update(updatedPublication);
  }
}
