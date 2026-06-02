export interface FollowerProps {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

export class Follower {
  private constructor(private props: FollowerProps) {}

  static create(followerId: string, followedId: string): Follower {
    return new Follower({
      id: `${followerId}:${followedId}`,
      followerId,
      followedId,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: FollowerProps): Follower {
    return new Follower(props);
  }

  get id() { return this.props.id; }
  get followerId() { return this.props.followerId; }
  get followedId() { return this.props.followedId; }
  get createdAt() { return this.props.createdAt; }
}
