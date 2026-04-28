import { inject, injectable } from 'tsyringe';
import { IBookingRepository } from '../../repositories/IBookingRepository';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { IPaymentRepository } from '../../repositories/IPaymentRepository';
import { IVendorRepository } from '../../repositories/IVendorRepository';
import { Booking } from '../../../domain/Booking';
import { Customer } from '../../../domain/Customer';
import { Payment } from '../../../domain/Payment';
import { Vendor } from '../../../domain/Vendor';
import {
  BookingStatus,
  PaymentMode,
  PaymentType,
  ServiceType,
} from '../../../models/FirestoreTypes';
import { RedisService } from '../../../infrastructure/services/RedisService';
import {
  CustomerTimelineEvent,
  ReportColumn,
  ReportId,
  ReportQueryFilters,
  ReportResult,
  ReportRow,
  VendorTimelineEvent,
} from './ReportingTypes';

interface BaseDataset {
  bookings: Booking[];
  bookingsById: Map<string, Booking>;
  customersById: Map<string, Customer>;
  vendorsById: Map<string, Vendor>;
  receivables: Payment[];
  receivablesByBookingId: Map<string, Payment[]>;
  outboundRefunds: Payment[];
  outboundRefundsByBookingId: Map<string, Payment[]>;
  expenses: Payment[];
  inboundRefunds: Payment[];
}

interface BookingFinancials {
  paidAmount: number;
  dueAmount: number;
  recordedReceivableTotal: number;
  recordedRefundTotal: number;
  missingPaymentAmount: number;
}

const REPORT_CACHE_TTL_SECONDS = 300;

const CUSTOMER_SOURCE_RANK: Record<CustomerTimelineEvent['sourceType'], number> = {
  BOOKING: 1,
  RECEIVABLE: 2,
  REFUND_OUTBOUND: 3,
};

const VENDOR_SOURCE_RANK: Record<VendorTimelineEvent['sourceType'], number> = {
  EXPENSE: 1,
  REFUND_INBOUND: 2,
};

const JOURNEY_LABELS: Record<string, string> = {
  FLIGHT: 'Air Ticket',
  TRAIN: 'Railway Ticket',
  BUS: 'Bus Ticket',
  HOTEL: 'Hotel Booking',
  CAB: 'Cab Service',
  VISA: 'Visa Service',
  OTHER: 'Travel Service',
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.AIRLINE]: 'Air Ticket',
  [ServiceType.HOTEL]: 'Hotel Booking',
  [ServiceType.RAIL]: 'Railway Ticket',
  [ServiceType.BUS]: 'Bus Ticket',
  [ServiceType.CAB]: 'Cab Service',
  [ServiceType.DMC]: 'Tour Package',
  [ServiceType.VISA]: 'Visa Service',
  [ServiceType.INSURANCE]: 'Insurance',
  [ServiceType.OTHER]: 'Travel Service',
};

@injectable()
export class GetReportData {
  constructor(
    @inject('IBookingRepository') private bookingRepo: IBookingRepository,
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject('IVendorRepository') private vendorRepo: IVendorRepository,
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('RedisService') private cache: RedisService
  ) {}

  async execute(reportId: ReportId, filters: ReportQueryFilters, orgId: string): Promise<ReportResult> {
    const cacheKey = this.buildCacheKey(reportId, filters, orgId);
    const cached = await this.cache.get<ReportResult>(cacheKey);
    if (cached) {
      return cached;
    }

    const dataset = await this.loadBaseDataset(orgId);

    let report: ReportResult;
    switch (reportId) {
      case 'sales-by-customer-detail':
        report = this.buildSalesByCustomerDetail(dataset, filters);
        break;
      case 'customer-balance-detail':
        report = this.buildCustomerBalanceDetail(dataset, filters);
        break;
      case 'customer-payment-details':
      case 'payment-details-by-customer':
        report = this.buildCustomerPaymentDetails(dataset, filters);
        break;
      case 'customer-ledger':
        report = this.buildCustomerLedger(dataset, filters);
        break;
      case 'invoice-credit-note-list-by-date':
        report = this.buildInvoiceCreditNoteListByDate(dataset, filters);
        break;
      case 'invoice-list':
        report = this.buildInvoiceList(dataset, filters);
        break;
      case 'invoices-by-month':
        report = this.buildInvoicesByMonth(dataset, filters);
        break;
      case 'sales-by-product-service-detail':
        report = this.buildSalesByProductServiceDetail(dataset, filters);
        break;
      case 'transaction-list-by-customer':
        report = this.buildTransactionListByCustomer(dataset, filters);
        break;
      case 'transaction-list-by-date':
        report = this.buildTransactionListByDate(dataset, filters);
        break;
      case 'payment-splits-by-customer':
        report = this.buildPaymentSplitsByCustomer(dataset, filters);
        break;
      case 'vendor-ledger':
        report = this.buildVendorLedger(dataset, filters);
        break;
      case 'outstanding-payments':
        report = this.buildOutstandingPayments(dataset, filters);
        break;
      case 'monthly-income-expense':
        report = this.buildMonthlyIncomeExpense(dataset, filters);
        break;
      case 'refund-register':
        report = this.buildRefundRegister(dataset, filters);
        break;
      case 'booking-register':
        report = this.buildBookingRegister(dataset, filters);
        break;
      case 'gst-view':
        report = this.buildGstView(dataset, filters);
        break;
      default:
        throw new Error(`Unsupported report: ${reportId}`);
    }

    await this.cache.set(cacheKey, report, REPORT_CACHE_TTL_SECONDS);
    return report;
  }

  private buildCacheKey(reportId: ReportId, filters: ReportQueryFilters, orgId: string): string {
    const normalized = {
      reportId,
      start: filters.startDate.toISOString(),
      end: filters.endDate.toISOString(),
      customerIds: [...filters.customerIds].sort(),
      vendorIds: [...filters.vendorIds].sort(),
      transactionTypes: [...filters.transactionTypes].sort(),
      paymentModes: [...filters.paymentModes].sort(),
      serviceTypes: [...filters.serviceTypes].sort(),
      pendingOnly: filters.pendingOnly,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      includeRefunds: filters.includeRefunds,
      includePaymentDetails: filters.includePaymentDetails,
      includeZeroBalance: filters.includeZeroBalance,
      bookingId: filters.bookingId,
    };

    return `report:center:${orgId}:${reportId}:${JSON.stringify(normalized)}`;
  }

  private async loadBaseDataset(orgId: string): Promise<BaseDataset> {
    const [bookings, customers, vendors, receivables, outboundRefunds, expenses, inboundRefunds] =
      await Promise.all([
        this.bookingRepo.findAll(orgId),
        this.customerRepo.getActiveCustomers(orgId),
        this.vendorRepo.getActiveVendors(orgId),
        this.paymentRepo.findByType(PaymentType.RECEIVABLE, orgId),
        this.paymentRepo.findByType(PaymentType.REFUND_OUTBOUND, orgId),
        this.paymentRepo.findByType(PaymentType.EXPENSE, orgId),
        this.paymentRepo.findByType(PaymentType.REFUND_INBOUND, orgId),
      ]);

    return {
      bookings,
      bookingsById: new Map(bookings.map((booking) => [booking.id, booking])),
      customersById: new Map(customers.map((customer) => [customer.id, customer])),
      vendorsById: new Map(vendors.map((vendor) => [vendor.id, vendor])),
      receivables,
      receivablesByBookingId: this.groupPaymentsByBookingId(receivables),
      outboundRefunds,
      outboundRefundsByBookingId: this.groupPaymentsByBookingId(outboundRefunds),
      expenses,
      inboundRefunds,
    };
  }

