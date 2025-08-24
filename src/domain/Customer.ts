export class Customer {
  constructor(
    public id: string,
    public orgId: string,
    public name: string,
    public phone?: string,
    public email?: string,
    public passportNo?: string,
    public aadhaarNo?: string,
    public visaNo?: string,
    public gstin?: string,
    public accountId?: string,
    public totalBookings: number = 0,
    public createdBy: string = '',
    public updatedBy: string = '',
    public isDeleted: boolean = false,
    public archivedAt?: Date,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(
    orgId: string,
    name: string,
    createdBy: string,
    options?: {
      phone?: string;
      email?: string;
      passportNo?: string;
      aadhaarNo?: string;
      visaNo?: string;
      gstin?: string;
      accountId?: string;
    }
  ): Customer {
    const now = new Date();
    return new Customer(
      '',
      orgId,
      name,
      options?.phone,
      options?.email,
      options?.passportNo,
      options?.aadhaarNo,
      options?.visaNo,
      options?.gstin,
      options?.accountId,
      0,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  updateContactInfo(phone?: string, email?: string, updatedBy: string = ''): void {
    this.phone = phone;
    this.email = email;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  updatePassportInfo(passportNo?: string, visaNo?: string, updatedBy: string = ''): void {
    this.passportNo = passportNo;
    this.visaNo = visaNo;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  incrementBookingCount(): void {
    this.totalBookings += 1;
    this.updatedAt = new Date();
  }

  archive(updatedBy: string = ''): void {
    this.archivedAt = new Date();
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  softDelete(updatedBy: string = ''): void {
    this.isDeleted = true;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }
}
