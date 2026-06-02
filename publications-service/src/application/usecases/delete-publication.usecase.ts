import { Inject, Injectable } from '@nestjs/common';
import { PublicationRepositoryPort } from '../ports/publication.repository.port';
import { PUBLICATION_REPOSITORY } from '../../domain/repositories';
import { PublicationNotFoundError } from '../../domain/errors/domain.errors';

@Injectable()
export class DeletePublicationUseCase {
  constructor(@Inject(PUBLICATION_REPOSITORY) private readonly publicationRepository: PublicationRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const publication = await this.publicationRepository.findById(id);
    if (!publication) {
      throw new PublicationNotFoundError(id);
    }
    await this.publicationRepository.delete(id);
  }
}