  private groupPaymentsByBookingId(payments: Payment[]): Map<string, Payment[]> {
    const grouped = new Map<string, Payment[]>();
    for (const payment of payments) {
      if (!payment.bookingId) {
        continue;
      }
      const existing = grouped.get(payment.bookingId) || [];
      existing.push(payment);
      grouped.set(payment.bookingId, existing);
    }
    return grouped;
  }

  private getBookingFinancials(booking: Booking, dataset: BaseDataset): BookingFinancials {
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REFUNDED) {
      return {
        paidAmount: booking.status === BookingStatus.REFUNDED ? 0 : this.round(Math.max(0, Number(booking.paidAmount || 0))),
        dueAmount: 0,
        recordedReceivableTotal: 0,
        recordedRefundTotal: 0,
        missingPaymentAmount: 0,
      };
    }

    const receivables = dataset.receivablesByBookingId.get(booking.id) || [];
    const outboundRefunds = dataset.outboundRefundsByBookingId.get(booking.id) || [];
    const recordedReceivableTotal = this.round(receivables.reduce((sum, payment) => sum + payment.amount, 0));
    const recordedRefundTotal = this.round(outboundRefunds.reduce((sum, payment) => sum + payment.amount, 0));
    const storedPaidAmount = Math.max(0, Number(booking.paidAmount || 0));
    const grossPaidFromStored = storedPaidAmount > recordedReceivableTotal
      ? storedPaidAmount + recordedRefundTotal
      : storedPaidAmount;
    const grossPaidAmount = this.round(Math.max(recordedReceivableTotal, grossPaidFromStored));
    const paidAmount = this.round(Math.max(0, grossPaidAmount - recordedRefundTotal));
    const dueAmount = this.round(Math.max(0, booking.totalAmount - grossPaidAmount));
    const missingPaymentAmount = this.round(Math.max(0, grossPaidAmount - recordedReceivableTotal));

