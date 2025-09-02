
import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { Payment } from '../../../domain/Payment';

@injectable()
export class GetPayments {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository
  ) {}

  async execute(orgId: string, limit?: number, offset?: number): Promise<Payment[]> {
    return await this.paymentRepo.findAll(orgId, limit, offset);
  }
}
