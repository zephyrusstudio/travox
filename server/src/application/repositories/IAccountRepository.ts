import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../domain/Account';

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByOrgId(orgId: string): Promise<Account[]>;
  create(account: CreateAccountDTO, orgId: string, userId: string): Promise<Account>;
  update(id: string, account: UpdateAccountDTO, userId: string): Promise<Account | null>;
  delete(id: string): Promise<boolean>;
  archive(id: string, userId: string): Promise<Account | null>;
}
