import { Publication } from '../../domain/entities/publication.entity';

export abstract class PublicationRepositoryPort {
  abstract create(publication: Publication): Promise<Publication>;
  abstract findById(id: string): Promise<Publication | null>;
  abstract update(publication: Publication): Promise<Publication>;
  abstract delete(id: string): Promise<void>;
  abstract findByRestaurantId(restaurantId: string): Promise<Publication[]>;
}
