import { injectable } from 'tsyringe';
import { IUserRepository } from '../../../application/repositories/IUserRepository';
import { User } from '../../../domain/User';
import { IUser, UserModel } from '../../../models/mongoose/UserModel';
import { UserRole } from '../../../models/FirestoreTypes';

@injectable()
export class UserRepositoryMongo implements IUserRepository {

  private toDomain(doc: IUser): User {
    return new User(
      doc._id.toString(),
      doc.orgId,
      doc.name,
      doc.email,
      doc.phone,
      doc.googleId,
      doc.avatar,
      doc.role as UserRole || UserRole.ADMIN,
      doc.isActive,
      doc.preferences || {},
      doc.lastLoginAt,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async create(user: User): Promise<User> {
    const doc = new UserModel({
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      googleId: user.googleId,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt,
    });

    const saved = await doc.save();
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await UserModel.findOne({ googleId });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async update(user: User): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(
      user.id,
      {
        orgId: user.orgId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        googleId: user.googleId,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        lastLoginAt: user.lastLoginAt,
      },
      { new: true }
    );

    if (!doc) {
      throw new Error('User not found');
    }

    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }

  async findByOrganizationId(orgId: string, limit?: number, offset?: number): Promise<User[]> {
    let query = UserModel.find({ orgId });

    if (offset) {
      query = query.skip(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async countByOrganizationId(orgId: string): Promise<number> {
    return await UserModel.countDocuments({ orgId });
  }
}
