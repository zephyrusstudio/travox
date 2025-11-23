import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../application/repositories/IUserRepository';
import { User } from '../../domain/User';
import { UserRepositoryFirestore } from './UserRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';

const COLLECTION_NAME = 'users';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedUserRepository implements IUserRepository {
  constructor(
    @inject('UserRepositoryFirestore') private baseRepo: UserRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(user: User): Promise<User> {
    const result = await this.baseRepo.create(user);
    
    // Invalidate org list caches if user has orgId
    if (user.orgId) {
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${user.orgId}:list*`);
    }
    
    return result;
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = `${COLLECTION_NAME}:id:${id}`;
    
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return this.rehydrateUser(cached);
    }

    const user = await this.baseRepo.findById(id);
    
    if (user) {
      await this.cache.set(cacheKey, user, ENTITY_TTL);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `${COLLECTION_NAME}:email:${email}`;
    
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return this.rehydrateUser(cached);
    }

    const user = await this.baseRepo.findByEmail(email);
    
    if (user) {
      await this.cache.set(cacheKey, user, ENTITY_TTL);
    }
    
    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const cacheKey = `${COLLECTION_NAME}:google:${googleId}`;
    
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return this.rehydrateUser(cached);
    }

    const user = await this.baseRepo.findByGoogleId(googleId);
    
    if (user) {
      await this.cache.set(cacheKey, user, ENTITY_TTL);
    }
    
    return user;
  }

  async findByOrganizationId(orgId: string, limit?: number, offset?: number): Promise<User[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit, offset });
    
    const cached = await this.cache.get<User[]>(cacheKey);
    if (cached) {
      return cached.map(u => this.rehydrateUser(u));
    }

    const users = await this.baseRepo.findByOrganizationId(orgId, limit, offset);
    
    if (users.length > 0) {
      await this.cache.set(cacheKey, users, LIST_TTL);
    }
    
    return users;
  }

  async countByOrganizationId(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countByOrganizationId(orgId);
    
    await this.cache.set(cacheKey, count, LIST_TTL);
    
    return count;
  }

  async update(user: User): Promise<User> {
    const result = await this.baseRepo.update(user);
    
    await this.invalidateUserCache(user.id, user.orgId);
    
    return result;
  }

  async delete(id: string): Promise<void> {
    // Get user before deleting to invalidate proper caches
    const user = await this.baseRepo.findById(id);
    
    await this.baseRepo.delete(id);
    
    if (user) {
      await this.invalidateUserCache(id, user.orgId);
    }
  }

  /**
   * Invalidate all caches related to a user
   */
  private async invalidateUserCache(id: string, orgId?: string): Promise<void> {
    await this.cache.delete(`${COLLECTION_NAME}:id:${id}`);
    
    if (orgId) {
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:count`);
    }
    
    // Invalidate email and google caches (we don't know which ones, so pattern match)
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:email:*`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:google:*`);
  }

  /**
   * IMPORTANT: Restores prototype chain so domain methods work after JSON deserialization
   */
  private rehydrateUser(data: any): User {
    return rehydrateObject<User>(data, User.prototype, COMMON_DATE_FIELDS.user);
  }
}
