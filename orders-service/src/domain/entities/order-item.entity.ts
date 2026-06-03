export interface OrderItemProps {
  id: string;
  publicationId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class OrderItem {
  readonly id: string;
  readonly publicationId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly observation: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: OrderItemProps) {
    this.id = props.id;
    this.publicationId = props.publicationId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.totalPrice = props.totalPrice;
    this.observation = props.observation;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  static create(props: {
    id: string;
    publicationId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    observation?: string | null;
  }): OrderItem {
    const totalPrice = props.unitPrice * props.quantity;
    return new OrderItem({
      ...props,
      totalPrice,
      observation: props.observation ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }
}