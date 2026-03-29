import { Express } from 'express';
import { ReportController } from '../controllers/ReportController';
import { requireAuth } from '../../middleware/requireAuth';
import { UserRole } from '../../models/FirestoreTypes';

const REPORT_ROUTES = [
  'sales-by-customer-detail',
  'customer-balance-detail',
  'customer-payment-details',
  'payment-details-by-customer',
  'customer-ledger',
  'invoice-credit-note-list-by-date',
  'invoice-list',
  'invoices-by-month',
  'sales-by-product-service-detail',
  'transaction-list-by-customer',
  'transaction-list-by-date',
  'payment-splits-by-customer',
  'vendor-ledger',
  'outstanding-payments',
  'monthly-income-expense',
  'refund-register',
  'booking-register',
  'gst-view',
] as const;

export function registerReportRoutes(app: Express) {
  const reportCtrl = new ReportController();
  const auth = requireAuth([UserRole.ADMIN, UserRole.OWNER]);

  app.get('/reports/catalog', auth, reportCtrl.getCatalog.bind(reportCtrl));

  for (const reportRoute of REPORT_ROUTES) {
    app.get(`/reports/${reportRoute}`, auth, (req, res) => {
      req.params.reportId = reportRoute;
      return reportCtrl.getReportById(req, res);
    });
  }

  app.get('/reports/:reportId', auth, reportCtrl.getReportById.bind(reportCtrl));
}
