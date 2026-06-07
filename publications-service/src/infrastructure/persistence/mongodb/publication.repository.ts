import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicationRepositoryPort } from '../../../application/ports/publication.repository.port';
import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationDocument } from '../../../infrastructure/database/publication.schema';
import { PublicationNotFoundError } from '../../../domain/errors/domain.errors';

@Injectable()
export class PublicationMongoRepository implements PublicationRepositoryPort {
  constructor(
    @InjectModel(Publication.name) private publicationModel: Model<PublicationDocument>,
  ) {}

   private toDomain(document: PublicationDocument): Publication {
     let imageUrls = Array.isArray(document.imageUrls) ? document.imageUrls : [];
     const legacyImageUrl = (document as { imageUrl?: string }).imageUrl;
     if (imageUrls.length === 0 && legacyImageUrl) {
       imageUrls = [legacyImageUrl];
     }

     return Publication.restore(
       String(document._id),
       document.restaurantId,
       document.title,
       document.description,
       String(document.type),
       (document as any).price ?? null,
       imageUrls,
       document.publishedAt,
       document.deletedAt ? new Date(document.deletedAt) : null,
     );
   }

  private toPersistence(publication: Publication): any {
    return {
      _id: publication.getId(),
      restaurantId: publication.getRestaurantId(),
      title: publication.getTitle(),
      description: publication.getDescription(),
      type: publication.getType(),
      price: publication.getPrice(),
      imageUrls: publication.getImageUrls(),
      publishedAt: publication.getPublishedAt(),
      deletedAt: publication.getDeletedAt(),
    };
  }

  async create(publication: Publication): Promise<Publication> {
    const persistence = this.toPersistence(publication);
    const created = await this.publicationModel.create(persistence);
    return this.toDomain(created);
  }

  async findById(id: string): Promise<Publication | null> {
    const document = await this.publicationModel.findOne({ _id: id, deletedAt: null } as any).exec();
    if (!document) {
      return null;
    }
    return this.toDomain(document);
  }

  async update(publication: Publication): Promise<Publication> {
    const persistence = this.toPersistence(publication);
    const updated = await this.publicationModel.findOneAndUpdate(
      { _id: publication.getId() } as any,
      persistence,
      { new: true },
    ).exec();
    if (!updated) {
      throw new PublicationNotFoundError(publication.getId());
    }
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const result = await this.publicationModel.updateOne(
      { _id: id } as any,
      { deletedAt: new Date() },
    ).exec();
    if (result.matchedCount === 0) {
      throw new PublicationNotFoundError(id);
    }
  }

  async findByRestaurantId(restaurantId: string): Promise<Publication[]> {
    const documents = await this.publicationModel.find({ restaurantId, deletedAt: null } as any).exec();
    return documents.map(doc => this.toDomain(doc));
  }

  async findByRestaurantIds(restaurantIds: string[]): Promise<Publication[]> {
    if (restaurantIds.length === 0) return [];
    const documents = await this.publicationModel.find({ restaurantId: { $in: restaurantIds }, deletedAt: null } as any).exec();
    return documents.map(doc => this.toDomain(doc));
  }

  async findByIds(ids: string[]): Promise<Publication[]> {
    if (ids.length === 0) return [];
    const documents = await this.publicationModel.find({ _id: { $in: ids }, deletedAt: null } as any).exec();
    return documents.map(doc => this.toDomain(doc));
  }

  async findRecentActive(since: Date, limit: number, excludeRestaurantIds?: string[]): Promise<Publication[]> {
    const filter: any = {
      deletedAt: null,
      publishedAt: { $gte: since },
    };
    if (excludeRestaurantIds && excludeRestaurantIds.length > 0) {
      filter.restaurantId = { $nin: excludeRestaurantIds };
    }
    const documents = await this.publicationModel.find(filter)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .exec();
    return documents.map(doc => this.toDomain(doc));
  }
}
