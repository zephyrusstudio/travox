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

  // Data masking methods for sensitive information
  getMaskedAadhaar(): string | undefined {
    if (!this.aadhaarNo) return undefined;
    return `XXXX-XXXX-${this.aadhaarNo.slice(-4)}`;
  }

  getMaskedPassport(): string | undefined {
    if (!this.passportNo) return undefined;
    if (this.passportNo.length <= 4) return 'XXXX';
    return `${this.passportNo.slice(0, 2)}XXXX${this.passportNo.slice(-2)}`;
  }

  // Get customer data for API response with masked sensitive fields
  toApiResponse(): any {
    return {
      id: this.id,
      orgId: this.orgId,
      name: this.name,
      phone: this.phone,
      email: this.email,
      passportNo: this.getMaskedPassport(),
      aadhaarNo: this.getMaskedAadhaar(),
      visaNo: this.visaNo,
      gstin: this.gstin,
      accountId: this.accountId,
      totalBookings: this.totalBookings,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      isDeleted: this.isDeleted,
      archivedAt: this.archivedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
