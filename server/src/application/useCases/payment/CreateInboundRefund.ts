import { injectable, inject } from 'tsyringe';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Payment } from '../../../domain/Payment';
import { RedisService } from '../../../infrastructure/services/RedisService';

interface CreateInboundRefundDTO {
  refundOfPaymentId: string; 
  category?: string;
  notes?: string;
  receiptNo?: string;
  toAccountId?: string;
}

@injectable()
export class CreateInboundRefund {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  async execute(data: CreateInboundRefundDTO, orgId: string, createdBy: string): Promise<Payment> {
    // CRITICAL: Invalidate payment cache first to ensure we get fresh original payment data
    await this.paymentRepo.invalidateCacheForPayment(data.refundOfPaymentId, orgId);
    
    const originalPayment = await this.paymentRepo.findById(data.refundOfPaymentId, orgId);
    if (!originalPayment || originalPayment.paymentType !== 'EXPENSE') {
      throw new Error('Original expense payment not found');
    }

    const vendorId = originalPayment.vendorId;
    const amount = originalPayment.amount;
    const currency = originalPayment.currency;
    const paymentMode = originalPayment.paymentMode;
    const fromAccountId = originalPayment.toAccountId; 

    if (!vendorId) {
      throw new Error('Original payment must have a vendor ID');
    }

    // CRITICAL: Invalidate vendor cache first to ensure fresh data
    // This prevents race conditions with concurrent refund operations
    await this.vendorRepo.invalidateCacheForVendor(vendorId, orgId);

    const vendor = await this.vendorRepo.findById(vendorId, orgId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const payment = Payment.createInboundRefund(
      orgId,
      amount,
      currency,
      paymentMode,
      createdBy,
      vendorId,
      data.refundOfPaymentId,
      {
        category: data.category,
        notes: data.notes,
        receiptNo: data.receiptNo,
        fromAccountId: fromAccountId,
        toAccountId: originalPayment.fromAccountId,
      }
    );

    const savedPayment = await this.paymentRepo.create(payment, orgId);

    vendor.deductExpense(amount);
    await this.vendorRepo.update(vendor, orgId);
    await this.cache.invalidatePattern(`report:vendors:expenses:${orgId}:*`);
    await this.cache.invalidatePattern(`report:center:${orgId}:*`);

    return savedPayment;
  }
}
