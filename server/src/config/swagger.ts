import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travox API',
      version: '0.1.0',
      description: 'A comprehensive API for managing travel bookings, customers, vendors, and payments with AI-powered OCR capabilities',
      contact: {
        name: 'Travox Support',
        email: 'support@tms.com'
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Customers',
        description: 'Customer management operations'
      },
      {
        name: 'Vendors',
        description: 'Vendor management operations'
      },
      {
        name: 'Bookings',
        description: 'Booking management and operations'
      },
      {
        name: 'Payments',
        description: 'Payment processing and management'
      },
      {
        name: 'Files',
        description: 'File upload and management'
      },
      {
        name: 'OCR',
        description: 'AI-powered OCR for extracting booking data from travel documents'
      }
    ],
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      parameters: {
        unmask: {
          name: 'unmask',
          in: 'query',
          description: 'Set to true to receive unmasked sensitive data (requires proper authorization)',
          required: false,
          schema: {
            type: 'boolean',
            default: false
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'An error occurred'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            data: {
              type: 'object'
            }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'cust_123456'
            },
            orgId: {
              type: 'string',
              example: 'org_123'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              example: '+91 9876543210'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            passportNo: {
              type: 'string',
              example: 'A1XXXX67',
              description: 'Masked by default, use unmask=true to see full number'
            },
            aadhaarNo: {
              type: 'string',
              example: 'XXXX-XXXX-9012',
              description: 'Masked by default, use unmask=true to see full number'
            },
            visaNo: {
              type: 'string',
              example: 'V123456789'
            },
            gstin: {
              type: 'string',
              example: '12ABCDE3456F1Z5'
            },
            accountId: {
              type: 'string',
              example: 'acc_123'
            },
            totalBookings: {
              type: 'number',
              example: 5
            },
            totalSpent: {
              type: 'number',
              example: 250000
            },
            createdBy: {
              type: 'string',
              example: 'user_123'
            },
            updatedBy: {
              type: 'string',
              example: 'user_123'
            },
            isDeleted: {
              type: 'boolean',
              example: false
            },
            archivedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CreateCustomer: {
          type: 'object',
          required: ['name', 'phone'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              example: '+91 9876543210'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            passportNo: {
              type: 'string',
              example: 'A1234567'
            },
            aadhaarNo: {
              type: 'string',
              example: '1234-5678-9012'
            },
            visaNo: {
              type: 'string',
              example: 'V123456789'
            },
            gstin: {
              type: 'string',
              example: '12ABCDE3456F1Z5'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'user_123'
            },
            name: {
              type: 'string',
              example: 'Jane Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane@company.com'
            },
            phone: {
              type: 'string',
              example: '+91 9876543210'
            },
            role: {
              type: 'string',
              enum: ['OWNER', 'ADMIN'],
              example: 'ADMIN'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            preferences: {
              type: 'object',
              description: 'Hidden unless unmask=true is used',
              properties: {
                timezone: {
                  type: 'string',
                  example: 'Asia/Kolkata'
                },
                locale: {
                  type: 'string',
                  example: 'en-IN'
                },
                dateFormat: {
                  type: 'string',
                  example: 'DD/MM/YYYY'
                },
                theme: {
                  type: 'string',
                  enum: ['light', 'dark', 'auto'],
                  example: 'light'
                }
              }
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: 'Hidden unless unmask=true is used'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Vendor: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'vendor_123'
            },
            orgId: {
              type: 'string',
              example: 'org_123'
            },
            name: {
              type: 'string',
              example: 'ABC Travel Services'
            },
            serviceType: {
              type: 'string',
              enum: ['FLIGHT', 'HOTEL', 'TRANSPORT', 'VISA', 'INSURANCE', 'MARKETING', 'OFFICE', 'OTHER'],
              example: 'FLIGHT'
            },
            pocName: {
              type: 'string',
              example: 'Rajesh Kumar'
            },
            phone: {
              type: 'string',
              example: '+91 9876543210'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@abctravel.com'
            },
            gstin: {
              type: 'string',
              example: '12XXXX3456F1Z5',
              description: 'Masked by default, use unmask=true to see full GSTIN'
            },
            accountId: {
              type: 'string',
              example: 'acc_456'
            },
            totalExpense: {
              type: 'number',
              example: 150000
            },
            totalBookings: {
              type: 'number',
              example: 8
            },
            createdBy: {
              type: 'string',
              example: 'user_123'
            },
            updatedBy: {
              type: 'string',
              example: 'user_123'
            },
            isDeleted: {
              type: 'boolean',
              example: false
            },
            archivedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CreateVendor: {
          type: 'object',
          required: ['name', 'serviceType'],
          properties: {
            name: {
              type: 'string',
              example: 'ABC Travel Services'
            },
            serviceType: {
              type: 'string',
              enum: ['FLIGHT', 'HOTEL', 'TRANSPORT', 'VISA', 'INSURANCE', 'MARKETING', 'OFFICE', 'OTHER'],
              example: 'FLIGHT'
            },
            pocName: {
              type: 'string',
              example: 'Rajesh Kumar'
            },
            phone: {
              type: 'string',
              example: '+91 9876543210'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'contact@abctravel.com'
            },
            gstin: {
              type: 'string',
              example: '12ABCDE3456F1Z5'
            }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'payment_123456'
            },
            orgId: {
              type: 'string',
              example: 'org_123'
            },
            paymentType: {
              type: 'string',
              enum: ['RECEIVABLE', 'EXPENSE', 'INBOUND_REFUND', 'OUTBOUND_REFUND'],
              example: 'RECEIVABLE'
            },
            amount: {
              type: 'number',
              example: 25000
            },
            currency: {
              type: 'string',
              example: 'INR'
            },
            paymentMode: {
              type: 'string',
              enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CHEQUE', 'OTHER'],
              example: 'UPI'
            },
            bookingId: {
              type: 'string',
              example: 'booking_123456'
            },
            customerId: {
              type: 'string',
              example: 'cust_123456'
            },
            vendorId: {
              type: 'string',
              example: 'vendor_123456'
            },
            category: {
              type: 'string',
              example: 'booking_payment'
            },
            notes: {
              type: 'string',
              example: 'Advance payment for Dubai trip'
            },
            receiptNo: {
              type: 'string',
              example: 'RCP001'
            },
            fromAccountId: {
              type: 'string',
              example: 'acc_123'
            },
            toAccountId: {
              type: 'string',
              example: 'acc_456'
            },
            createdBy: {
              type: 'string',
              example: 'user_123'
            },
            updatedBy: {
              type: 'string',
              example: 'user_123'
            },
            isDeleted: {
              type: 'boolean',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        BookingPax: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'pax_123'
            },
            orgId: {
              type: 'string',
              example: 'org_123'
            },
            bookingId: {
              type: 'string',
              example: 'booking_123'
            },
            paxName: {
              type: 'string',
              example: 'John Doe'
            },
            paxType: {
              type: 'string',
              enum: ['ADULT', 'CHILD', 'INFANT'],
              example: 'ADULT'
            },
            passportNo: {
              type: 'string',
              example: 'A1XXXX67',
              description: 'Masked by default, use unmask=true to see full number'
            },
            dob: {
              type: 'string',
              format: 'date',
              example: '1990-01-15'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'booking_123'
            },
            orgId: {
              type: 'string',
              example: 'org_123'
            },
            customerId: {
              type: 'string',
              example: 'cust_123'
            },
            bookingDate: {
              type: 'string',
              format: 'date-time'
            },
            currency: {
              type: 'string',
              example: 'INR'
            },
            totalAmount: {
              type: 'number',
              example: 75000
            },
            paidAmount: {
              type: 'number',
              example: 25000
            },
            pax: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/BookingPax'
              }
            },
            itineraries: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            packageName: {
              type: 'string',
              example: 'Dubai Holiday Package'
            },
            pnrNo: {
              type: 'string',
              example: 'ABC123'
            },
            modeOfJourney: {
              type: 'string',
              example: 'FLIGHT'
            },
            advanceAmount: {
              type: 'number',
              example: 25000
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
              example: 'CONFIRMED'
            },
            paxCount: {
              type: 'number',
              example: 2
            },
            primaryPaxName: {
              type: 'string',
              example: 'John Doe'
            },
            travelStartAt: {
              type: 'string',
              format: 'date-time'
            },
            travelEndAt: {
              type: 'string',
              format: 'date-time'
            },
            dueAmount: {
              type: 'number',
              example: 50000
            },
            createdBy: {
              type: 'string',
              example: 'user_123'
            },
            updatedBy: {
              type: 'string',
              example: 'user_123'
            },
            isDeleted: {
              type: 'boolean',
              example: false
            },
            archivedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            },
            ticketId: {
              type: 'string',
              example: 'ticket_123'
            }
          }
        },
        File: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'file_123456'
            },
            org_id: {
              type: 'string',
              example: 'org_123'
            },
            name: {
              type: 'string',
              example: 'flight_ticket_dubai.pdf'
            },
            mime_type: {
              type: 'string',
              example: 'application/pdf'
            },
            size: {
              type: 'number',
              example: 2048576
            },
            kind: {
              type: 'string',
              enum: ['TICKET', 'DOCUMENT', 'IMAGE', 'OTHER'],
              example: 'TICKET'
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://drive.google.com/file/d/1ABC123DEF456/view'
            },
            uploaded_by: {
              type: 'string',
              example: 'user_123'
            },
            uploaded_at: {
              type: 'string',
              format: 'date-time'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        OCRExtractedBooking: {
          type: 'object',
          description: 'Booking data extracted from travel documents using OCR',
          properties: {
            packageName: {
              type: 'string',
              example: 'Dubai Holiday Package',
              description: 'Name of travel package or booking'
            },
            pnrNo: {
              type: 'string',
              example: 'ABC123DEF',
              description: 'PNR or booking reference number'
            },
            bookingDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
              description: 'Booking date in ISO format'
            },
            totalAmount: {
              type: 'number',
              example: 75000,
              description: 'Total booking amount'
            },
            currency: {
              type: 'string',
              example: 'INR',
              description: 'Currency code'
            },
            modeOfJourney: {
              type: 'string',
              example: 'FLIGHT',
              description: 'Primary travel mode'
            },
            pax: {
              type: 'array',
              description: 'Passenger information',
              items: {
                type: 'object',
                properties: {
                  paxName: {
                    type: 'string',
                    example: 'John Doe'
                  },
                  paxType: {
                    type: 'string',
                    enum: ['ADT', 'CHD', 'INF'],
                    example: 'ADT'
                  },
                  passportNo: {
                    type: 'string',
                    example: 'A1234567'
                  },
                  dob: {
                    type: 'string',
                    format: 'date',
                    example: '1990-01-15'
                  }
                }
              }
            },
            itineraries: {
              type: 'array',
              description: 'Travel itinerary information',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Dubai Trip - Outbound'
                  },
                  seqNo: {
                    type: 'integer',
                    example: 1
                  },
                  segments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        seqNo: {
                          type: 'integer',
                          example: 1
                        },
                        modeOfJourney: {
                          type: 'string',
                          enum: ['FLIGHT', 'TRAIN', 'BUS', 'HOTEL', 'CAB', 'OTHER'],
                          example: 'FLIGHT'
                        },
                        carrierCode: {
                          type: 'string',
                          example: 'EK'
                        },
                        serviceNumber: {
                          type: 'string',
                          example: 'EK512'
                        },
                        depCode: {
                          type: 'string',
                          example: 'DEL'
                        },
                        arrCode: {
                          type: 'string',
                          example: 'DXB'
                        },
                        depAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-02-15T14:30:00Z'
                        },
                        arrAt: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-02-15T18:45:00Z'
                        },
                        classCode: {
                          type: 'string',
                          example: 'Y'
                        },
                        baggage: {
                          type: 'string',
                          example: '30KG'
                        },
                        hotelName: {
                          type: 'string',
                          example: 'Burj Al Arab'
                        },
                        hotelAddress: {
                          type: 'string',
                          example: 'Jumeirah Beach Road, Dubai'
                        },
                        checkIn: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-02-15T15:00:00Z'
                        },
                        checkOut: {
                          type: 'string',
                          format: 'date-time',
                          example: '2024-02-20T12:00:00Z'
                        },
                        roomType: {
                          type: 'string',
                          example: 'Deluxe Suite'
                        },
                        mealPlan: {
                          type: 'string',
                          example: 'Half Board'
                        },
                        operatorName: {
                          type: 'string',
                          example: 'Dubai Tours LLC'
                        },
                        boardingPoint: {
                          type: 'string',
                          example: 'Hotel Lobby'
                        },
                        dropPoint: {
                          type: 'string',
                          example: 'Dubai Mall'
                        },
                        misc: {
                          type: 'object',
                          description: 'Additional segment data'
                        }
                      }
                    }
                  }
                }
              }
            },
            vendorInfo: {
              type: 'object',
              description: 'Vendor/agency information',
              properties: {
                name: {
                  type: 'string',
                  example: 'Travel Agency XYZ'
                },
                contact: {
                  type: 'string',
                  example: '+91 9876543210'
                },
                email: {
                  type: 'string',
                  example: 'info@travelagency.com'
                }
              }
            },
            extractionConfidence: {
              type: 'string',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
              example: 'HIGH',
              description: 'Confidence level of OCR extraction'
            },
            extractedFields: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['paxName', 'pnrNo', 'flightNumber', 'departureDate'],
              description: 'List of successfully extracted field names'
            },
            notes: {
              type: 'string',
              example: 'All passenger and flight details extracted successfully',
              description: 'Additional notes or warnings from OCR'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/api/routes/*.ts',
    './src/api/controllers/*.ts',
    './src/swagger/*.ts'
  ]
};

const specs = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'Travox API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper .download-url-wrapper { display: none }
      .swagger-ui .topbar { background-color: #2c3e50 }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));
}

export { specs };