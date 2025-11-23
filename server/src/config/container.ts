import { container } from 'tsyringe';
import { Firestore } from 'firebase-admin/firestore';
import path from 'path';
import { firestore as adminFirestore } from '../config/firestore';

// Core dependencies
import { IUserRepository } from '../application/repositories/IUserRepository';
import { UserRepositoryFirestore } from '../infrastructure/repositories/UserRepositoryFirestore';
import { CachedUserRepository } from '../infrastructure/repositories/CachedUserRepository';
import { JwtService } from '../infrastructure/services/JwtService';
import { RefreshTokenRepositoryFirestore } from '../infrastructure/repositories/RefreshTokenRepositoryFirestore';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/repositories/IRefreshTokenRepository';

// Google OIDC service
import { IGoogleOidcService } from '../application/services/IGoogleOidcService';
import { GoogleOidcService } from '../infrastructure/services/GoogleOidcService';

// Google Drive service
import { IGoogleDriveService } from '../application/services/IGoogleDriveService';
import { GoogleDriveService } from '../infrastructure/services/GoogleDriveService';

// TMS dependencies
import { IOrganizationRepository } from '../application/repositories/IOrganizationRepository';
import { OrganizationRepositoryFirestore } from '../infrastructure/repositories/OrganizationRepositoryFirestore';
import { ICustomerRepository } from '../application/repositories/ICustomerRepository';
import { CustomerRepositoryFirestore } from '../infrastructure/repositories/CustomerRepositoryFirestore';
import { CachedCustomerRepository } from '../infrastructure/repositories/CachedCustomerRepository';
import { IVendorRepository } from '../application/repositories/IVendorRepository';
import { VendorRepositoryFirestore } from '../infrastructure/repositories/VendorRepositoryFirestore';
import { CachedVendorRepository } from '../infrastructure/repositories/CachedVendorRepository';
import { IAuditLogRepository } from '../application/repositories/IAuditLogRepository';
import { AuditLogRepositoryFirestore } from '../infrastructure/repositories/AuditLogRepositoryFirestore';
import { IBookingRepository } from '../application/repositories/IBookingRepository';
import { BookingRepositoryFirestore } from '../infrastructure/repositories/BookingRepositoryFirestore';
import { CachedBookingRepository } from '../infrastructure/repositories/CachedBookingRepository';
import { IPaymentRepository } from '../application/repositories/IPaymentRepository';
import { PaymentRepositoryFirestore } from '../infrastructure/repositories/PaymentRepositoryFirestore';
import { CachedPaymentRepository } from '../infrastructure/repositories/CachedPaymentRepository';
import { IAccountRepository } from '../application/repositories/IAccountRepository';
import { AccountRepositoryFirestore } from '../infrastructure/repositories/AccountRepositoryFirestore';
import { CachedAccountRepository } from '../infrastructure/repositories/CachedAccountRepository';
import { IFileRepository } from '../application/repositories/IFileRepository';
import { FileRepositoryFirestore } from '../infrastructure/repositories/FileRepositoryFirestore';

// Redis service
import { RedisService } from '../infrastructure/services/RedisService';

// Register Firestore instance
container.registerInstance<Firestore>('Firestore', adminFirestore);

// Register core services
container.registerSingleton<IUserRepository>('IUserRepository', UserRepositoryFirestore);
container.registerSingleton<IJwtService>('IJwtService', JwtService);
container.registerSingleton<IRefreshTokenRepository>('IRefreshTokenRepository', RefreshTokenRepositoryFirestore);

// Register Google OIDC service
container.registerSingleton<IGoogleOidcService>('IGoogleOidcService', GoogleOidcService);

// Register Google Drive service
container.registerSingleton<IGoogleDriveService>('IGoogleDriveService', GoogleDriveService);

// Register Redis service
container.registerSingleton<RedisService>('RedisService', RedisService);

// Register TMS services
container.registerSingleton<IOrganizationRepository>('IOrganizationRepository', OrganizationRepositoryFirestore);

// Register base Firestore repositories for cached repos to use
container.registerSingleton<CustomerRepositoryFirestore>('CustomerRepositoryFirestore', CustomerRepositoryFirestore);
container.registerSingleton<BookingRepositoryFirestore>('BookingRepositoryFirestore', BookingRepositoryFirestore);
container.registerSingleton<VendorRepositoryFirestore>('VendorRepositoryFirestore', VendorRepositoryFirestore);
container.registerSingleton<PaymentRepositoryFirestore>('PaymentRepositoryFirestore', PaymentRepositoryFirestore);
container.registerSingleton<AccountRepositoryFirestore>('AccountRepositoryFirestore', AccountRepositoryFirestore);
container.registerSingleton<UserRepositoryFirestore>('UserRepositoryFirestore', UserRepositoryFirestore);

// Register cached repositories (with Redis)
container.registerSingleton<ICustomerRepository>('ICustomerRepository', CachedCustomerRepository);
container.registerSingleton<IBookingRepository>('IBookingRepository', CachedBookingRepository);
container.registerSingleton<IVendorRepository>('IVendorRepository', CachedVendorRepository);
container.registerSingleton<IPaymentRepository>('IPaymentRepository', CachedPaymentRepository);
container.registerSingleton<IAccountRepository>('IAccountRepository', CachedAccountRepository);
container.registerSingleton<IUserRepository>('IUserRepository', CachedUserRepository);

// Register non-cached repositories
container.registerSingleton<IAuditLogRepository>('IAuditLogRepository', AuditLogRepositoryFirestore);
container.registerSingleton<IFileRepository>('IFileRepository', FileRepositoryFirestore);

export { container };
