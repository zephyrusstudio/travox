import { Request, Response } from 'express';
import { container } from '../../config/container';
import { GetReportCatalog } from '../../application/useCases/reporting/GetReportCatalog';
import { GetReportData } from '../../application/useCases/reporting/GetReportData';
import { GetCustomerPendingPaymentsReport } from '../../application/useCases/customer/GetCustomerPendingPaymentsReport';
import { GetVendorBookingsReport } from '../../application/useCases/vendor/GetVendorBookingsReport';
import {
  ReportId,
  ReportColumn,
  ReportQueryFilters,
  ReportResponseEnvelope,
  SUPPORTED_REPORT_IDS,
} from '../../application/useCases/reporting/ReportingTypes';
import { PaymentMode } from '../../models/FirestoreTypes';

const PAYMENT_MODES = new Set<string>(Object.values(PaymentMode));

export class ReportController {
  async getCatalog(req: Request, res: Response) {
    try {
      const useCase = container.resolve(GetReportCatalog);
      const data = useCase.execute();
      return res.json({
        status: 'success',
        data,
        count: data.length,
      });
    } catch (error: any) {
      return res.status(500).json({
        status: 'error',
        data: { message: error.message || 'Failed to load report catalog' },
      });
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const reportIdParam = String(req.params.reportId || '').trim();
      if (reportIdParam === 'customer-report-existing') {
        return this.getExistingCustomerReport(req, res);
      }

      if (reportIdParam === 'vendor-report-existing') {
        return this.getExistingVendorReport(req, res);
      }

      const reportId = reportIdParam as ReportId;
      if (!SUPPORTED_REPORT_IDS.includes(reportId)) {
        return res.status(404).json({
          status: 'error',
          data: { message: `Unsupported report: ${req.params.reportId}` },
        });
      }

      const filters = this.parseFilters(req);
      const orgId = req.user?.orgId;
      if (!orgId) {
        return res.status(401).json({
          status: 'error',
          data: { message: 'Organization context missing' },
        });
      }

      const useCase = container.resolve(GetReportData);
      const result = await useCase.execute(reportId, filters, orgId);
      const payload: ReportResponseEnvelope = {
        status: 'success',
        data: result.rows,
        count: result.rows.length,
        columns: result.columns,
        meta: result.meta,
      };
      return res.json(payload);
    } catch (error: any) {
      return res.status(400).json({
        status: 'error',
        data: { message: error.message || 'Failed to generate report' },
      });
    }
  }

  private async getExistingCustomerReport(req: Request, res: Response) {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(401).json({
        status: 'error',
        data: { message: 'Organization context missing' },
      });
    }

    const { startDate, endDate } = this.parseInterval(req.query.interval as string | undefined);
    const pendingOnly = this.parseBoolean(req.query.pendingOnly, false);
    const useCase = container.resolve(GetCustomerPendingPaymentsReport);
    const report = await useCase.execute(startDate, endDate, orgId, pendingOnly);

