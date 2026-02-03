import { container } from 'tsyringe';

// Core dependencies
import { IUserRepository } from '../application/repositories/IUserRepository';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/repositories/IRefreshTokenRepository';
import { JwtService } from '../infrastructure/services/JwtService';

// Google OIDC service
import { IGoogleOidcService } from '../application/services/IGoogleOidcService';
import { GoogleOidcService } from '../infrastructure/services/GoogleOidcService';

// Google Drive service
import { IGoogleDriveService } from '../application/services/IGoogleDriveService';
import { GoogleDriveService } from '../infrastructure/services/GoogleDriveService';

// Redis service
import { RedisService } from '../infrastructure/services/RedisService';

// TMS repository interfaces
import { IOrganizationRepository } from '../application/repositories/IOrganizationRepository';
import { ICustomerRepository } from '../application/repositories/ICustomerRepository';
import { IVendorRepository } from '../application/repositories/IVendorRepository';
import { IAuditLogRepository } from '../application/repositories/IAuditLogRepository';
import { IBookingRepository } from '../application/repositories/IBookingRepository';
import { IPaymentRepository } from '../application/repositories/IPaymentRepository';
import { IAccountRepository } from '../application/repositories/IAccountRepository';
import { IFileRepository } from '../application/repositories/IFileRepository';

// MongoDB repository implementations
import {
  OrganizationRepositoryMongo,
  UserRepositoryMongo,
  CustomerRepositoryMongo,
  VendorRepositoryMongo,
  AccountRepositoryMongo,
  PaymentRepositoryMongo,
  AuditLogRepositoryMongo,
  BookingRepositoryMongo,
  FileRepositoryMongo,
  RefreshTokenRepositoryMongo,
  CachedCustomerRepositoryMongo,
  CachedVendorRepositoryMongo,
  CachedBookingRepositoryMongo,
  CachedPaymentRepositoryMongo,
  CachedAccountRepositoryMongo,
  CachedUserRepositoryMongo,
} from '../infrastructure/repositories/mongodb';

// Register core services
container.registerSingleton<IJwtService>('IJwtService', JwtService);

// Register Google OIDC service
container.registerSingleton<IGoogleOidcService>('IGoogleOidcService', GoogleOidcService);

// Register Google Drive service
container.registerSingleton<IGoogleDriveService>('IGoogleDriveService', GoogleDriveService);

// Register Redis service
container.registerSingleton<RedisService>('RedisService', RedisService);

// Register TMS services
container.registerSingleton<IOrganizationRepository>('IOrganizationRepository', OrganizationRepositoryMongo);

// Register base MongoDB repositories for cached repos to use
container.registerSingleton<CustomerRepositoryMongo>('CustomerRepositoryMongo', CustomerRepositoryMongo);
container.registerSingleton<BookingRepositoryMongo>('BookingRepositoryMongo', BookingRepositoryMongo);
container.registerSingleton<VendorRepositoryMongo>('VendorRepositoryMongo', VendorRepositoryMongo);
container.registerSingleton<PaymentRepositoryMongo>('PaymentRepositoryMongo', PaymentRepositoryMongo);
container.registerSingleton<AccountRepositoryMongo>('AccountRepositoryMongo', AccountRepositoryMongo);
container.registerSingleton<UserRepositoryMongo>('UserRepositoryMongo', UserRepositoryMongo);

// Register cached repositories (with Redis)
container.registerSingleton<ICustomerRepository>('ICustomerRepository', CachedCustomerRepositoryMongo);
container.registerSingleton<IBookingRepository>('IBookingRepository', CachedBookingRepositoryMongo);
container.registerSingleton<IVendorRepository>('IVendorRepository', CachedVendorRepositoryMongo);
container.registerSingleton<IPaymentRepository>('IPaymentRepository', CachedPaymentRepositoryMongo);
container.registerSingleton<IAccountRepository>('IAccountRepository', CachedAccountRepositoryMongo);
container.registerSingleton<IUserRepository>('IUserRepository', CachedUserRepositoryMongo);

// Register non-cached repositories
container.registerSingleton<IAuditLogRepository>('IAuditLogRepository', AuditLogRepositoryMongo);
container.registerSingleton<IFileRepository>('IFileRepository', FileRepositoryMongo);
container.registerSingleton<IRefreshTokenRepository>('IRefreshTokenRepository', RefreshTokenRepositoryMongo);

export { container };
