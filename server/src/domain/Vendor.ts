import { ServiceType } from '../models/FirestoreTypes';

export class Vendor {
  constructor(
    public id: string,
    public orgId: string,
    public name: string,
    public serviceType: ServiceType,
    public pocName?: string,
    public phone?: string,
    public email?: string,
    public gstin?: string,
    public accountId?: string,
    public totalExpense: number = 0,
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
    serviceType: ServiceType,
    createdBy: string,
    options?: {
      pocName?: string;
      phone?: string;
      email?: string;
      gstin?: string;
      accountId?: string;
    }
  ): Vendor {
    const now = new Date();
    return new Vendor(
      '',
      orgId,
      name,
      serviceType,
      options?.pocName,
      options?.phone,
      options?.email,
      options?.gstin,
      options?.accountId,
      0,
      0,
      createdBy,
      createdBy,
      false,
      undefined,
      now,
      now
    );
  }

  updateContactInfo(pocName?: string, phone?: string, email?: string, updatedBy: string = ''): void {
    this.pocName = pocName;
    this.phone = phone;
    this.email = email;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  addExpense(amount: number): void {
    this.totalExpense += amount;
    this.updatedAt = new Date();
  }

  deductExpense(amount: number): void {
    this.totalExpense -= amount;
    this.updatedAt = new Date();
  }

  incrementBookingCount(): void {
    this.totalBookings += 1;
    this.updatedAt = new Date();
  }

  changeServiceType(serviceType: ServiceType, updatedBy: string = ''): void {
    this.serviceType = serviceType;
    this.updatedBy = updatedBy;
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

  // Data masking method for GSTIN
  getMaskedGstin(): string | undefined {
    if (!this.gstin) return undefined;
    if (this.gstin.length <= 4) return 'XXXX';
    return `${this.gstin.slice(0, 2)}XXXX${this.gstin.slice(-4)}`;
  }

  // Get vendor data for API response with optional unmasking of sensitive fields
  toApiResponse(unmask: boolean = false): any {
    return {
      id: this.id,
      orgId: this.orgId,
      name: this.name,
      serviceType: this.serviceType,
      pocName: this.pocName,
      phone: this.phone,
      email: this.email,
      gstin: unmask ? this.gstin : this.getMaskedGstin(),
      accountId: this.accountId,
      totalExpense: this.totalExpense,
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
