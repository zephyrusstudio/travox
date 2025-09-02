import { container } from 'tsyringe';

// Core dependencies
import { IUserRepository } from '../application/repositories/IUserRepository';
import { UserRepositoryFirestore } from '../infrastructure/repositories/UserRepositoryFirestore';
import { JwtService } from '../infrastructure/services/JwtService';
import { RefreshTokenRepositoryFirestore } from '../infrastructure/repositories/RefreshTokenRepositoryFirestore';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/repositories/IRefreshTokenRepository';

// Google OIDC service
import { IGoogleOidcService } from '../application/services/IGoogleOidcService';
import { GoogleOidcService } from '../infrastructure/services/GoogleOidcService';

// TMS dependencies
import { IOrganizationRepository } from '../application/repositories/IOrganizationRepository';
import { OrganizationRepositoryFirestore } from '../infrastructure/repositories/OrganizationRepositoryFirestore';
import { ICustomerRepository } from '../application/repositories/ICustomerRepository';
import { CustomerRepositoryFirestore } from '../infrastructure/repositories/CustomerRepositoryFirestore';
import { IVendorRepository } from '../application/repositories/IVendorRepository';
import { VendorRepositoryFirestore } from '../infrastructure/repositories/VendorRepositoryFirestore';
import { IAuditLogRepository } from '../application/repositories/IAuditLogRepository';
import { AuditLogRepositoryFirestore } from '../infrastructure/repositories/AuditLogRepositoryFirestore';
import { IBookingRepository } from '../application/repositories/IBookingRepository';
import { BookingRepositoryFirestore } from '../infrastructure/repositories/BookingRepositoryFirestore';
import { IPaymentRepository } from '../application/repositories/IPaymentRepository';
import { PaymentRepositoryFirestore } from '../infrastructure/repositories/PaymentRepositoryFirestore';
import { IAccountRepository } from '../application/repositories/IAccountRepository';
import { AccountRepositoryFirestore } from '../infrastructure/repositories/AccountRepositoryFirestore';

// Register core services
container.registerSingleton<IUserRepository>('IUserRepository', UserRepositoryFirestore);
container.registerSingleton<IJwtService>('IJwtService', JwtService);
container.registerSingleton<IRefreshTokenRepository>('IRefreshTokenRepository', RefreshTokenRepositoryFirestore);

// Register Google OIDC service
container.registerSingleton<IGoogleOidcService>('IGoogleOidcService', GoogleOidcService);

// Register TMS services
container.registerSingleton<IOrganizationRepository>('IOrganizationRepository', OrganizationRepositoryFirestore);
container.registerSingleton<ICustomerRepository>('ICustomerRepository', CustomerRepositoryFirestore);
container.registerSingleton<IVendorRepository>('IVendorRepository', VendorRepositoryFirestore);
container.registerSingleton<IAuditLogRepository>('IAuditLogRepository', AuditLogRepositoryFirestore);
container.registerSingleton<IBookingRepository>('IBookingRepository', BookingRepositoryFirestore);
container.registerSingleton<IPaymentRepository>('IPaymentRepository', PaymentRepositoryFirestore);
container.registerSingleton<IAccountRepository>('IAccountRepository', AccountRepositoryFirestore);

export { container };
