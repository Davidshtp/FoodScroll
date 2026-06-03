import { InvalidQuantityError } from '../errors/domain.errors';

export interface CartItemProps {
  id: string;
  publicationId: string;
  quantity: number;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CartItem {
  readonly id: string;
  readonly publicationId: string;
  readonly quantity: number;
  readonly observation: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: CartItemProps) {
    this.id = props.id;
    this.publicationId = props.publicationId;
    this.quantity = props.quantity;
    this.observation = props.observation;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    publicationId: string;
    quantity?: number;
    observation?: string | null;
  }): CartItem {
    const quantity = props.quantity ?? 1;
    if (quantity < 1) {
      throw new InvalidQuantityError(quantity);
    }
    return new CartItem({
      id: props.id,
      publicationId: props.publicationId,
      quantity,
      observation: props.observation ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: CartItemProps): CartItem {
    return new CartItem(props);
  }

  updateQuantity(quantity: number): CartItem {
    if (quantity < 1) {
      throw new InvalidQuantityError(quantity);
    }
    return new CartItem({
      ...this,
      quantity,
      updatedAt: new Date(),
    });
  }

  updateObservation(observation: string | null): CartItem {
    return new CartItem({
      ...this,
      observation,
      updatedAt: new Date(),
    });
  }
}
