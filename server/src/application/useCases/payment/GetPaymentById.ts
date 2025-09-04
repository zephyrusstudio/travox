
import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { Payment } from '../../../domain/Payment';

@injectable()
export class GetPaymentById {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository
  ) {}

  async execute(id: string, orgId: string): Promise<Payment | null> {
    return await this.paymentRepo.findById(id, orgId);
  }
}
