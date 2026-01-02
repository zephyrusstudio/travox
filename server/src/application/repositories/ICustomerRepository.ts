import { Customer } from '../../domain/Customer';

export interface CustomerSearchParams {
  q?: string;      // General search query
  name?: string;   // Search by name
  email?: string;  // Search by email
  phone?: string;  // Search by phone
  gstin?: string;  // Search by GST number
}

export interface ICustomerRepository {
  create(customer: Customer, orgId: string): Promise<Customer>;
  findById(id: string, orgId: string): Promise<Customer | null>;
  findByEmail(email: string, orgId: string): Promise<Customer | null>;
  findByPhone(phone: string, orgId: string): Promise<Customer | null>;
  findByPassport(passportNo: string, orgId: string): Promise<Customer | null>;
  findByAccountId(accountId: string, orgId: string): Promise<Customer | null>;
  findAll(orgId: string, limit?: number, offset?: number): Promise<Customer[]>;
  update(customer: Customer, orgId: string): Promise<Customer>;
  softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  delete(id: string, orgId: string): Promise<boolean>;
  archive(id: string, orgId: string, updatedBy: string): Promise<boolean>;
  search(query: string, orgId: string, limit?: number): Promise<Customer[]>;
  advancedSearch(params: CustomerSearchParams, orgId: string): Promise<Customer[]>;
  getActiveCustomers(orgId: string, limit?: number, offset?: number): Promise<Customer[]>;
  countActiveCustomers(orgId: string): Promise<number>;
  getCustomerBookingStats(customerId: string, orgId: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }>;
  
  // Cache management
  invalidateCacheForCustomer(customerId: string, orgId: string): Promise<void>;
}
