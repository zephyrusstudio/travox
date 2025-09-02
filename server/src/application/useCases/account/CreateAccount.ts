import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account, CreateAccountDTO } from '../../../domain/Account';

@injectable()
export class CreateAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(data: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    return this.accountRepo.create(data, orgId, userId);
  }
}
