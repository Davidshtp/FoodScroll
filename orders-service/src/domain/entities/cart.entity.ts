import { CartItem } from './cart-item.entity';

export interface CartProps {
  id: string;
  customerId: string;
  cartItems: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class Cart {
  readonly id: string;
  readonly customerId: string;
  readonly cartItems: CartItem[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: CartProps) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.cartItems = props.cartItems;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    customerId: string;
    cartItems?: CartItem[];
  }): Cart {
    return new Cart({
      ...props,
      cartItems: props.cartItems ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: CartProps): Cart {
    return new Cart(props);
  }

  addItem(item: CartItem): Cart {
    return new Cart({
      ...this,
      cartItems: [...this.cartItems, item],
      updatedAt: new Date(),
    });
  }

  removeItem(cartItemId: string): Cart {
    return new Cart({
      ...this,
      cartItems: this.cartItems.filter((item) => item.id !== cartItemId),
      updatedAt: new Date(),
    });
  }

  updateItem(cartItemId: string, quantity?: number, observation?: string | null): Cart {
    const updatedItems = this.cartItems.map((item) => {
      if (item.id !== cartItemId) return item;
      if (quantity !== undefined) item = item.updateQuantity(quantity);
      if (observation !== undefined) item = item.updateObservation(observation);
      return item;
    });
    return new Cart({
      ...this,
      cartItems: updatedItems,
      updatedAt: new Date(),
    });
  }

  clear(): Cart {
    return new Cart({
      ...this,
      cartItems: [],
      updatedAt: new Date(),
    });
  }

  findItemByPublicationId(publicationId: string): CartItem | undefined {
    return this.cartItems.find((item) => item.publicationId === publicationId);
  }

  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }
}
