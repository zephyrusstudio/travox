import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';

@injectable()
export class DeleteAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(accountId: string): Promise<boolean> {
    return this.accountRepo.delete(accountId);
  }
}
