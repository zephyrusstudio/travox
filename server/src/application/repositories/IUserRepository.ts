import { User } from '../../domain/User';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    create(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findByOrganizationId(orgId: string): Promise<User[]>;
}
