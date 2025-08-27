import { Customer } from '../../domain/Customer';

export interface ICustomerRepository {
  create(customer: Customer, orgId: string): Promise<Customer>;
  findById(id: string, orgId: string): Promise<Customer | null>;
  findByEmail(email: string, orgId: string): Promise<Customer | null>;
  findByPhone(phone: string, orgId: string): Promise<Customer | null>;
  findByPassport(passportNo: string, orgId: string): Promise<Customer | null>;
  findAll(orgId: string, limit?: number): Promise<Customer[]>;
  update(customer: Customer, orgId: string): Promise<Customer>;
  softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  archive(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  search(query: string, orgId: string, limit?: number): Promise<Customer[]>;
  getActiveCustomers(orgId: string): Promise<Customer[]>;
  getCustomerBookingStats(customerId: string, orgId: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }>;
}
