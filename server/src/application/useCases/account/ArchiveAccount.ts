import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account } from '../../../domain/Account';

@injectable()
export class ArchiveAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(accountId: string, userId: string): Promise<Account | null> {
    return this.accountRepo.archive(accountId, userId);
  }
}