    const rows: Array<Record<string, string | number | boolean | null>> = [];
    let bookingCount = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const customerReport of report) {
      totalAmount += customerReport.totalAmount;
      totalPaid += customerReport.totalPaid;
      totalDue += customerReport.totalDue;

      for (const booking of customerReport.bookings) {
        bookingCount += 1;
        rows.push({
          customer: customerReport.customer.name,
          bookingRef: booking.id,
          packageName: booking.packageName || '',
          primaryPax: booking.primaryPaxName || '',
          bookingDate: booking.bookingDate.toISOString(),
          travelStart: booking.travelStartAt ? booking.travelStartAt.toISOString() : null,
          travelEnd: booking.travelEndAt ? booking.travelEndAt.toISOString() : null,
          status: booking.status,
          paymentCount: booking.paymentCount,
          paymentModes: booking.paymentModeBreakdown.map((item) => item.paymentMode).join(', '),
          totalAmount: booking.totalAmount,
          paidAmount: booking.paidAmount,
          dueAmount: booking.dueAmount,
        });
      }
    }

    const columns: ReportColumn[] = [
      { key: 'customer', label: 'Customer', type: 'text' },
      { key: 'bookingRef', label: 'Booking Ref', type: 'text' },
      { key: 'packageName', label: 'Package', type: 'text' },
      { key: 'primaryPax', label: 'Primary Pax', type: 'text' },
      { key: 'bookingDate', label: 'Booking Date', type: 'date' },
      { key: 'travelStart', label: 'Travel Start', type: 'date' },
      { key: 'travelEnd', label: 'Travel End', type: 'date' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'paymentCount', label: 'Payments', type: 'number', align: 'right' },
      { key: 'paymentModes', label: 'Payment Modes', type: 'text' },
      { key: 'totalAmount', label: 'Total Amount', type: 'currency', align: 'right' },
      { key: 'paidAmount', label: 'Paid Amount', type: 'currency', align: 'right' },
      { key: 'dueAmount', label: 'Due Amount', type: 'currency', align: 'right' },
    ];

    const payload: ReportResponseEnvelope = {
      status: 'success',
      data: rows,
      count: rows.length,
      columns,
      meta: {
        reportId: 'customer-report-existing',
        title: 'Customer Report (Existing)',
        generatedAt: new Date().toISOString(),
        interval: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totals: {
          customerCount: report.length,
          bookingCount,
          totalAmount: Number(totalAmount.toFixed(2)),
          totalPaid: Number(totalPaid.toFixed(2)),
          totalDue: Number(totalDue.toFixed(2)),
        },
        notes: ['Compatibility adapter for existing /customers/report route semantics.'],
      },
    };

    return res.json(payload);
  }

  private async getExistingVendorReport(req: Request, res: Response) {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(401).json({
        status: 'error',
        data: { message: 'Organization context missing' },
      });
    }

    const { startDate, endDate } = this.parseInterval(req.query.interval as string | undefined);
    const useCase = container.resolve(GetVendorBookingsReport);
    const report = await useCase.execute(startDate, endDate, orgId);

    const rows: Array<Record<string, string | number | boolean | null>> = [];
    let paymentCount = 0;
    let totalPaid = 0;

    for (const vendorReport of report) {
      totalPaid += vendorReport.totalPaid;
      for (const payment of vendorReport.payments) {
        paymentCount += 1;
        rows.push({
          vendor: vendorReport.vendor.name,
          serviceType: vendorReport.vendor.serviceType,
          paymentDate: payment.createdAt.toISOString(),
          paymentRef: payment.id,
          bookingRef: payment.bookingId || '',
          paymentMode: payment.paymentMode,
          category: payment.category || '',
          notes: payment.notes || '',
          amount: payment.amount,
          currency: payment.currency,
        });
      }
    }

    const columns: ReportColumn[] = [
      { key: 'vendor', label: 'Vendor', type: 'text' },
      { key: 'serviceType', label: 'Service Type', type: 'text' },
      { key: 'paymentDate', label: 'Payment Date', type: 'date' },
      { key: 'paymentRef', label: 'Payment Ref', type: 'text' },
      { key: 'bookingRef', label: 'Booking Ref', type: 'text' },
      { key: 'paymentMode', label: 'Payment Mode', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency', align: 'right' },
      { key: 'currency', label: 'Currency', type: 'text' },
    ];

    const payload: ReportResponseEnvelope = {
      status: 'success',
      data: rows,
      count: rows.length,
      columns,
      meta: {
        reportId: 'vendor-report-existing',
        title: 'Vendor Report (Existing)',
        generatedAt: new Date().toISOString(),
        interval: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totals: {
          vendorCount: report.length,
          paymentCount,
          totalPaid: Number(totalPaid.toFixed(2)),
        },
        notes: ['Compatibility adapter for existing /vendors/report route semantics.'],
      },
    };

    return res.json(payload);
  }

  private parseFilters(req: Request): ReportQueryFilters {
    const { startDate, endDate } = this.parseInterval(req.query.interval as string | undefined);

    const customerIds = this.parseList(req.query.customerIds);
    const vendorIds = this.parseList(req.query.vendorIds);
    const transactionTypes = this.parseList(req.query.transactionTypes);
    const serviceTypes = this.parseList(req.query.serviceTypes);

    const paymentModes = this.parseList(req.query.paymentModes)
      .map((value) => value.toUpperCase())
      .filter((value): value is PaymentMode => PAYMENT_MODES.has(value));

    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    return {
      startDate,
      endDate,
      customerIds,
      vendorIds,
      transactionTypes,
      paymentModes,
      serviceTypes,
      pendingOnly: this.parseBoolean(req.query.pendingOnly, false),
      search: String(req.query.search || '').trim(),
      sortBy: String(req.query.sortBy || 'date').trim(),
      sortOrder,
      includeRefunds: this.parseBoolean(req.query.includeRefunds, true),
      includePaymentDetails: this.parseBoolean(req.query.includePaymentDetails, true),
      includeZeroBalance: this.parseBoolean(req.query.includeZeroBalance, true),
      bookingId: String(req.query.bookingId || '').trim(),
    };
  }

  private parseInterval(interval?: string): { startDate: Date; endDate: Date } {
    if (!interval) {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    const [rawStart, rawEnd] = interval.split(',').map((segment) => segment.trim());
    if (!rawStart || !rawEnd) {
      throw new Error('Invalid interval format. Expected startDate,endDate');
    }

    const startDate = new Date(rawStart);
    const endDate = new Date(rawEnd);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error('Invalid date format in interval. Use ISO date values.');
    }

    if (startDate.getTime() > endDate.getTime()) {
      throw new Error('Start date must be before end date.');
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  private parseList(value: unknown): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .flatMap((entry) => String(entry).split(','))
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return String(value)
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  private parseBoolean(value: unknown, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }

    if (Array.isArray(value)) {
      return this.parseBoolean(value[0], fallback);
    }

    const normalized = String(value).toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
    return fallback;
  }
}
