import { Publication } from '../../domain/entities/publication.entity';

export abstract class PublicationRepositoryPort {
  abstract create(publication: Publication): Promise<Publication>;
  abstract findById(id: string): Promise<Publication | null>;
  abstract update(publication: Publication): Promise<Publication>;
  abstract delete(id: string): Promise<void>;
  abstract findByRestaurantId(restaurantId: string): Promise<Publication[]>;
  abstract findByRestaurantIds(restaurantIds: string[]): Promise<Publication[]>;
  abstract findByIds(ids: string[]): Promise<Publication[]>;
  abstract findRecentActive(since: Date, limit: number, excludeRestaurantIds?: string[]): Promise<Publication[]>;
}
