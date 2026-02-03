import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../../application/repositories/IAccountRepository';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../../domain/Account';
import { AccountRepositoryMongo } from './AccountRepositoryMongo';
import { RedisService } from '../../services/RedisService';

const COLLECTION_NAME = 'accounts';
const ENTITY_TTL = 300; // 5 minutes
const LIST_TTL = 900; // 15 minutes

@injectable()
export class CachedAccountRepositoryMongo implements IAccountRepository {
  constructor(
    @inject('AccountRepositoryMongo') private baseRepo: AccountRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  async findById(id: string): Promise<Account | null> {
    const cacheKey = `${COLLECTION_NAME}:entity:${id}`;
    
    const cached = await this.cache.get<Account>(cacheKey);
    if (cached) {
      return cached;
    }

    const account = await this.baseRepo.findById(id);
    
    if (account) {
      await this.cache.set(cacheKey, account, ENTITY_TTL);
    }
    
    return account;
  }

  async findByOrgId(orgId: string, limit?: number, offset?: number): Promise<Account[]> {
    const cacheKey = `${COLLECTION_NAME}:${orgId}:list:${limit || 'all'}:${offset || 0}`;
    
    const cached = await this.cache.get<Account[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const accounts = await this.baseRepo.findByOrgId(orgId, limit, offset);
    await this.cache.set(cacheKey, accounts, LIST_TTL);
    
    return accounts;
  }

  async countByOrgId(orgId: string): Promise<number> {
    return this.baseRepo.countByOrgId(orgId);
  }

  async create(account: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    const result = await this.baseRepo.create(account, orgId, userId);
    await this.cache.invalidatePattern(`${COLLECTION_NAME}:${orgId}:list*`);
    return result;
  }

  async update(id: string, account: UpdateAccountDTO, userId: string): Promise<Account | null> {
    const result = await this.baseRepo.update(id, account, userId);
    if (result) {
      await this.cache.delete(`${COLLECTION_NAME}:entity:${id}`);
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${result.orgId}:list*`);
    }
    return result;
  }

  async delete(id: string): Promise<boolean> {
    const account = await this.baseRepo.findById(id);
    const result = await this.baseRepo.delete(id);
    if (result && account) {
      await this.cache.delete(`${COLLECTION_NAME}:entity:${id}`);
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${account.orgId}:list*`);
    }
    return result;
  }

  async archive(id: string, userId: string): Promise<Account | null> {
    const result = await this.baseRepo.archive(id, userId);
    if (result) {
      await this.cache.delete(`${COLLECTION_NAME}:entity:${id}`);
      await this.cache.invalidatePattern(`${COLLECTION_NAME}:${result.orgId}:list*`);
    }
    return result;
  }
}
