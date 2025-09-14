import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';

@injectable()
export class DeleteCustomer {
  constructor(
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository
  ) {}

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    return await this.customerRepo.softDelete(id, orgId, updatedBy);
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    return await this.customerRepo.delete(id, orgId);
  }
}
