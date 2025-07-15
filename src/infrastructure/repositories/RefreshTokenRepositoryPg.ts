// src/infrastructure/repositories/RefreshTokenRepositoryPg.ts

import { injectable } from 'tsyringe';
import { IRefreshTokenRepository } from '../../application/Repositories/IRefreshTokenRepository';
import { getRepository } from 'typeorm';
import crypto from 'crypto';

@injectable()
export class RefreshTokenRepositoryPg implements IRefreshTokenRepository {
  private repo = getRepository(RefreshTokenEntity); // Define entity below

  async store({ userId, token, expiresAt }: { userId: string; token: string; expiresAt: Date }) {
    const hashed = this.hash(token);
    await this.repo.insert({ userId, token: hashed, expiresAt });
  }

  async revoke(token: string) {
    const hashed = this.hash(token);
    await this.repo.delete({ token: hashed });
  }

  async isRevoked(token: string): Promise<boolean> {
    const hashed = this.hash(token);
    const found = await this.repo.findOne({ token: hashed });
    return !found;
  }

  // Secure hash (use HMAC or SHA-256; do not store raw tokens)
  private hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

// TypeORM entity (example)
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Index({ unique: true })
  @Column({ length: 128 })
  token!: string; // Hashed token

  @Column('timestamptz')
  expiresAt!: Date;

  @Column('timestamptz', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
