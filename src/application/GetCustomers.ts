import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from './Repositories/ICustomerRepository';
import { Customer } from '../domain/Customer';

@injectable()
export class GetCustomers {
  constructor(
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository
  ) {}

  async findById(id: string, orgId: string): Promise<Customer | null> {
    return await this.customerRepo.findById(id, orgId);
  }

  async findByEmail(email: string, orgId: string): Promise<Customer | null> {
    return await this.customerRepo.findByEmail(email, orgId);
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    return await this.customerRepo.findByPhone(phone, orgId);
  }

  async getAllActive(orgId: string): Promise<Customer[]> {
    return await this.customerRepo.getActiveCustomers(orgId);
  }

  async search(query: string, orgId: string, limit?: number): Promise<Customer[]> {
    return await this.customerRepo.search(query, orgId, limit);
  }

  async getStats(customerId: string, orgId: string) {
    return await this.customerRepo.getCustomerBookingStats(customerId, orgId);
  }
}
