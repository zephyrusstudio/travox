import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account } from '../../../domain/Account';

@injectable()
export class GetAccounts {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(orgId: string, limit?: number, offset?: number): Promise<Account[]> {
    return this.accountRepo.findByOrgId(orgId, limit, offset);
  }

  async count(orgId: string): Promise<number> {
    return this.accountRepo.countByOrgId(orgId);
  }
}
