import { injectable, inject } from 'tsyringe';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { RedisService } from '../../../infrastructure/services/RedisService';
import { PaymentType, ServiceType } from '../../../models/FirestoreTypes';

export interface VendorExpenseReport {
  vendor: {
    id: string;
    name: string;
    serviceType: ServiceType;
    phone?: string;
    email?: string;
  };
  payments: {
    id: string;
    bookingId?: string;
    amount: number;
    currency: string;
    paymentMode: string;
    category?: string;
    notes?: string;
    createdAt: Date;
  }[];
  totalPaid: number;
  paymentCount: number;
}

const REPORT_CACHE_TTL = 300; // 5 minutes

@injectable()
export class GetVendorBookingsReport {
  constructor(
    @inject('IVendorRepository') private vendorRepo: IVendorRepository,
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  /**
   * Get vendors with expense payments made to them within a date interval
   * The interval is based on payment creation date
   */
  async execute(
    startDate: Date,
    endDate: Date,
    orgId: string
  ): Promise<VendorExpenseReport[]> {
    // Generate cache key based on date range
    const cacheKey = `report:vendors:expenses:${orgId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    // Try to get from cache first
    const cached = await this.cache.get<VendorExpenseReport[]>(cacheKey);
    if (cached) {
      // Rehydrate dates from cached data
      return cached.map(report => ({
        ...report,
        payments: report.payments.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt)
        }))
      }));
    }

    // Get all active vendors for the org
    const allVendors = await this.vendorRepo.getActiveVendors(orgId);

    if (allVendors.length === 0) {
      return [];
    }

    // Fetch payments for all vendors in parallel
    const paymentPromises = allVendors.map(v => this.paymentRepo.findByVendorId(v.id, orgId));
    const paymentsArrays = await Promise.all(paymentPromises);

    // Build the report
    const reports: VendorExpenseReport[] = [];

    for (let i = 0; i < allVendors.length; i++) {
      const vendor = allVendors[i];
      
      // Filter to only include EXPENSE type payments within the date range
      const vendorPayments = paymentsArrays[i].filter(p => {
        const paymentDate = p.createdAt;
        return (
          p.paymentType === PaymentType.EXPENSE &&
          paymentDate >= startDate &&
          paymentDate <= endDate
        );
      });

      // Only include vendors that have payments in this period
      if (vendorPayments.length === 0) continue;

      const totalPaid = vendorPayments.reduce((sum, p) => sum + p.amount, 0);

      reports.push({
        vendor: {
          id: vendor.id,
          name: vendor.name,
          serviceType: vendor.serviceType,
          phone: vendor.phone,
          email: vendor.email
        },
        payments: vendorPayments.map(p => ({
          id: p.id,
          bookingId: p.bookingId,
          amount: p.amount,
          currency: p.currency,
          paymentMode: p.paymentMode,
          category: p.category,
          notes: p.notes,
          createdAt: p.createdAt
        })),
        totalPaid,
        paymentCount: vendorPayments.length
      });
    }

    // Sort by total paid amount descending
    reports.sort((a, b) => b.totalPaid - a.totalPaid);

    // Cache the result
    await this.cache.set(cacheKey, reports, REPORT_CACHE_TTL);

    return reports;
  }
}
