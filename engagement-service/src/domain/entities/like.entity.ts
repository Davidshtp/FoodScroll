export interface LikeProps {
  id: string;
  userId: string;
  publicationId: string;
  createdAt: Date;
}

export class Like {
  private constructor(private props: LikeProps) {}

  static create(userId: string, publicationId: string): Like {
    return new Like({
      id: `${userId}:${publicationId}`,
      userId,
      publicationId,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: LikeProps): Like {
    return new Like(props);
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get publicationId() { return this.props.publicationId; }
  get createdAt() { return this.props.createdAt; }
}
