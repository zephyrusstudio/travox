import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../application/repositories/IUserRepository';
import { User } from '../../../domain/User';
import { UserRepositoryMongo } from './UserRepositoryMongo';
import { RedisService } from '../../services/RedisService';

const COLLECTION_NAME = 'users';
const ENTITY_TTL = 300; // 5 minutes

@injectable()
export class CachedUserRepositoryMongo implements IUserRepository {
  constructor(
    @inject('UserRepositoryMongo') private baseRepo: UserRepositoryMongo,
    @inject('RedisService') private cache: RedisService
  ) {}

  async create(user: User): Promise<User> {
    const result = await this.baseRepo.create(user);
    return result;
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = `${COLLECTION_NAME}:entity:${id}`;
    
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) {
      return new User(
        cached.id,
        cached.orgId,
        cached.name,
        cached.email,
        cached.phone,
        cached.googleId,
        cached.avatar,
        cached.role,
        cached.isActive,
        cached.preferences,
        cached.lastLoginAt ? new Date(cached.lastLoginAt) : undefined,
        new Date(cached.createdAt),
        new Date(cached.updatedAt)
      );
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
      return new User(
        cached.id,
        cached.orgId,
        cached.name,
        cached.email,
        cached.phone,
        cached.googleId,
        cached.avatar,
        cached.role,
        cached.isActive,
        cached.preferences,
        cached.lastLoginAt ? new Date(cached.lastLoginAt) : undefined,
        new Date(cached.createdAt),
        new Date(cached.updatedAt)
      );
    }

    const user = await this.baseRepo.findByEmail(email);
    
    if (user) {
      await this.cache.set(cacheKey, user, ENTITY_TTL);
    }
    
    return user;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.baseRepo.findByGoogleId(googleId);
  }

  async update(user: User): Promise<User> {
    const result = await this.baseRepo.update(user);
    await this.cache.delete(`${COLLECTION_NAME}:entity:${user.id}`);
    if (user.email) {
      await this.cache.delete(`${COLLECTION_NAME}:email:${user.email}`);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const user = await this.baseRepo.findById(id);
    await this.baseRepo.delete(id);
    await this.cache.delete(`${COLLECTION_NAME}:entity:${id}`);
    if (user?.email) {
      await this.cache.delete(`${COLLECTION_NAME}:email:${user.email}`);
    }
  }

  async findByOrganizationId(orgId: string, limit?: number, offset?: number): Promise<User[]> {
    return this.baseRepo.findByOrganizationId(orgId, limit, offset);
  }

  async countByOrganizationId(orgId: string): Promise<number> {
    return this.baseRepo.countByOrganizationId(orgId);
  }
}
