import { v4 as uuidv4 } from 'uuid';
import { PublicationType } from '../value-objects/publication-type.value-object';
import { InvalidPublicationDataError } from '../errors/domain.errors';

export interface PublicationProps {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: PublicationType;
  imageUrls: string[];
  publishedAt: Date;
  deletedAt: Date | null;
}

export class Publication {
  private id: string;
  private restaurantId: string;
  private title: string;
  private description: string;
  private type: PublicationType;
  private imageUrls: string[];
  private publishedAt: Date;
  private deletedAt: Date | null;

  constructor(props: PublicationProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.title = props.title;
    this.description = props.description;
    this.type = props.type;
    this.imageUrls = props.imageUrls;
    this.publishedAt = props.publishedAt;
    this.deletedAt = props.deletedAt;
  }

  static create(
    restaurantId: string,
    title: string,
    description: string,
    type: PublicationType,
    imageUrls: string[],
  ): Publication {
    // Validate inputs
    if (!restaurantId || restaurantId.trim() === '') {
      throw new InvalidPublicationDataError('Restaurant ID is required');
    }

    if (!title || title.trim() === '') {
      throw new InvalidPublicationDataError('Title is required');
    }

    if (title.length > 200) {
      throw new InvalidPublicationDataError('Title must be 200 characters or less');
    }

    if (!description || description.trim() === '') {
      throw new InvalidPublicationDataError('Description is required');
    }

    if (description.length > 2000) {
      throw new InvalidPublicationDataError('Description must be 2000 characters or less');
    }

    Publication.validateImages(imageUrls);

    return new Publication({
      id: uuidv4(),
      restaurantId,
      title: title.trim(),
      description: description.trim(),
      type,
      imageUrls,
      publishedAt: new Date(),
      deletedAt: null,
    });
  }

  static restore(
    id: string,
    restaurantId: string,
    title: string,
    description: string,
    type: PublicationType,
    imageUrls: string[],
    publishedAt: Date,
    deletedAt: Date | null = null,
  ): Publication {
    return new Publication({ id, restaurantId, title, description, type, imageUrls, publishedAt, deletedAt });
  }

  getId(): string {
    return this.id;
  }

  getRestaurantId(): string {
    return this.restaurantId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getType(): PublicationType {
    return this.type;
  }

  getImageUrls(): string[] {
    return this.imageUrls;
  }

  getPublishedAt(): Date {
    return this.publishedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  update(
    title: string,
    description: string,
    type: PublicationType,
    imageUrls: string[] | undefined,
  ): Publication {
    if (!title || title.trim() === '') {
      throw new InvalidPublicationDataError('Title is required');
    }

    if (title.length > 200) {
      throw new InvalidPublicationDataError('Title must be 200 characters or less');
    }

    if (!description || description.trim() === '') {
      throw new InvalidPublicationDataError('Description is required');
    }

    if (description.length > 2000) {
      throw new InvalidPublicationDataError('Description must be 2000 characters or less');
    }

    const nextImageUrls = imageUrls ?? this.imageUrls;
    Publication.validateImages(nextImageUrls);

    this.title = title.trim();
    this.description = description.trim();
    this.type = type;
    this.imageUrls = nextImageUrls;

    return this;
  }

  private static validateImages(imageUrls: string[]): void {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new InvalidPublicationDataError('At least 1 image is required');
    }

    if (imageUrls.length > 10) {
      throw new InvalidPublicationDataError('Maximum 10 images are allowed');
    }

    const hasInvalid = imageUrls.some(url => !url || url.trim() === '');
    if (hasInvalid) {
      throw new InvalidPublicationDataError('Image URLs must be non-empty strings');
    }
  }

  softDelete(): void {
    this.deletedAt = new Date();
  }

  restoreFromDelete(): void {
    this.deletedAt = null;
  }
}
