import { Request, Response } from 'express';
import { container } from '../../config/container';
import { GetReportCatalog } from '../../application/useCases/reporting/GetReportCatalog';
import { GetReportData } from '../../application/useCases/reporting/GetReportData';
import {
  ReportId,
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
      const reportId = req.params.reportId as ReportId;
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
