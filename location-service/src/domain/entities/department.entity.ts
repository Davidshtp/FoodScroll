export class Department {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  static create(id: string, name: string): Department {
    return new Department(id, name);
  }
}
