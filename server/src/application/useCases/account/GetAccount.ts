
import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account } from '../../../domain/Account';

@injectable()
export class GetAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(accountId: string): Promise<Account | null> {
    return this.accountRepo.findById(accountId);
  }
}
