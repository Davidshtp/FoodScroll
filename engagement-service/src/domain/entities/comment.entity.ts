import { v4 as uuidv4 } from 'uuid';

export interface CommentProps {
  id: string;
  userId: string;
  userRole: string;
  publicationId: string;
  text: string;
  parentId?: string;
  createdAt: Date;
  deletedAt: Date | null;
}

export class Comment {
  private constructor(private props: CommentProps) {}

  static create(userId: string, userRole: string, publicationId: string, text: string, parentId?: string): Comment {
    return new Comment({
      id: uuidv4(),
      userId,
      userRole,
      publicationId,
      text,
      parentId,
      createdAt: new Date(),
      deletedAt: null,
    });
  }

  static reconstitute(props: CommentProps): Comment {
    return new Comment(props);
  }

  softDelete(): void {
    this.props.deletedAt = new Date();
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get userRole() { return this.props.userRole; }
  get publicationId() { return this.props.publicationId; }
  get text() { return this.props.text; }
  get parentId() { return this.props.parentId; }
  get createdAt() { return this.props.createdAt; }
  get deletedAt() { return this.props.deletedAt; }
}
