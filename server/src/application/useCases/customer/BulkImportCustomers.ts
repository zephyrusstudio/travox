import { injectable, inject } from 'tsyringe';
import { ICustomerRepository } from '../../repositories/ICustomerRepository';
import { Customer } from '../../../domain/Customer';
import { CreateAccount } from '../account/CreateAccount';
import { parseCSV } from '../../../utils/csvParser';

interface CustomerImportRow {
  'Customer full name': string;
  'Phone numbers': string;
  'Email': string;
  'Full name': string;
  'Bill address': string;
  'Ship address': string;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    data: Partial<CustomerImportRow>;
    error: string;
  }>;
  customers: Customer[];
}

const PLACEHOLDER_ACCOUNT_NO = '0000000000';
const PLACEHOLDER_IFSC = 'PLHR0000000';
const PLACEHOLDER_UPI = 'placeholder@upi';

@injectable()
export class BulkImportCustomers {
  private static readonly DEFAULT_EMAIL = 'esanchar@gmail.com';
  private static readonly DEFAULT_PHONE = '+91-9332100486';

  constructor(
    @inject('ICustomerRepository') private customerRepo: ICustomerRepository,
    @inject(CreateAccount) private createAccount: CreateAccount
  ) {}

  async execute(csvContent: string, orgId: string, createdBy: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
      customers: [],
    };

    try {
      // Parse CSV content
      const rows = parseCSV<CustomerImportRow>(csvContent, {
        skipEmptyLines: true,
        trimValues: true,
      });

      result.total = rows.length;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // +2 because: +1 for header, +1 for 1-based indexing

        try {
          // Extract customer name (prefer 'Customer full name', fallback to 'Full name')
          let name = row['Customer full name']?.trim() || row['Full name']?.trim();
          
          if (!name) {
            throw new Error('Customer name is required');
          }

          // Extract contact info
          let email = row['Email']?.trim();
          let phone = row['Phone numbers']?.trim();

          // Apply defaults if missing
          if (!email) {
            email = BulkImportCustomers.DEFAULT_EMAIL;
          }

          if (!phone) {
            phone = BulkImportCustomers.DEFAULT_PHONE;
          }

          // Check for duplicates (skip validation for default email/phone)
          if (email && email !== BulkImportCustomers.DEFAULT_EMAIL) {
            const existingByEmail = await this.customerRepo.findByEmail(email, orgId);
            if (existingByEmail) {
              throw new Error(`Customer with email "${email}" already exists`);
            }
          }

          if (phone && phone !== BulkImportCustomers.DEFAULT_PHONE) {
            const existingByPhone = await this.customerRepo.findByPhone(phone, orgId);
            if (existingByPhone) {
              throw new Error(`Customer with phone "${phone}" already exists`);
            }
          }

          // Create placeholder bank account for the customer
          const placeholderAccount = await this.createAccount.execute(
            {
              accountNo: PLACEHOLDER_ACCOUNT_NO,
              ifscCode: PLACEHOLDER_IFSC,
              upiId: PLACEHOLDER_UPI,
            },
            orgId,
            createdBy
          );

          // Create customer
          const customer = Customer.create(orgId, name, createdBy, {
            phone,
            email,
            accountId: placeholderAccount.id,
          });

          const savedCustomer = await this.customerRepo.create(customer, orgId);
          result.customers.push(savedCustomer);
          result.imported++;

        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            data: row,
            error: error.message || 'Unknown error',
          });
        }
      }

      // Set overall success flag
      result.success = result.failed === 0;

    } catch (error: any) {
      // CSV parsing or other critical error
      result.success = false;
      result.errors.push({
        row: 0,
        data: {},
        error: error.message || 'Failed to parse CSV file',
      });
    }

    return result;
  }
}
