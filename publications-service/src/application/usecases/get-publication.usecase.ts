import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { PublicationNotFoundError } from '../../domain/errors/domain.errors';
import { Publication } from '../../domain/entities/publication.entity';

@Injectable()
export class GetPublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(id: string): Promise<Publication> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new PublicationNotFoundError(id);
    }
    return publication;
  }
}