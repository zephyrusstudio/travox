import { injectable } from 'tsyringe';
import { IUserRepository } from '../../application/Repositories/IUserRepository';
import { User } from '../../domain/User';
// Use TypeORM/Prisma/etc. for actual implementation

@injectable()
export class UserRepositoryPg implements IUserRepository {
    findById(id: string): Promise<User | null> {
        throw new Error('Method not implemented.');
    }
    update(user: User): Promise<User> {
        throw new Error('Method not implemented.');
    }
    delete(id: string): Promise<void> {
        throw new Error('Method not implemented.');
    }
    findByPhone(phone: string): Promise<User | null> {
        throw new Error('Method not implemented.');
    }
    async findByEmail(email: string): Promise<User | null> {
        // TypeORM/Prisma DB lookup here
        return null;
    }
    async create(user: User): Promise<User> {
        // Insert into DB
        return user;
    }
}