    return {
      paidAmount,
      dueAmount,
      recordedReceivableTotal,
      recordedRefundTotal,
      missingPaymentAmount,
    };
  }

  private buildSalesByCustomerDetail(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const events = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: true,
      includePayments: true,
      includeRefunds: filters.includeRefunds,
      includeDateFilter: true,
      usePendingOnlyFilter: true,
    });

    const paymentTypeSelected = filters.transactionTypes.some((type) => type.toUpperCase() === 'PAYMENT');
    const rowEvents = filters.includePaymentDetails || paymentTypeSelected
      ? events
      : events.filter((event) => event.sourceType !== 'RECEIVABLE');

    const rows: ReportRow[] = [];
    const grouped = this.groupCustomerEvents(rowEvents);

    let invoiceTotal = 0;
    let paymentTotal = 0;
    let creditTotal = 0;

    for (const event of events) {
      if (event.transactionCode === 'INVOICE') {
        invoiceTotal += event.amount;
      } else if (event.transactionCode === 'PAYMENT') {
        paymentTotal += event.amount;
      } else {
        creditTotal += event.amount;
      }
    }

    grouped.forEach((groupEvents) => {
      let runningBalance = 0;
      for (const event of groupEvents) {
        runningBalance += event.signedAmount;

        rows.push({
          date: event.date.toISOString(),
          transactionType: event.transactionType,
          refNo: event.refNo,
          customer: event.customerName,
          bookingRef: event.bookingRef || '',
          productService: event.productService,
          memo: event.memo,
          qty: event.qty ?? null,
          salesPrice: event.unitPrice ?? null,
          amount: event.signedAmount,
          balance: runningBalance,
        });
      }
    });

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('transactionType', 'Transaction Type'),
        this.textColumn('refNo', 'No. / Ref'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('memo', 'Memo / Description'),
        this.numberColumn('qty', 'Qty'),
        this.currencyColumn('salesPrice', 'Sales Price'),
        this.currencyColumn('amount', 'Amount'),
        this.currencyColumn('balance', 'Balance'),
      ],
      rows,
      meta: this.meta(
        'sales-by-customer-detail',
        'Sales by Customer Detail',
        filters,
        {
          invoiceTotal: this.round(invoiceTotal),
          paymentTotal: this.round(paymentTotal),
          creditMemoTotal: this.round(creditTotal),
          netBalance: this.round(invoiceTotal - paymentTotal - creditTotal),
          transactionCount: rows.length,
        }
      ),
    };
  }

  private buildCustomerBalanceDetail(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const allEvents = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: true,
      includePayments: true,
      includeRefunds: true,
      includeDateFilter: false,
      usePendingOnlyFilter: false,
    });

    const byCustomer = new Map<string, CustomerTimelineEvent[]>();
    for (const event of allEvents) {
      const existing = byCustomer.get(event.customerId) || [];
      existing.push(event);
      byCustomer.set(event.customerId, existing);
    }

    const rows: ReportRow[] = [];
    let customerCount = 0;
    let closingBalanceTotal = 0;

    byCustomer.forEach((events) => {
      const ordered = [...events].sort((left, right) => this.compareCustomerEvents(left, right, 'date', 'asc'));
      const openingBalance = ordered
        .filter((event) => event.date < filters.startDate)
        .reduce((sum, event) => sum + event.signedAmount, 0);

      const periodEvents = ordered.filter((event) => this.isWithinInterval(event.date, filters.startDate, filters.endDate));
      if (!periodEvents.length && !filters.includeZeroBalance && openingBalance === 0) {
        return;
      }

      customerCount += 1;
      let runningBalance = openingBalance;

      for (const event of periodEvents) {
        runningBalance += event.signedAmount;
        rows.push({
          date: event.date.toISOString(),
          customer: event.customerName,
          transactionType: event.transactionType,
          refNo: event.refNo,
          description: event.memo,
          debit: event.signedAmount > 0 ? event.signedAmount : null,
          credit: event.signedAmount < 0 ? Math.abs(event.signedAmount) : null,
          runningBalance,
        });
      }

      closingBalanceTotal += runningBalance;
    });

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('transactionType', 'Transaction Type'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('description', 'Description'),
        this.currencyColumn('debit', 'Debit / Charge'),
        this.currencyColumn('credit', 'Credit / Payment / Refund'),
        this.currencyColumn('runningBalance', 'Running Balance'),
      ],
      rows,
      meta: this.meta('customer-balance-detail', 'Customer Balance Detail', filters, {
        customerCount,
        rowCount: rows.length,
        closingBalanceTotal: this.round(closingBalanceTotal),
      }),
    };
  }

  private buildCustomerPaymentDetails(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const paymentEvents = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: false,
      includePayments: true,
      includeRefunds: filters.includeRefunds,
      includeDateFilter: true,
      usePendingOnlyFilter: false,
    });

    const rows = paymentEvents.map((event) => ({
      paymentDate: event.date.toISOString(),
      customer: event.customerName,
      receiptRef: event.refNo,
      bookingRef: event.bookingRef || '',
      productService: event.productService,
      paymentMode: event.paymentMode || '',
      amount: event.amount,
      notes: event.notes || event.memo,
      direction: event.transactionCode === 'PAYMENT' ? 'IN' : 'OUT',
    }));

    const totalReceived = paymentEvents
      .filter((event) => event.transactionCode === 'PAYMENT')
      .reduce((sum, event) => sum + event.amount, 0);

    const totalRefunded = paymentEvents
      .filter((event) => event.transactionCode === 'CREDIT_MEMO')
      .reduce((sum, event) => sum + event.amount, 0);

    return {
      columns: [
        this.dateColumn('paymentDate', 'Payment Date'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('receiptRef', 'Receipt No / Payment Ref'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('productService', 'Package / Travel Label'),
        this.textColumn('paymentMode', 'Payment Mode'),
        this.currencyColumn('amount', 'Amount'),
        this.textColumn('notes', 'Notes'),
        this.textColumn('direction', 'Direction'),
      ],
      rows,
      meta: this.meta('customer-payment-details', 'Customer Payment Details', filters, {
        totalReceived: this.round(totalReceived),
        totalRefunded: this.round(totalRefunded),
        net: this.round(totalReceived - totalRefunded),
        transactionCount: rows.length,
      }),
    };
  }

  private buildCustomerLedger(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const allEvents = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: true,
      includePayments: true,
      includeRefunds: true,
      includeDateFilter: false,
      usePendingOnlyFilter: false,
    });

    const byCustomer = new Map<string, CustomerTimelineEvent[]>();
    for (const event of allEvents) {
      const existing = byCustomer.get(event.customerId) || [];
      existing.push(event);
      byCustomer.set(event.customerId, existing);
    }

    const rows: ReportRow[] = [];
    let closingBalanceTotal = 0;

    byCustomer.forEach((events) => {
      const ordered = [...events].sort((left, right) => this.compareCustomerEvents(left, right, 'date', 'asc'));
      let runningBalance = ordered
        .filter((event) => event.date < filters.startDate)
        .reduce((sum, event) => sum + event.signedAmount, 0);

      const periodEvents = ordered.filter((event) => this.isWithinInterval(event.date, filters.startDate, filters.endDate));
      if (!filters.includeZeroBalance && runningBalance === 0 && periodEvents.length === 0) {
        return;
      }

      rows.push({
        customer: events[0]?.customerName || 'Unknown',
        date: filters.startDate.toISOString(),
        transactionType: 'Opening Balance',
        refNo: '',
        description: 'Opening balance before interval',
        debit: runningBalance > 0 ? runningBalance : null,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : null,
        balance: runningBalance,
      });

      for (const event of periodEvents) {
        runningBalance += event.signedAmount;
        rows.push({
          customer: event.customerName,
          date: event.date.toISOString(),
          transactionType: event.transactionType,
          refNo: event.refNo,
          description: event.memo,
          debit: event.signedAmount > 0 ? event.signedAmount : null,
          credit: event.signedAmount < 0 ? Math.abs(event.signedAmount) : null,
          balance: runningBalance,
        });
      }

      rows.push({
        customer: events[0]?.customerName || 'Unknown',
        date: filters.endDate.toISOString(),
        transactionType: 'Closing Balance',
        refNo: '',
        description: 'Closing balance for interval',
        debit: runningBalance > 0 ? runningBalance : null,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : null,
        balance: runningBalance,
      });

      closingBalanceTotal += runningBalance;
    });

    return {
      columns: [
        this.textColumn('customer', 'Customer'),
        this.dateColumn('date', 'Date'),
        this.textColumn('transactionType', 'Transaction Type'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('description', 'Description'),
        this.currencyColumn('debit', 'Debit'),
        this.currencyColumn('credit', 'Credit'),
        this.currencyColumn('balance', 'Running Balance'),
      ],
      rows,
      meta: this.meta('customer-ledger', 'Customer Ledger', filters, {
        statementRows: rows.length,
        closingBalanceTotal: this.round(closingBalanceTotal),
      }),
    };
  }

  private buildInvoiceCreditNoteListByDate(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows: ReportRow[] = [];

    for (const booking of dataset.bookings) {
      if (!this.isInvoiceEligibleBooking(booking)) {
        continue;
      }
      if (!this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate)) {
        continue;
      }
      if (filters.customerIds.length > 0 && !filters.customerIds.includes(booking.customerId)) {
        continue;
      }

      const customer = dataset.customersById.get(booking.customerId);
      rows.push({
        date: booking.bookingDate.toISOString(),
        type: 'Invoice',
        refNo: booking.pnrNo || booking.id,
        customer: customer?.name || 'Unknown Customer',
        productService: this.resolveProductServiceLabel(booking),
        description: booking.packageName || booking.primaryPaxName || 'Booking',
        amount: booking.totalAmount,
      });
    }

    for (const refund of dataset.outboundRefunds) {
      if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }

      const booking = refund.bookingId ? dataset.bookingsById.get(refund.bookingId) : undefined;
      const customerId = refund.customerId || booking?.customerId;
      if (!customerId) {
        continue;
      }
      if (filters.customerIds.length > 0 && !filters.customerIds.includes(customerId)) {
        continue;
      }

      const customer = dataset.customersById.get(customerId);
      rows.push({
        date: refund.createdAt.toISOString(),
        type: 'Credit Memo',
        refNo: refund.receiptNo || refund.id,
        customer: customer?.name || 'Unknown Customer',
        productService: booking ? this.resolveProductServiceLabel(booking) : 'Booking',
        description: refund.notes || 'Outbound customer refund',
        amount: -refund.amount,
      });
    }

    rows.sort((left, right) => this.compareRows(left, right, 'date', filters.sortOrder));

    if (filters.search) {
      const search = filters.search.toLowerCase();
      const searched = rows.filter(
        (row) =>
          String(row.customer).toLowerCase().includes(search) ||
          String(row.refNo).toLowerCase().includes(search) ||
          String(row.productService).toLowerCase().includes(search) ||
          String(row.description).toLowerCase().includes(search)
      );
      return this.invoiceCreditResult(filters, searched);
    }

    return this.invoiceCreditResult(filters, rows);
  }

  private invoiceCreditResult(filters: ReportQueryFilters, rows: ReportRow[]): ReportResult {
    const invoiceTotal = rows
      .filter((row) => row.type === 'Invoice')
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const creditTotal = Math.abs(
      rows
        .filter((row) => row.type === 'Credit Memo')
        .reduce((sum, row) => sum + Number(row.amount || 0), 0)
    );

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('type', 'Type'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('description', 'Description'),
        this.currencyColumn('amount', 'Amount'),
      ],
      rows,
      meta: this.meta('invoice-credit-note-list-by-date', 'Invoice And Credit Note List by Date', filters, {
        invoiceTotal: this.round(invoiceTotal),
        creditMemoTotal: this.round(creditTotal),
        grandTotal: this.round(invoiceTotal - creditTotal),
        rowCount: rows.length,
      }),
    };
  }

  private buildInvoiceList(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows = dataset.bookings
      .filter((booking) => this.isInvoiceEligibleBooking(booking))
      .filter((booking) => this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true))
      .filter((booking) => (filters.pendingOnly ? this.getBookingFinancials(booking, dataset).dueAmount > 0 : true))
      .filter((booking) => {
        if (!filters.serviceTypes.length) {
          return true;
        }
        const label = this.resolveProductServiceLabel(booking).toLowerCase();
        return filters.serviceTypes.some((serviceType) => label.includes(serviceType.toLowerCase()));
      })
      .map((booking) => {
        const customer = dataset.customersById.get(booking.customerId);
        const financials = this.getBookingFinancials(booking, dataset);
        return {
          date: booking.bookingDate.toISOString(),
          invoiceRef: booking.pnrNo || booking.id,
          customer: customer?.name || 'Unknown Customer',
          productService: this.resolveProductServiceLabel(booking),
          bookingStatus: booking.status,
          totalAmount: booking.totalAmount,
          paidAmount: financials.paidAmount,
          dueAmount: financials.dueAmount,
          travelStart: booking.travelStartAt ? booking.travelStartAt.toISOString() : '',
        };
      });

    const searched = this.searchRows(rows, filters.search, ['invoiceRef', 'customer', 'productService', 'bookingStatus']);
    searched.sort((left, right) => this.compareRows(left, right, filters.sortBy || 'date', filters.sortOrder));

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('invoiceRef', 'Invoice / Booking Ref'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('bookingStatus', 'Booking Status'),
        this.currencyColumn('totalAmount', 'Total Amount'),
        this.currencyColumn('paidAmount', 'Paid Amount'),
        this.currencyColumn('dueAmount', 'Due Amount'),
        this.dateColumn('travelStart', 'Travel Start'),
      ],
      rows: searched,
      meta: this.meta('invoice-list', 'Invoice List', filters, {
        invoiceCount: searched.length,
        totalInvoiced: this.round(searched.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)),
        totalPaid: this.round(searched.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0)),
        totalDue: this.round(searched.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0)),
      }),
    };
  }

  private buildInvoicesByMonth(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const invoiceRows = dataset.bookings
      .filter((booking) => this.isInvoiceEligibleBooking(booking))
      .filter((booking) => this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true));

    const byMonth = new Map<string, { month: string; invoiceCount: number; totalInvoiced: number; totalPaid: number; totalDue: number }>();

    for (const booking of invoiceRows) {
      const monthKey = `${booking.bookingDate.getFullYear()}-${String(booking.bookingDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = byMonth.get(monthKey) || {
        month: monthKey,
        invoiceCount: 0,
        totalInvoiced: 0,
        totalPaid: 0,
        totalDue: 0,
      };
      existing.invoiceCount += 1;
      existing.totalInvoiced += booking.totalAmount;
      const financials = this.getBookingFinancials(booking, dataset);
      existing.totalPaid += financials.paidAmount;
      existing.totalDue += financials.dueAmount;
      byMonth.set(monthKey, existing);
    }

    const rows = Array.from(byMonth.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((item) => ({
        month: this.humanMonth(item.month),
        invoiceCount: item.invoiceCount,
        totalInvoiced: this.round(item.totalInvoiced),
        totalPaid: this.round(item.totalPaid),
        totalDue: this.round(item.totalDue),
      }));

    return {
      columns: [
        this.textColumn('month', 'Month'),
        this.numberColumn('invoiceCount', 'Invoice Count'),
        this.currencyColumn('totalInvoiced', 'Total Invoiced'),
        this.currencyColumn('totalPaid', 'Total Paid'),
        this.currencyColumn('totalDue', 'Total Due'),
      ],
      rows,
      meta: this.meta('invoices-by-month', 'Invoices by Month', filters, {
        monthCount: rows.length,
        totalInvoiced: this.round(rows.reduce((sum, row) => sum + Number(row.totalInvoiced || 0), 0)),
        totalPaid: this.round(rows.reduce((sum, row) => sum + Number(row.totalPaid || 0), 0)),
        totalDue: this.round(rows.reduce((sum, row) => sum + Number(row.totalDue || 0), 0)),
      }),
    };
  }

  private buildSalesByProductServiceDetail(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows: ReportRow[] = [];

    for (const booking of dataset.bookings) {
      if (!this.isInvoiceEligibleBooking(booking)) {
        continue;
      }
      if (!this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate)) {
        continue;
      }
      if (filters.customerIds.length > 0 && !filters.customerIds.includes(booking.customerId)) {
        continue;
      }

      const productService = this.resolveProductServiceLabel(booking);
      if (filters.serviceTypes.length > 0) {
        const matchesService = filters.serviceTypes.some((serviceType) =>
          productService.toLowerCase().includes(serviceType.toLowerCase())
        );
        if (!matchesService) {
          continue;
        }
      }

      const customer = dataset.customersById.get(booking.customerId);
      const qty = booking.paxCount > 0 ? booking.paxCount : null;
      const unitPrice = qty && qty > 0 ? this.round(booking.totalAmount / qty) : null;

      rows.push({
        date: booking.bookingDate.toISOString(),
        customer: customer?.name || 'Unknown Customer',
        refNo: booking.pnrNo || booking.id,
        productService,
        description: booking.packageName || booking.primaryPaxName || 'Booking',
        qty,
        unitPrice,
        amount: booking.totalAmount,
      });
    }

    if (filters.includeRefunds) {
      for (const refund of dataset.outboundRefunds) {
        if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
          continue;
        }
        const booking = refund.bookingId ? dataset.bookingsById.get(refund.bookingId) : undefined;
        const customerId = refund.customerId || booking?.customerId;
        if (!customerId) {
          continue;
        }
        if (filters.customerIds.length > 0 && !filters.customerIds.includes(customerId)) {
          continue;
        }

        const customer = dataset.customersById.get(customerId);
        rows.push({
          date: refund.createdAt.toISOString(),
          customer: customer?.name || 'Unknown Customer',
          refNo: refund.receiptNo || refund.id,
          productService: booking ? this.resolveProductServiceLabel(booking) : 'Booking',
          description: refund.notes || 'Outbound refund',
          qty: null,
          unitPrice: null,
          amount: -refund.amount,
        });
      }
    }

    const searched = this.searchRows(rows, filters.search, ['customer', 'refNo', 'productService', 'description']);
    searched.sort((left, right) => this.compareRows(left, right, filters.sortBy || 'date', filters.sortOrder));

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('description', 'Description'),
        this.numberColumn('qty', 'Qty'),
        this.currencyColumn('unitPrice', 'Unit Price'),
        this.currencyColumn('amount', 'Amount'),
      ],
      rows: searched,
      meta: this.meta('sales-by-product-service-detail', 'Sales by Product/Service Detail', filters, {
        rowCount: searched.length,
        totalAmount: this.round(searched.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      }),
    };
  }

  private buildTransactionListByCustomer(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const events = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: true,
      includePayments: true,
      includeRefunds: filters.includeRefunds,
      includeDateFilter: true,
      usePendingOnlyFilter: true,
    });

    const grouped = this.groupCustomerEvents(events);
    const rows: ReportRow[] = [];

    grouped.forEach((groupEvents) => {
      let runningBalance = 0;
      for (const event of groupEvents) {
        runningBalance += event.signedAmount;
        rows.push({
          date: event.date.toISOString(),
          type: event.transactionType,
          no: event.refNo,
          customer: event.customerName,
          memo: event.memo,
          amount: event.signedAmount,
          balance: runningBalance,
        });
      }
    });

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('type', 'Type'),
        this.textColumn('no', 'No.'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('memo', 'Memo / Description'),
        this.currencyColumn('amount', 'Amount'),
        this.currencyColumn('balance', 'Balance'),
      ],
      rows,
      meta: this.meta('transaction-list-by-customer', 'Transaction List by Customer', filters, {
        transactionCount: rows.length,
        netAmount: this.round(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      }),
    };
  }

  private buildTransactionListByDate(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const events = this.getFilteredCustomerEvents(dataset, filters, {
      includeInvoices: true,
      includePayments: true,
      includeRefunds: filters.includeRefunds,
      includeDateFilter: true,
      usePendingOnlyFilter: true,
    });

    const rows = events
      .sort((left, right) => this.compareCustomerEvents(left, right, filters.sortBy || 'date', filters.sortOrder))
      .map((event) => ({
        date: event.date.toISOString(),
        type: event.transactionType,
        refNo: event.refNo,
        customer: event.customerName,
        productService: event.productService,
        memo: event.memo,
        amount: event.signedAmount,
      }));

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('type', 'Type'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('memo', 'Memo'),
        this.currencyColumn('amount', 'Amount'),
      ],
      rows,
      meta: this.meta('transaction-list-by-date', 'Transaction List by Date', filters, {
        transactionCount: rows.length,
        netAmount: this.round(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      }),
    };
  }

  private buildPaymentSplitsByCustomer(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows: ReportRow[] = [];

    for (const payment of dataset.receivables) {
      if (!this.isWithinInterval(payment.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }

      const booking = payment.bookingId ? dataset.bookingsById.get(payment.bookingId) : undefined;
      const customerId = payment.customerId || booking?.customerId;
      if (!customerId) {
        continue;
      }
      if (filters.customerIds.length > 0 && !filters.customerIds.includes(customerId)) {
        continue;
      }
      if (filters.bookingId && payment.bookingId !== filters.bookingId) {
        continue;
      }
      if (filters.paymentModes.length > 0 && !filters.paymentModes.includes(payment.paymentMode)) {
        continue;
      }

      const customer = dataset.customersById.get(customerId);
      rows.push({
        paymentDate: payment.createdAt.toISOString(),
        paymentRef: payment.receiptNo || payment.id,
        customer: customer?.name || 'Unknown Customer',
        bookingRef: booking?.pnrNo || booking?.id || payment.bookingId || '',
        splitTarget: booking?.packageName || booking?.primaryPaxName || 'Single booking application',
        amountApplied: payment.amount,
        notes: payment.notes || '',
      });
    }

    const searched = this.searchRows(rows, filters.search, ['paymentRef', 'customer', 'bookingRef', 'splitTarget', 'notes']);
    searched.sort((left, right) => this.compareRows(left, right, 'paymentDate', filters.sortOrder));

    return {
      columns: [
        this.dateColumn('paymentDate', 'Payment Date'),
        this.textColumn('paymentRef', 'Payment Ref / Receipt No'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('splitTarget', 'Applied Against'),
        this.currencyColumn('amountApplied', 'Amount Applied'),
        this.textColumn('notes', 'Notes'),
      ],
      rows: searched,
      meta: this.meta('payment-splits-by-customer', 'Transaction List with Splits for Customer Payment Details', filters, {
        paymentCount: searched.length,
        totalApplied: this.round(searched.reduce((sum, row) => sum + Number(row.amountApplied || 0), 0)),
      }, [
        'Current Travox model maps each receivable payment to one booking. Multi-invoice split allocation is not present in schema.',
      ]),
    };
  }

  private buildVendorLedger(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const allEvents = this.getFilteredVendorEvents(dataset, filters, false);

    const byVendor = new Map<string, VendorTimelineEvent[]>();
    for (const event of allEvents) {
      const existing = byVendor.get(event.vendorId) || [];
      existing.push(event);
      byVendor.set(event.vendorId, existing);
    }

    const rows: ReportRow[] = [];
    let closingBalanceTotal = 0;

    byVendor.forEach((events) => {
      const ordered = [...events].sort((left, right) => this.compareVendorEvents(left, right, 'date', 'asc'));
      let runningBalance = ordered
        .filter((event) => event.date < filters.startDate)
        .reduce((sum, event) => sum + event.signedAmount, 0);

      const periodEvents = ordered.filter((event) => this.isWithinInterval(event.date, filters.startDate, filters.endDate));
      if (!filters.includeZeroBalance && runningBalance === 0 && periodEvents.length === 0) {
        return;
      }

      rows.push({
        vendor: events[0]?.vendorName || 'Unknown Vendor',
        date: filters.startDate.toISOString(),
        type: 'Opening Balance',
        refNo: '',
        debit: runningBalance > 0 ? runningBalance : null,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : null,
        balance: runningBalance,
      });

      for (const event of periodEvents) {
        runningBalance += event.signedAmount;
        rows.push({
          vendor: event.vendorName,
          date: event.date.toISOString(),
          type: event.transactionType,
          refNo: event.refNo,
          debit: event.signedAmount > 0 ? event.signedAmount : null,
          credit: event.signedAmount < 0 ? Math.abs(event.signedAmount) : null,
          balance: runningBalance,
        });
      }

      rows.push({
        vendor: events[0]?.vendorName || 'Unknown Vendor',
        date: filters.endDate.toISOString(),
        type: 'Closing Balance',
        refNo: '',
        debit: runningBalance > 0 ? runningBalance : null,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : null,
        balance: runningBalance,
      });

      closingBalanceTotal += runningBalance;
    });

    return {
      columns: [
        this.textColumn('vendor', 'Vendor'),
        this.dateColumn('date', 'Date'),
        this.textColumn('type', 'Transaction Type'),
        this.textColumn('refNo', 'Ref No'),
        this.currencyColumn('debit', 'Debit / Expense'),
        this.currencyColumn('credit', 'Credit / Refund'),
        this.currencyColumn('balance', 'Running Balance'),
      ],
      rows,
      meta: this.meta('vendor-ledger', 'Vendor Ledger', filters, {
        statementRows: rows.length,
        closingBalanceTotal: this.round(closingBalanceTotal),
      }),
    };
  }

  private buildOutstandingPayments(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows = dataset.bookings
      .filter((booking) => this.getBookingFinancials(booking, dataset).dueAmount > 0)
      .filter((booking) => this.isInvoiceEligibleBooking(booking))
      .filter((booking) => this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true))
      .map((booking) => {
        const customer = dataset.customersById.get(booking.customerId);
        const financials = this.getBookingFinancials(booking, dataset);
        return {
          bookingDate: booking.bookingDate.toISOString(),
          bookingRef: booking.pnrNo || booking.id,
          customer: customer?.name || 'Unknown Customer',
          productService: this.resolveProductServiceLabel(booking),
          status: booking.status,
          totalAmount: booking.totalAmount,
          paidAmount: financials.paidAmount,
          dueAmount: financials.dueAmount,
          travelStart: booking.travelStartAt ? booking.travelStartAt.toISOString() : '',
        };
      });

    const searched = this.searchRows(rows, filters.search, ['bookingRef', 'customer', 'productService', 'status']);

    return {
      columns: [
        this.dateColumn('bookingDate', 'Booking Date'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('status', 'Status'),
        this.currencyColumn('totalAmount', 'Total Amount'),
        this.currencyColumn('paidAmount', 'Paid Amount'),
        this.currencyColumn('dueAmount', 'Due Amount'),
        this.dateColumn('travelStart', 'Travel Start'),
      ],
      rows: searched,
      meta: this.meta('outstanding-payments', 'Outstanding Payments', filters, {
        bookingCount: searched.length,
        totalOutstanding: this.round(searched.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0)),
      }),
    };
  }

  private buildMonthlyIncomeExpense(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const monthlyMap = new Map<
      string,
      {
        month: string;
        invoiced: number;
        receivableCollected: number;
        expensePaid: number;
        outboundRefund: number;
        inboundRefund: number;
      }
    >();

    const ensureMonth = (monthKey: string) => {
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          invoiced: 0,
          receivableCollected: 0,
          expensePaid: 0,
          outboundRefund: 0,
          inboundRefund: 0,
        });
      }
      return monthlyMap.get(monthKey)!;
    };

    for (const booking of dataset.bookings) {
      if (!this.isInvoiceEligibleBooking(booking)) {
        continue;
      }
      if (!this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate)) {
        continue;
      }
      const key = this.monthKey(booking.bookingDate);
      ensureMonth(key).invoiced += booking.totalAmount;
    }

    for (const receivable of dataset.receivables) {
      if (!this.isWithinInterval(receivable.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const key = this.monthKey(receivable.createdAt);
      ensureMonth(key).receivableCollected += receivable.amount;
    }

    for (const expense of dataset.expenses) {
      if (!this.isWithinInterval(expense.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const key = this.monthKey(expense.createdAt);
      ensureMonth(key).expensePaid += expense.amount;
    }

    for (const refund of dataset.outboundRefunds) {
      if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const key = this.monthKey(refund.createdAt);
      ensureMonth(key).outboundRefund += refund.amount;
    }

    for (const refund of dataset.inboundRefunds) {
      if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const key = this.monthKey(refund.createdAt);
      ensureMonth(key).inboundRefund += refund.amount;
    }

    const rows = Array.from(monthlyMap.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((item) => ({
        month: this.humanMonth(item.month),
        invoiced: this.round(item.invoiced),
        receivableCollected: this.round(item.receivableCollected),
        expensePaid: this.round(item.expensePaid),
        outboundRefund: this.round(item.outboundRefund),
        inboundRefund: this.round(item.inboundRefund),
        netCash: this.round(item.receivableCollected + item.inboundRefund - item.expensePaid - item.outboundRefund),
      }));

    return {
      columns: [
        this.textColumn('month', 'Month'),
        this.currencyColumn('invoiced', 'Invoiced'),
        this.currencyColumn('receivableCollected', 'Receivables Collected'),
        this.currencyColumn('expensePaid', 'Expenses Paid'),
        this.currencyColumn('outboundRefund', 'Outbound Refunds'),
        this.currencyColumn('inboundRefund', 'Inbound Refunds'),
        this.currencyColumn('netCash', 'Net Cash'),
      ],
      rows,
      meta: this.meta('monthly-income-expense', 'Monthly Income vs Expense', filters, {
        monthCount: rows.length,
        invoicedTotal: this.round(rows.reduce((sum, row) => sum + Number(row.invoiced || 0), 0)),
        netCashTotal: this.round(rows.reduce((sum, row) => sum + Number(row.netCash || 0), 0)),
      }),
    };
  }

  private buildRefundRegister(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows: ReportRow[] = [];

    for (const refund of dataset.outboundRefunds) {
      if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const booking = refund.bookingId ? dataset.bookingsById.get(refund.bookingId) : undefined;
      const customerId = refund.customerId || booking?.customerId;
      const customer = customerId ? dataset.customersById.get(customerId) : undefined;

      rows.push({
        date: refund.createdAt.toISOString(),
        direction: 'Outbound',
        type: 'Customer Refund',
        refNo: refund.receiptNo || refund.id,
        counterparty: customer?.name || 'Unknown Customer',
        bookingRef: booking?.pnrNo || booking?.id || '',
        paymentMode: refund.paymentMode,
        amount: refund.amount,
        notes: refund.notes || '',
      });
    }

    for (const refund of dataset.inboundRefunds) {
      if (!this.isWithinInterval(refund.createdAt, filters.startDate, filters.endDate)) {
        continue;
      }
      const vendor = refund.vendorId ? dataset.vendorsById.get(refund.vendorId) : undefined;
      rows.push({
        date: refund.createdAt.toISOString(),
        direction: 'Inbound',
        type: 'Vendor Refund',
        refNo: refund.receiptNo || refund.id,
        counterparty: vendor?.name || 'Unknown Vendor',
        bookingRef: '',
        paymentMode: refund.paymentMode,
        amount: refund.amount,
        notes: refund.notes || '',
      });
    }

    const searched = this.searchRows(rows, filters.search, ['refNo', 'counterparty', 'direction', 'type', 'notes']);
    searched.sort((left, right) => this.compareRows(left, right, 'date', filters.sortOrder));

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('direction', 'Direction'),
        this.textColumn('type', 'Type'),
        this.textColumn('refNo', 'Ref No'),
        this.textColumn('counterparty', 'Counterparty'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('paymentMode', 'Payment Mode'),
        this.currencyColumn('amount', 'Amount'),
        this.textColumn('notes', 'Notes'),
      ],
      rows: searched,
      meta: this.meta('refund-register', 'Refund Register', filters, {
        refundCount: searched.length,
        totalRefundAmount: this.round(searched.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
      }),
    };
  }

  private buildBookingRegister(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows = dataset.bookings
      .filter((booking) => this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true))
      .filter((booking) => {
        if (filters.pendingOnly) {
          return this.getBookingFinancials(booking, dataset).dueAmount > 0;
        }
        return true;
      })
      .map((booking) => {
        const customer = dataset.customersById.get(booking.customerId);
        const vendor = booking.vendorId ? dataset.vendorsById.get(booking.vendorId) : undefined;
        const financials = this.getBookingFinancials(booking, dataset);
        return {
          bookingDate: booking.bookingDate.toISOString(),
          bookingRef: booking.pnrNo || booking.id,
          customer: customer?.name || 'Unknown Customer',
          vendor: vendor?.name || '',
          productService: this.resolveProductServiceLabel(booking),
          status: booking.status,
          paxCount: booking.paxCount,
          totalAmount: booking.totalAmount,
          paidAmount: financials.paidAmount,
          dueAmount: financials.dueAmount,
          travelStart: booking.travelStartAt ? booking.travelStartAt.toISOString() : '',
          travelEnd: booking.travelEndAt ? booking.travelEndAt.toISOString() : '',
        };
      });

    const searched = this.searchRows(rows, filters.search, ['bookingRef', 'customer', 'vendor', 'productService', 'status']);
    searched.sort((left, right) => this.compareRows(left, right, 'bookingDate', filters.sortOrder));

    return {
      columns: [
        this.dateColumn('bookingDate', 'Booking Date'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('customer', 'Customer'),
        this.textColumn('vendor', 'Vendor'),
        this.textColumn('productService', 'Product/Service'),
        this.textColumn('status', 'Status'),
        this.numberColumn('paxCount', 'PAX'),
        this.currencyColumn('totalAmount', 'Total Amount'),
        this.currencyColumn('paidAmount', 'Paid Amount'),
        this.currencyColumn('dueAmount', 'Due Amount'),
        this.dateColumn('travelStart', 'Travel Start'),
        this.dateColumn('travelEnd', 'Travel End'),
      ],
      rows: searched,
      meta: this.meta('booking-register', 'Booking Register', filters, {
        bookingCount: searched.length,
        totalAmount: this.round(searched.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)),
        totalDue: this.round(searched.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0)),
      }),
    };
  }

  private buildGstView(dataset: BaseDataset, filters: ReportQueryFilters): ReportResult {
    const rows = dataset.bookings
      .filter((booking) => this.isInvoiceEligibleBooking(booking))
      .filter((booking) => this.isWithinInterval(booking.bookingDate, filters.startDate, filters.endDate))
      .filter((booking) => (filters.customerIds.length ? filters.customerIds.includes(booking.customerId) : true))
      .map((booking) => {
        const customer = dataset.customersById.get(booking.customerId);
        return {
          date: booking.bookingDate.toISOString(),
          bookingRef: booking.pnrNo || booking.id,
          customer: customer?.name || 'Unknown Customer',
          taxableValue: booking.totalAmount,
          cgst: null,
          sgst: null,
          igst: null,
          totalTax: null,
          totalAmount: booking.totalAmount,
        };
      });

    return {
      columns: [
        this.dateColumn('date', 'Date'),
        this.textColumn('bookingRef', 'Booking Ref'),
        this.textColumn('customer', 'Customer'),
        this.currencyColumn('taxableValue', 'Taxable Value'),
        this.currencyColumn('cgst', 'CGST'),
        this.currencyColumn('sgst', 'SGST'),
        this.currencyColumn('igst', 'IGST'),
        this.currencyColumn('totalTax', 'Total Tax'),
        this.currencyColumn('totalAmount', 'Total Amount'),
      ],
      rows,
      meta: this.meta('gst-view', 'GST / Tax View (Derived)', filters, {
        rowCount: rows.length,
        totalAmount: this.round(rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)),
      }, [
        'Travox schema does not currently store canonical booking-line tax rates or GST split fields.',
        'This view is derived and intentionally leaves legal-grade GST ledger fields blank.',
      ]),
    };
  }

  private getFilteredCustomerEvents(
    dataset: BaseDataset,
    filters: ReportQueryFilters,
    options: {
      includeInvoices: boolean;
      includePayments: boolean;
      includeRefunds: boolean;
      includeDateFilter: boolean;
      usePendingOnlyFilter: boolean;
    }
  ): CustomerTimelineEvent[] {
    const events = this.createCustomerEvents(dataset);

    const pendingBookingIds = new Set(
      dataset.bookings
        .filter((booking) => this.getBookingFinancials(booking, dataset).dueAmount > 0)
        .map((booking) => booking.id)
    );

    const filtered = events.filter((event) => {
      if (!options.includeInvoices && event.sourceType === 'BOOKING') {
        return false;
      }
      if (!options.includePayments && event.sourceType === 'RECEIVABLE') {
        return false;
      }
      if (!options.includeRefunds && event.sourceType === 'REFUND_OUTBOUND') {
        return false;
      }

      if (options.includeDateFilter && !this.isWithinInterval(event.date, filters.startDate, filters.endDate)) {
        return false;
      }

      if (filters.customerIds.length > 0 && !filters.customerIds.includes(event.customerId)) {
        return false;
      }

      if (filters.bookingId && event.bookingId !== filters.bookingId) {
        return false;
      }

      if (filters.transactionTypes.length > 0) {
        const txCode = event.transactionCode.toUpperCase();
        const matched = filters.transactionTypes.some((type) => type.toUpperCase() === txCode);
        if (!matched) {
          return false;
        }
      }

      if (filters.paymentModes.length > 0 && event.paymentMode) {
        if (!filters.paymentModes.includes(event.paymentMode)) {
          return false;
        }
      }

      if (options.usePendingOnlyFilter && filters.pendingOnly) {
        if (event.sourceType === 'BOOKING') {
          const booking = event.bookingId ? dataset.bookingsById.get(event.bookingId) : undefined;
          if (!booking || this.getBookingFinancials(booking, dataset).dueAmount <= 0) {
            return false;
          }
        } else if (event.bookingId && !pendingBookingIds.has(event.bookingId)) {
          return false;
        }
      }

      if (!filters.search) {
        return true;
      }

      const search = filters.search.toLowerCase();
      return (
        event.customerName.toLowerCase().includes(search) ||
        event.refNo.toLowerCase().includes(search) ||
        (event.bookingRef || '').toLowerCase().includes(search) ||
        event.productService.toLowerCase().includes(search) ||
        event.memo.toLowerCase().includes(search) ||
        (event.notes || '').toLowerCase().includes(search)
      );
    });

    return filtered.sort((left, right) => this.compareCustomerEvents(left, right, filters.sortBy || 'date', filters.sortOrder));
  }

  private createCustomerEvents(dataset: BaseDataset): CustomerTimelineEvent[] {
    const events: CustomerTimelineEvent[] = [];

    for (const booking of dataset.bookings) {
      if (!this.isInvoiceEligibleBooking(booking)) {
        continue;
      }

      const customer = dataset.customersById.get(booking.customerId);
      const qty = booking.paxCount > 0 ? booking.paxCount : undefined;
      const unitPrice = qty && qty > 0 ? this.round(booking.totalAmount / qty) : undefined;
      const financials = this.getBookingFinancials(booking, dataset);

      events.push({
        id: `booking:${booking.id}`,
        sourceId: booking.id,
        sourceType: 'BOOKING',
        customerId: booking.customerId,
        customerName: customer?.name || 'Unknown Customer',
        date: booking.bookingDate,
        createdAt: booking.createdAt,
        transactionType: 'Invoice',
        transactionCode: 'INVOICE',
        refNo: booking.pnrNo || booking.id,
        bookingId: booking.id,
        bookingRef: booking.pnrNo || booking.id,
        productService: this.resolveProductServiceLabel(booking),
        memo: booking.packageName || booking.primaryPaxName || 'Booking charge',
        qty,
        unitPrice,
        amount: booking.totalAmount,
        signedAmount: booking.totalAmount,
      });

      if (financials.missingPaymentAmount > 0) {
        events.push({
          id: `booking-paid:${booking.id}`,
          sourceId: booking.id,
          sourceType: 'RECEIVABLE',
          customerId: booking.customerId,
          customerName: customer?.name || 'Unknown Customer',
          date: booking.bookingDate,
          createdAt: booking.createdAt,
          transactionType: 'Payment',
          transactionCode: 'PAYMENT',
          refNo: booking.pnrNo || booking.id,
          bookingId: booking.id,
          bookingRef: booking.pnrNo || booking.id,
          productService: this.resolveProductServiceLabel(booking),
          memo: 'Recorded advance/payment on booking',
          amount: financials.missingPaymentAmount,
          signedAmount: -financials.missingPaymentAmount,
          notes: 'Derived from booking paid amount because no matching payment row exists',
        });
      }
    }

    for (const payment of dataset.receivables) {
      const booking = payment.bookingId ? dataset.bookingsById.get(payment.bookingId) : undefined;
      const customerId = payment.customerId || booking?.customerId;
      if (!customerId) {
        continue;
      }

      const customer = dataset.customersById.get(customerId);
      events.push({
        id: `receivable:${payment.id}`,
        sourceId: payment.id,
        sourceType: 'RECEIVABLE',
        customerId,
        customerName: customer?.name || 'Unknown Customer',
        date: payment.createdAt,
        createdAt: payment.createdAt,
        transactionType: 'Payment',
        transactionCode: 'PAYMENT',
        refNo: payment.receiptNo || payment.id,
        bookingId: payment.bookingId,
        bookingRef: booking?.pnrNo || booking?.id || payment.bookingId,
        productService: booking ? this.resolveProductServiceLabel(booking) : 'Booking',
        memo: payment.notes || 'Receivable payment',
        amount: payment.amount,
        signedAmount: -payment.amount,
        paymentMode: payment.paymentMode,
        paymentType: payment.paymentType,
        notes: payment.notes,
      });
    }

    for (const refund of dataset.outboundRefunds) {
      const booking = refund.bookingId ? dataset.bookingsById.get(refund.bookingId) : undefined;
      const customerId = refund.customerId || booking?.customerId;
      if (!customerId) {
        continue;
      }

      const customer = dataset.customersById.get(customerId);
      events.push({
        id: `refund-out:${refund.id}`,
        sourceId: refund.id,
        sourceType: 'REFUND_OUTBOUND',
        customerId,
        customerName: customer?.name || 'Unknown Customer',
        date: refund.createdAt,
        createdAt: refund.createdAt,
        transactionType: 'Credit Memo',
        transactionCode: 'CREDIT_MEMO',
        refNo: refund.receiptNo || refund.id,
        bookingId: refund.bookingId,
        bookingRef: booking?.pnrNo || booking?.id || refund.bookingId,
        productService: booking ? this.resolveProductServiceLabel(booking) : 'Booking',
        memo: refund.notes || 'Outbound customer refund',
        amount: refund.amount,
        signedAmount: -refund.amount,
        paymentMode: refund.paymentMode,
        paymentType: refund.paymentType,
        notes: refund.notes,
      });
    }

    return events;
  }

  private getFilteredVendorEvents(dataset: BaseDataset, filters: ReportQueryFilters, includeDateFilter: boolean): VendorTimelineEvent[] {
    const events: VendorTimelineEvent[] = [];

    for (const expense of dataset.expenses) {
      if (!expense.vendorId) {
        continue;
      }
      const vendor = dataset.vendorsById.get(expense.vendorId);
      events.push({
        id: `expense:${expense.id}`,
        sourceId: expense.id,
        sourceType: 'EXPENSE',
        vendorId: expense.vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        date: expense.createdAt,
        createdAt: expense.createdAt,
        transactionType: 'Expense',
        transactionCode: 'EXPENSE',
        refNo: expense.receiptNo || expense.id,
        bookingId: expense.bookingId,
        amount: expense.amount,
        signedAmount: expense.amount,
        paymentMode: expense.paymentMode,
        notes: expense.notes,
      });
    }

    for (const refund of dataset.inboundRefunds) {
      if (!refund.vendorId) {
        continue;
      }
      const vendor = dataset.vendorsById.get(refund.vendorId);
      events.push({
        id: `refund-in:${refund.id}`,
        sourceId: refund.id,
        sourceType: 'REFUND_INBOUND',
        vendorId: refund.vendorId,
        vendorName: vendor?.name || 'Unknown Vendor',
        date: refund.createdAt,
        createdAt: refund.createdAt,
        transactionType: 'Vendor Refund',
        transactionCode: 'REFUND_INBOUND',
        refNo: refund.receiptNo || refund.id,
        amount: refund.amount,
        signedAmount: -refund.amount,
        paymentMode: refund.paymentMode,
        notes: refund.notes,
      });
    }

    return events
      .filter((event) => {
        if (includeDateFilter && !this.isWithinInterval(event.date, filters.startDate, filters.endDate)) {
          return false;
        }
        if (filters.vendorIds.length > 0 && !filters.vendorIds.includes(event.vendorId)) {
          return false;
        }
        if (filters.paymentModes.length > 0 && event.paymentMode && !filters.paymentModes.includes(event.paymentMode)) {
          return false;
        }
        if (!filters.search) {
          return true;
        }

        const search = filters.search.toLowerCase();
        return (
          event.vendorName.toLowerCase().includes(search) ||
          event.refNo.toLowerCase().includes(search) ||
          (event.notes || '').toLowerCase().includes(search)
        );
      })
      .sort((left, right) => this.compareVendorEvents(left, right, filters.sortBy || 'date', filters.sortOrder));
  }

  private groupCustomerEvents(events: CustomerTimelineEvent[]): Map<string, CustomerTimelineEvent[]> {
    const grouped = new Map<string, CustomerTimelineEvent[]>();
    for (const event of events) {
      const existing = grouped.get(event.customerId) || [];
      existing.push(event);
      grouped.set(event.customerId, existing);
    }

    grouped.forEach((groupEvents, customerId) => {
      const sorted = [...groupEvents].sort((left, right) => this.compareCustomerEvents(left, right, 'date', 'asc'));
      grouped.set(customerId, sorted);
    });

    return grouped;
  }

  private isInvoiceEligibleBooking(booking: Booking): boolean {
    return (
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.REFUNDED
    );
  }

  private resolveProductServiceLabel(booking: Booking): string {
    if (booking.modeOfJourney) {
      const modeLabel = JOURNEY_LABELS[booking.modeOfJourney.toUpperCase()];
      if (modeLabel) {
        return modeLabel;
      }
    }

    if (booking.packageName && booking.packageName.trim().length > 0) {
      return booking.packageName.trim();
    }

    if (booking.vendorId) {
      return SERVICE_TYPE_LABELS[ServiceType.OTHER];
    }

    return 'Booking';
  }

  private isWithinInterval(date: Date, startDate: Date, endDate: Date): boolean {
    return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
  }

  private compareCustomerEvents(
    left: CustomerTimelineEvent,
    right: CustomerTimelineEvent,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): number {
    let comparison = 0;

    if (sortBy === 'customer') {
      comparison = left.customerName.localeCompare(right.customerName);
    } else if (sortBy === 'amount') {
      comparison = left.signedAmount - right.signedAmount;
    } else {
      comparison = left.date.getTime() - right.date.getTime();
    }

    if (comparison === 0) {
      comparison = left.createdAt.getTime() - right.createdAt.getTime();
    }
    if (comparison === 0) {
      comparison = CUSTOMER_SOURCE_RANK[left.sourceType] - CUSTOMER_SOURCE_RANK[right.sourceType];
    }
    if (comparison === 0) {
      comparison = left.sourceId.localeCompare(right.sourceId);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  }

  private compareVendorEvents(
    left: VendorTimelineEvent,
    right: VendorTimelineEvent,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): number {
    let comparison = 0;

    if (sortBy === 'vendor') {
      comparison = left.vendorName.localeCompare(right.vendorName);
    } else if (sortBy === 'amount') {
      comparison = left.signedAmount - right.signedAmount;
    } else {
      comparison = left.date.getTime() - right.date.getTime();
    }

    if (comparison === 0) {
      comparison = left.createdAt.getTime() - right.createdAt.getTime();
    }
    if (comparison === 0) {
      comparison = VENDOR_SOURCE_RANK[left.sourceType] - VENDOR_SOURCE_RANK[right.sourceType];
    }
    if (comparison === 0) {
      comparison = left.sourceId.localeCompare(right.sourceId);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  }

  private compareRows(left: ReportRow, right: ReportRow, sortBy: string, sortOrder: 'asc' | 'desc'): number {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    let comparison = 0;
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      comparison = leftValue - rightValue;
    } else {
      comparison = String(leftValue || '').localeCompare(String(rightValue || ''));
    }

    if (comparison === 0) {
      const leftDate = String(left.date || left.bookingDate || left.paymentDate || '');
      const rightDate = String(right.date || right.bookingDate || right.paymentDate || '');
      comparison = leftDate.localeCompare(rightDate);
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  }

  private searchRows(rows: ReportRow[], search: string, keys: string[]): ReportRow[] {
    if (!search) {
      return rows;
    }
    const term = search.toLowerCase();
    return rows.filter((row) =>
      keys.some((key) => String(row[key] || '').toLowerCase().includes(term))
    );
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private humanMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    return parsed.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    });
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private meta(
    reportId: string,
    title: string,
    filters: ReportQueryFilters,
    totals: Record<string, number>,
    notes?: string[]
  ) {
    return {
      reportId,
      title,
      generatedAt: new Date().toISOString(),
      interval: {
        start: filters.startDate.toISOString(),
        end: filters.endDate.toISOString(),
      },
      totals,
      notes,
    };
  }

  private textColumn(key: string, label: string): ReportColumn {
    return { key, label, type: 'text', align: 'left' };
  }

  private dateColumn(key: string, label: string): ReportColumn {
    return { key, label, type: 'date', align: 'left' };
  }

  private currencyColumn(key: string, label: string): ReportColumn {
    return { key, label, type: 'currency', align: 'right' };
  }

  private numberColumn(key: string, label: string): ReportColumn {
    return { key, label, type: 'number', align: 'right' };
  }
}
