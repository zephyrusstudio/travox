import { injectable } from 'tsyringe';
import { IRefreshTokenRepository } from '../../application/repositories/IRefreshTokenRepository';
import { firestore } from '../../config/firestore';
import crypto from 'crypto';

const REF_COL = 'refresh_tokens';

@injectable()
export class RefreshTokenRepositoryFirestore implements IRefreshTokenRepository {
  private col = firestore.collection(REF_COL);

  private hash(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async store({ userId, token, expiresAt }: { userId: string; token: string; expiresAt: Date }) {
    const hashed = this.hash(token);
    await this.col.add({ userId, token: hashed, expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString() });
  }

  async revoke(token: string) {
    const hashed = this.hash(token);
    const q = await this.col.where('token', '==', hashed).get();
    const batch = firestore.batch();
    q.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  async isRevoked(token: string): Promise<boolean> {
    const hashed = this.hash(token);
    const q = await this.col.where('token', '==', hashed).limit(1).get();
    return q.empty; // if empty, token not found => revoked/invalid
  }
}
