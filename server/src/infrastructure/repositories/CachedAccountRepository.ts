import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../application/repositories/IAccountRepository';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../domain/Account';
import { AccountRepositoryFirestore } from './AccountRepositoryFirestore';
import { RedisService } from '../services/RedisService';
import { rehydrateObject, COMMON_DATE_FIELDS } from '../../utils/cacheRehydration';

const COLLECTION_NAME = 'accounts';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes
const STATS_TTL = 120; // 2 minutes

@injectable()
export class CachedAccountRepository implements IAccountRepository {
  constructor(
    @inject('AccountRepositoryFirestore') private baseRepo: AccountRepositoryFirestore,
    @inject('RedisService') private cache: RedisService
  ) {}

  async findById(id: string): Promise<Account | null> {
    const cacheKey = `${COLLECTION_NAME}:id:${id}`;
    
    const cached = await this.cache.get<Account>(cacheKey);
    if (cached) {
      return this.rehydrateAccount(cached);
    }

    const account = await this.baseRepo.findById(id);
    
    if (account) {
      await this.cache.set(cacheKey, account, ENTITY_TTL);
    }
    
    return account;
  }

  async findByOrgId(orgId: string, limit?: number, offset?: number): Promise<Account[]> {
    const cacheKey = this.cache.generateListKey(COLLECTION_NAME, orgId, { limit, offset });
    
    const cached = await this.cache.get<Account[]>(cacheKey);
    if (cached) {
      return cached.map(a => this.rehydrateAccount(a));
    }

    const accounts = await this.baseRepo.findByOrgId(orgId, limit, offset);
    
    if (accounts.length > 0) {
      await this.cache.set(cacheKey, accounts, LIST_TTL);
    }
    
    return accounts;
  }

  async countByOrgId(orgId: string): Promise<number> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:count`;
    
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const count = await this.baseRepo.countByOrgId(orgId);
    
    await this.cache.set(cacheKey, count, LIST_TTL);
    
    return count;
  }

  async create(accountData: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    const result = await this.baseRepo.create(accountData, orgId, userId);
    
    // Invalidate list caches
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
    
    return result;
  }

  async update(id: string, accountData: UpdateAccountDTO, userId: string): Promise<Account | null> {
    // Fetch account first to get orgId for cache invalidation
    const existing = await this.baseRepo.findById(id);
    if (!existing) {
      return null;
    }
    
    // Invalidate caches BEFORE update to prevent race conditions
    await this.invalidateAccountCache(id, existing.orgId);
    
    const result = await this.baseRepo.update(id, accountData, userId);
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    // Get account before deleting to invalidate proper caches
    const account = await this.baseRepo.findById(id);
    
    if (account) {
      // Invalidate caches BEFORE delete to prevent race conditions
      await this.invalidateAccountCache(id, account.orgId);
    }
    
    const result = await this.baseRepo.delete(id);
    
    return result;
  }

  async archive(id: string, userId: string): Promise<Account | null> {
    // Get account before archiving to invalidate proper caches
    const account = await this.baseRepo.findById(id);
    
    const result = await this.baseRepo.archive(id, userId);
    
    if (result && account) {
      await this.invalidateAccountCache(id, account.orgId);
    }
    
    return result;
  }

  /**
   * Invalidate all caches related to an account
   */
  private async invalidateAccountCache(id: string, orgId: string): Promise<void> {
    await this.cache.delete(`${COLLECTION_NAME}:id:${id}`);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:*`);
  }

  /**
   * IMPORTANT: Restores prototype chain so domain methods work after JSON deserialization
   * Note: Account is an interface, not a class, so we just convert dates
   */
  private rehydrateAccount(data: any): Account {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      archivedAt: data.archivedAt ? new Date(data.archivedAt) : undefined
    };
  }
}
