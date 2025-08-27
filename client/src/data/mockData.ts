import { Customer, Vendor, Service, Booking, Payment, Expense, Refund, User, LogEntry } from '../types';

export const mockData = {
  customers: [
    {
      customer_id: '1',
      full_name: 'Rajesh Kumar Enterprises',
      email: 'rajesh@rkenterprises.com',
      phone: '+91 98765 43210',
      address: '1204, Business Tower, Bandra Kurla Complex, Mumbai 400051',
      passport_number: 'A1234567',
      gstin: '27AABCU9603R1ZX',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      customer_id: '2',
      full_name: 'Neha Kapoor',
      email: 'neha.kapoor@techcorp.in',
      phone: '+91 91234 56789',
      address: '456 Corporate Park, Cyber City, Gurgaon 122002',
      passport_number: 'B7654321',
      created_at: '2024-02-20T14:15:00Z'
    },
    {
      customer_id: '3',
      full_name: 'Amit Patel Industries',
      email: 'amit@patelindustries.com',
      phone: '+91 99887 76655',
      address: '789 Industrial Estate, Pune 411028',
      passport_number: 'C9876543',
      gstin: '27AABCU9603R1ZY',
      created_at: '2024-03-10T09:45:00Z'
    },
    {
      customer_id: '4',
      full_name: 'Priya Sharma',
      email: 'priya.sharma@globaltech.com',
      phone: '+91 88776 65544',
      address: '321 Tech Hub, Electronic City, Bangalore 560100',
      passport_number: 'D5432109',
      created_at: '2024-04-05T16:20:00Z'
    },
    {
      customer_id: '5',
      full_name: 'Vikram Singh Textiles',
      email: 'vikram@vstextiles.in',
      phone: '+91 77665 54433',
      address: '567 Textile Market, Ludhiana 141001',
      passport_number: 'E1098765',
      gstin: '03AABCU9603R1ZZ',
      created_at: '2024-05-12T11:30:00Z'
    },
    {
      customer_id: '6',
      full_name: 'Sunita Agarwal',
      email: 'sunita@agarwalgroup.com',
      phone: '+91 66554 43322',
      address: '890 Business District, Salt Lake, Kolkata 700091',
      passport_number: 'F6789012',
      created_at: '2024-06-18T13:45:00Z'
    },
    {
      customer_id: '7',
      full_name: 'Rohit Mehta Pharmaceuticals',
      email: 'rohit@mehtapharma.in',
      phone: '+91 55443 32211',
      address: '234 Pharma Complex, Ahmedabad 380015',
      passport_number: 'G3456789',
      gstin: '24AABCU9603R1ZA',
      created_at: '2024-07-22T08:15:00Z'
    },
    {
      customer_id: '8',
      full_name: 'Kavita Reddy',
      email: 'kavita.reddy@redconsulting.com',
      phone: '+91 44332 21100',
      address: '678 Consulting Plaza, Hyderabad 500032',
      passport_number: 'H7890123',
      created_at: '2024-08-30T10:00:00Z'
    }
  ] as Customer[],

  vendors: [
    {
      vendor_id: '1',
      vendor_name: 'Skyline International Airways',
      service_type: 'Flight',
      contact_person: 'Ankit Das',
      email: 'ankit@skylineairways.com',
      phone: '+91 98765 43210',
      bank_details: 'HDFC Bank - Account: 12345678901, IFSC: HDFC0001234'
    },
    {
      vendor_id: '2',
      vendor_name: 'VisaFast Global Services',
      service_type: 'Visa',
      contact_person: 'Priya Menon',
      email: 'priya@visafastglobal.com',
      phone: '+91 91234 56789',
      bank_details: 'ICICI Bank - Account: 98765432109, IFSC: ICIC0001234'
    },
    {
      vendor_id: '3',
      vendor_name: 'Grand Hospitality Hotels',
      service_type: 'Hotel',
      contact_person: 'Ravi Kumar',
      email: 'ravi@grandhospitality.com',
      phone: '+91 99887 76655',
      bank_details: 'SBI Bank - Account: 11223344556, IFSC: SBIN0001234'
    },
    {
      vendor_id: '4',
      vendor_name: 'Elite Transport Solutions',
      service_type: 'Transport',
      contact_person: 'Suresh Gupta',
      email: 'suresh@elitetransport.in',
      phone: '+91 88776 65544',
      bank_details: 'Axis Bank - Account: 55667788990, IFSC: UTIB0001234'
    },
    {
      vendor_id: '5',
      vendor_name: 'SecureTravel Insurance',
      service_type: 'Insurance',
      contact_person: 'Meera Joshi',
      email: 'meera@securetravel.com',
      phone: '+91 77665 54433',
      bank_details: 'Kotak Bank - Account: 99887766554, IFSC: KKBK0001234'
    },
    {
      vendor_id: '6',
      vendor_name: 'Digital Marketing Pro',
      service_type: 'Marketing',
      contact_person: 'Arjun Malhotra',
      email: 'arjun@digitalmarketingpro.in',
      phone: '+91 66554 43322',
      bank_details: 'HDFC Bank - Account: 44556677889, IFSC: HDFC0005678'
    },
    {
      vendor_id: '7',
      vendor_name: 'Office Essentials Ltd',
      service_type: 'Office',
      contact_person: 'Deepika Sharma',
      email: 'deepika@officeessentials.com',
      phone: '+91 55443 32211',
      bank_details: 'ICICI Bank - Account: 33445566778, IFSC: ICIC0005678'
    }
  ] as Vendor[],

  services: [
    {
      service_id: '1',
      service_name: 'Domestic Flight Booking',
      service_type: 'Flight',
      description: 'Comprehensive domestic flight booking services across India'
    },
    {
      service_id: '2',
      service_name: 'International Flight Booking',
      service_type: 'Flight',
      description: 'Global flight booking services with competitive rates'
    },
    {
      service_id: '3',
      service_name: 'Tourist Visa Processing',
      service_type: 'Visa',
      description: 'Fast-track tourist visa processing for all destinations'
    },
    {
      service_id: '4',
      service_name: 'Business Visa Processing',
      service_type: 'Visa',
      description: 'Expedited business visa services for corporate travelers'
    },
    {
      service_id: '5',
      service_name: 'Luxury Hotel Booking',
      service_type: 'Hotel',
      description: 'Premium hotel accommodations worldwide'
    },
    {
      service_id: '6',
      service_name: 'Budget Hotel Booking',
      service_type: 'Hotel',
      description: 'Affordable hotel options for budget-conscious travelers'
    },
    {
      service_id: '7',
      service_name: 'Airport Transfer Service',
      service_type: 'Transport',
      description: 'Reliable airport pickup and drop-off services'
    },
    {
      service_id: '8',
      service_name: 'Travel Insurance',
      service_type: 'Insurance',
      description: 'Comprehensive travel insurance coverage'
    }
  ] as Service[],

  bookings: [
    {
      booking_id: '1',
      customer_id: '1',
      customer_name: 'Rajesh Kumar Enterprises',
      package_name: 'European Business Tour - 15 Days',
      booking_date: '2024-11-10',
      travel_start_date: '2024-12-15',
      travel_end_date: '2024-12-30',
      pax_count: 4,
      total_amount: 450000,
      advance_received: 200000,
      balance_amount: 250000,
      status: 'confirmed'
    },
    {
      booking_id: '2',
      customer_id: '2',
      customer_name: 'Neha Kapoor',
      package_name: 'Singapore Corporate Retreat',
      booking_date: '2024-11-15',
      travel_start_date: '2024-12-20',
      travel_end_date: '2024-12-25',
      pax_count: 8,
      total_amount: 320000,
      advance_received: 150000,
      balance_amount: 170000,
      status: 'confirmed'
    },
    {
      booking_id: '3',
      customer_id: '3',
      customer_name: 'Amit Patel Industries',
      package_name: 'Dubai Trade Fair Package',
      booking_date: '2024-11-20',
      travel_start_date: '2024-12-10',
      travel_end_date: '2024-12-17',
      pax_count: 6,
      total_amount: 280000,
      advance_received: 0,
      balance_amount: 280000,
      status: 'pending'
    },
    {
      booking_id: '4',
      customer_id: '4',
      customer_name: 'Priya Sharma',
      package_name: 'Japan Technology Summit',
      booking_date: '2024-11-25',
      travel_start_date: '2024-12-05',
      travel_end_date: '2024-12-12',
      pax_count: 3,
      total_amount: 380000,
      advance_received: 190000,
      balance_amount: 190000,
      status: 'confirmed'
    },
    {
      booking_id: '5',
      customer_id: '5',
      customer_name: 'Vikram Singh Textiles',
      package_name: 'China Manufacturing Expo',
      booking_date: '2024-11-28',
      travel_start_date: '2024-12-18',
      travel_end_date: '2024-12-23',
      pax_count: 5,
      total_amount: 250000,
      advance_received: 100000,
      balance_amount: 150000,
      status: 'confirmed'
    },
    {
      booking_id: '6',
      customer_id: '6',
      customer_name: 'Sunita Agarwal',
      package_name: 'Thailand Beach Resort Conference',
      booking_date: '2024-12-01',
      travel_start_date: '2024-12-22',
      travel_end_date: '2024-12-28',
      pax_count: 10,
      total_amount: 420000,
      advance_received: 210000,
      balance_amount: 210000,
      status: 'confirmed'
    },
    {
      booking_id: '7',
      customer_id: '7',
      customer_name: 'Rohit Mehta Pharmaceuticals',
      package_name: 'Switzerland Pharma Conference',
      booking_date: '2024-12-03',
      travel_start_date: '2024-12-25',
      travel_end_date: '2025-01-02',
      pax_count: 7,
      total_amount: 520000,
      advance_received: 260000,
      balance_amount: 260000,
      status: 'confirmed'
    },
    {
      booking_id: '8',
      customer_id: '8',
      customer_name: 'Kavita Reddy',
      package_name: 'Australia Mining Summit',
      booking_date: '2024-12-05',
      travel_start_date: '2025-01-15',
      travel_end_date: '2025-01-22',
      pax_count: 4,
      total_amount: 360000,
      advance_received: 0,
      balance_amount: 360000,
      status: 'pending'
    }
  ] as Booking[],

  payments: [
    {
      payment_id: '1',
      booking_id: '1',
      payment_date: '2024-11-12',
      amount: 100000,
      payment_mode: 'bank_transfer',
      receipt_number: 'RCPT2024001',
      notes: 'Initial advance payment for European tour'
    },
    {
      payment_id: '2',
      booking_id: '1',
      payment_date: '2024-11-20',
      amount: 100000,
      payment_mode: 'upi',
      receipt_number: 'RCPT2024002',
      notes: 'Second installment payment'
    },
    {
      payment_id: '3',
      booking_id: '2',
      payment_date: '2024-11-16',
      amount: 150000,
      payment_mode: 'credit_card',
      receipt_number: 'RCPT2024003',
      notes: 'Advance payment for Singapore retreat'
    },
    {
      payment_id: '4',
      booking_id: '4',
      payment_date: '2024-11-26',
      amount: 190000,
      payment_mode: 'bank_transfer',
      receipt_number: 'RCPT2024004',
      notes: 'Full advance for Japan summit'
    },
    {
      payment_id: '5',
      booking_id: '5',
      payment_date: '2024-11-30',
      amount: 100000,
      payment_mode: 'cash',
      receipt_number: 'RCPT2024005',
      notes: 'Partial payment for China expo'
    },
    {
      payment_id: '6',
      booking_id: '6',
      payment_date: '2024-12-02',
      amount: 210000,
      payment_mode: 'bank_transfer',
      receipt_number: 'RCPT2024006',
      notes: 'Advance for Thailand conference'
    },
    {
      payment_id: '7',
      booking_id: '7',
      payment_date: '2024-12-04',
      amount: 260000,
      payment_mode: 'upi',
      receipt_number: 'RCPT2024007',
      notes: 'Advance for Switzerland conference'
    }
  ] as Payment[],

  expenses: [
    {
      expense_id: '1',
      date: '2024-11-13',
      vendor_id: '1',
      vendor_name: 'Skyline International Airways',
      booking_id: '1',
      category: 'Flight',
      amount: 180000,
      description: 'Business class flights to Europe for 4 passengers',
      payment_mode: 'Bank Transfer',
      invoice_number: 'SKY-2024-001'
    },
    {
      expense_id: '2',
      date: '2024-11-14',
      vendor_id: '2',
      vendor_name: 'VisaFast Global Services',
      booking_id: '1',
      category: 'Visa',
      amount: 32000,
      description: 'Schengen visa processing for 4 passengers',
      payment_mode: 'UPI',
      invoice_number: 'VFS-2024-001'
    },
    {
      expense_id: '3',
      date: '2024-11-15',
      vendor_id: '3',
      vendor_name: 'Grand Hospitality Hotels',
      booking_id: '1',
      category: 'Hotel',
      amount: 120000,
      description: '15 nights accommodation in premium hotels',
      payment_mode: 'Credit Card',
      invoice_number: 'GHH-2024-001'
    },
    {
      expense_id: '4',
      date: '2024-11-17',
      vendor_id: '1',
      vendor_name: 'Skyline International Airways',
      booking_id: '2',
      category: 'Flight',
      amount: 96000,
      description: 'Economy flights to Singapore for 8 passengers',
      payment_mode: 'Bank Transfer',
      invoice_number: 'SKY-2024-002'
    },
    {
      expense_id: '5',
      date: '2024-11-18',
      vendor_id: '5',
      vendor_name: 'SecureTravel Insurance',
      booking_id: '2',
      category: 'Insurance',
      amount: 12000,
      description: 'Travel insurance for Singapore trip',
      payment_mode: 'UPI',
      invoice_number: 'STI-2024-001'
    },
    {
      expense_id: '6',
      date: '2024-11-20',
      vendor_id: '6',
      vendor_name: 'Digital Marketing Pro',
      category: 'Marketing',
      amount: 25000,
      description: 'Social media advertising campaign',
      payment_mode: 'Bank Transfer',
      invoice_number: 'DMP-2024-001'
    },
    {
      expense_id: '7',
      date: '2024-11-22',
      vendor_id: '7',
      vendor_name: 'Office Essentials Ltd',
      category: 'Office',
      amount: 15000,
      description: 'Office supplies and stationery',
      payment_mode: 'Cash',
      invoice_number: 'OEL-2024-001'
    },
    {
      expense_id: '8',
      date: '2024-11-25',
      vendor_id: '4',
      vendor_name: 'Elite Transport Solutions',
      booking_id: '4',
      category: 'Transport',
      amount: 18000,
      description: 'Airport transfers and local transport in Japan',
      payment_mode: 'UPI',
      invoice_number: 'ETS-2024-001'
    },
    {
      expense_id: '9',
      date: '2024-11-28',
      vendor_id: '1',
      vendor_name: 'Skyline International Airways',
      booking_id: '5',
      category: 'Flight',
      amount: 85000,
      description: 'Flights to China for manufacturing expo',
      payment_mode: 'Bank Transfer',
      invoice_number: 'SKY-2024-003'
    },
    {
      expense_id: '10',
      date: '2024-12-01',
      vendor_id: '3',
      vendor_name: 'Grand Hospitality Hotels',
      booking_id: '6',
      category: 'Hotel',
      amount: 140000,
      description: 'Beach resort accommodation in Thailand',
      payment_mode: 'Credit Card',
      invoice_number: 'GHH-2024-002'
    }
  ] as Expense[],

  refunds: [
    {
      refund_id: '1',
      booking_id: '2',
      refund_date: '2024-11-22',
      refund_amount: 20000,
      refund_reason: 'Partial cancellation - 2 participants unable to travel',
      refund_mode: 'Bank Transfer'
    },
    {
      refund_id: '2',
      booking_id: '5',
      refund_date: '2024-12-02',
      refund_amount: 15000,
      refund_reason: 'Hotel downgrade requested by client',
      refund_mode: 'UPI'
    }
  ] as Refund[],

  users: [
    {
      user_id: '1',
      username: 'admin',
      email: 'admin@travelfinance.com',
      role: 'admin'
    },
    {
      user_id: '2',
      username: 'sarah.manager',
      email: 'sarah@travelfinance.com',
      role: 'manager'
    },
    {
      user_id: '3',
      username: 'john.accountant',
      email: 'john@travelfinance.com',
      role: 'accountant'
    },
    {
      user_id: '4',
      username: 'priya.operations',
      email: 'priya@travelfinance.com',
      role: 'manager'
    }
  ] as User[],

  logs: [
    {
      log_id: '1',
      user_id: '1',
      username: 'admin',
      action: 'CREATE',
      target: 'Customer: Rajesh Kumar Enterprises',
      timestamp: '2024-11-10T10:30:00Z'
    },
    {
      log_id: '2',
      user_id: '1',
      username: 'admin',
      action: 'CREATE',
      target: 'Booking: European Business Tour',
      timestamp: '2024-11-10T11:00:00Z'
    },
    {
      log_id: '3',
      user_id: '2',
      username: 'sarah.manager',
      action: 'CREATE',
      target: 'Payment: ₹100,000',
      timestamp: '2024-11-12T09:15:00Z'
    },
    {
      log_id: '4',
      user_id: '3',
      username: 'john.accountant',
      action: 'CREATE',
      target: 'Expense: ₹180,000',
      timestamp: '2024-11-13T14:20:00Z'
    },
    {
      log_id: '5',
      user_id: '2',
      username: 'sarah.manager',
      action: 'UPDATE',
      target: 'Booking: Singapore Corporate Retreat',
      timestamp: '2024-11-15T16:45:00Z'
    },
    {
      log_id: '6',
      user_id: '1',
      username: 'admin',
      action: 'CREATE',
      target: 'Customer: Neha Kapoor',
      timestamp: '2024-11-15T10:30:00Z'
    },
    {
      log_id: '7',
      user_id: '4',
      username: 'priya.operations',
      action: 'CREATE',
      target: 'Vendor: Elite Transport Solutions',
      timestamp: '2024-11-18T11:15:00Z'
    },
    {
      log_id: '8',
      user_id: '3',
      username: 'john.accountant',
      action: 'CREATE',
      target: 'Refund: ₹20,000',
      timestamp: '2024-11-22T13:30:00Z'
    },
    {
      log_id: '9',
      user_id: '2',
      username: 'sarah.manager',
      action: 'UPDATE',
      target: 'Customer: Amit Patel Industries',
      timestamp: '2024-11-25T15:20:00Z'
    },
    {
      log_id: '10',
      user_id: '1',
      username: 'admin',
      action: 'CREATE',
      target: 'Booking: Japan Technology Summit',
      timestamp: '2024-11-25T09:45:00Z'
    }
  ] as LogEntry[]
};