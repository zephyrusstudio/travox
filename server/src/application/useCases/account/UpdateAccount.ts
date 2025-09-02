
import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account, UpdateAccountDTO } from '../../../domain/Account';

@injectable()
export class UpdateAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(accountId: string, data: UpdateAccountDTO, userId: string): Promise<Account | null> {
    return this.accountRepo.update(accountId, data, userId);
  }
}
