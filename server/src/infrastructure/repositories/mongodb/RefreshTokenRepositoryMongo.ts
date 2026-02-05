import { injectable } from 'tsyringe';
import { IRefreshTokenRepository } from '../../../application/repositories/IRefreshTokenRepository';
import { RefreshTokenModel } from '../../../models/mongoose/RefreshTokenModel';
import crypto from 'crypto';

@injectable()
export class RefreshTokenRepositoryMongo implements IRefreshTokenRepository {

  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async store({ userId, token, expiresAt }: { userId: string; token: string; expiresAt: Date }): Promise<void> {
    const hashed = this.hash(token);
    const doc = new RefreshTokenModel({
      userId,
      token: hashed,
      expiresAt,
    });
    await doc.save();
  }

  async revoke(token: string): Promise<void> {
    const hashed = this.hash(token);
    await RefreshTokenModel.deleteMany({ token: hashed });
  }

  async isRevoked(token: string): Promise<boolean> {
    const hashed = this.hash(token);
    const doc = await RefreshTokenModel.findOne({ token: hashed });
    return doc === null; // if not found, token is revoked/invalid
  }
}
