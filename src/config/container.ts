import { container } from 'tsyringe';
import { IUserRepository } from '../application/Repositories/IUserRepository';
import { UserRepositoryPg } from '../infrastructure/repositories/UserRepositoryPg';
import { IOTPService } from '../application/services/IOTPService';
import { OtpServiceRedis } from '../infrastructure/services/OtpServiceRedis';
import { JwtService } from '../infrastructure/services/JwtService';
import { RefreshTokenRepositoryPg } from '../infrastructure/repositories/RefreshTokenRepositoryPg';
import { IJwtService } from '../application/services/IJwtService';
import { IRefreshTokenRepository } from '../application/Repositories/IRefreshTokenRepository';

container.registerSingleton<IUserRepository>('IUserRepository', UserRepositoryPg);
container.registerSingleton<IOTPService>('IOTPService', OtpServiceRedis);

container.registerSingleton<IJwtService>('IJwtService', JwtService);
container.registerSingleton<IRefreshTokenRepository>('IRefreshTokenRepository', RefreshTokenRepositoryPg);
// Register other implementations
export { container };
