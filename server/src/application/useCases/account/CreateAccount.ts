import { injectable, inject } from 'tsyringe';
import { IAccountRepository } from '../../repositories/IAccountRepository';
import { Account, CreateAccountDTO } from '../../../domain/Account';

@injectable()
export class CreateAccount {
  constructor(
    @inject('IAccountRepository') private accountRepo: IAccountRepository
  ) {}

  async execute(data: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    // Validate: Must have either UPI ID or (Account No + IFSC)
    const hasUpiId = Boolean(data.upiId?.trim());
    const hasBankDetails = Boolean(data.accountNo?.trim() && data.ifscCode?.trim());

    if (!hasUpiId && !hasBankDetails) {
      throw new Error(
        'Either UPI ID or both Account Number and IFSC Code must be provided'
      );
    }

    return this.accountRepo.create(data, orgId, userId);
  }
}
