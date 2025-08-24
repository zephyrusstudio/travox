import { container } from 'tsyringe';

// Core dependencies
import { IUserRepository } from '../application/Repositories/IUserRepository';
import { UserRepositoryFirestore } from '../infrastructure/repositories/UserRepositoryFirestore';
import { JwtService } from '../infrastructure/services/JwtService';
import { RefreshTokenRepositoryFirestore } from '../infrastructure/repositories/RefreshTokenRepositoryFirestore';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/Repositories/IRefreshTokenRepository';

// Google OIDC service
import { IGoogleOidcService } from '../application/services/IGoogleOidcService';
import { GoogleOidcService } from '../infrastructure/services/GoogleOidcService';

// TMS dependencies
import { IOrganizationRepository } from '../application/Repositories/IOrganizationRepository';
import { OrganizationRepositoryFirestore } from '../infrastructure/repositories/OrganizationRepositoryFirestore';
import { ICustomerRepository } from '../application/Repositories/ICustomerRepository';
import { CustomerRepositoryFirestore } from '../infrastructure/repositories/CustomerRepositoryFirestore';
import { IVendorRepository } from '../application/Repositories/IVendorRepository';
import { VendorRepositoryFirestore } from '../infrastructure/repositories/VendorRepositoryFirestore';
import { IAuditLogRepository } from '../application/Repositories/IAuditLogRepository';
import { AuditLogRepositoryFirestore } from '../infrastructure/repositories/AuditLogRepositoryFirestore';
import { IBookingRepository } from '../application/Repositories/IBookingRepository';
import { BookingRepositoryFirestore } from '../infrastructure/repositories/BookingRepositoryFirestore';

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

export { container };
