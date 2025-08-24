export class Organization {
  constructor(
    public id: string,
    public name: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(name: string): Organization {
    const now = new Date();
    return new Organization('', name, now, now);
  }

  updateName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }
}
