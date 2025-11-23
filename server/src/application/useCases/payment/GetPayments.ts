
import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { Payment } from '../../../domain/Payment';
import { PaymentType } from '../../../models/FirestoreTypes';

@injectable()
export class GetPayments {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository
  ) {}

  async execute(orgId: string, limit?: number, offset?: number, paymentType?: PaymentType): Promise<Payment[]> {
    return await this.paymentRepo.findAll(orgId, limit, offset, paymentType);
  }

  async count(orgId: string, paymentType?: PaymentType): Promise<number> {
    return await this.paymentRepo.countAll(orgId, paymentType);
  }
}
