export class City {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly departmentId: string,
  ) {}

  static create(id: string, name: string, departmentId: string): City {
    return new City(id, name, departmentId);
  }
}
