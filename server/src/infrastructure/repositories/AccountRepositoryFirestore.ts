import { injectable } from 'tsyringe';
import { IAccountRepository } from '../../application/repositories/IAccountRepository';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../domain/Account';
import { firestore } from '../../config/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';

interface AccountFirestoreDoc {
  org_id: string;
  bank_name: string;
  ifsc_code?: string;
  branch_name?: string;
  account_no?: string;
  upi_id?: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  archived_at?: Timestamp;
}

@injectable()
export class AccountRepositoryFirestore implements IAccountRepository {
  private collection = firestore.collection('accounts');

  private mapFromFirestore(id: string, doc: AccountFirestoreDoc): Account {
    return {
      id,
      orgId: doc.org_id,
      bankName: doc.bank_name,
      ifscCode: doc.ifsc_code,
      branchName: doc.branch_name,
      accountNo: doc.account_no,
      upiId: doc.upi_id,
      isActive: doc.is_active,
      createdBy: doc.created_by,
      updatedBy: doc.updated_by,
      createdAt: doc.created_at.toDate(),
      updatedAt: doc.updated_at.toDate(),
      archivedAt: doc.archived_at?.toDate(),
    };
  }

  private mapToFirestore(account: Partial<Account>): Partial<AccountFirestoreDoc> {
    const doc: Partial<AccountFirestoreDoc> = {};
    
    if (account.orgId !== undefined) doc.org_id = account.orgId;
    if (account.bankName !== undefined) doc.bank_name = account.bankName;
    if (account.ifscCode !== undefined) doc.ifsc_code = account.ifscCode;
    if (account.branchName !== undefined) doc.branch_name = account.branchName;
    if (account.accountNo !== undefined) doc.account_no = account.accountNo;
    if (account.upiId !== undefined) doc.upi_id = account.upiId;
    if (account.isActive !== undefined) doc.is_active = account.isActive;
    if (account.createdBy !== undefined) doc.created_by = account.createdBy;
    if (account.updatedBy !== undefined) doc.updated_by = account.updatedBy;
    
    return doc;
  }

  async findById(id: string): Promise<Account | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as AccountFirestoreDoc;
    return this.mapFromFirestore(doc.id, data);
  }

  async findByOrgId(orgId: string): Promise<Account[]> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('archived_at', '==', null)
      .get();
    
    return snapshot.docs.map(doc => 
      this.mapFromFirestore(doc.id, doc.data() as AccountFirestoreDoc)
    );
  }

  async create(accountData: CreateAccountDTO, orgId: string, userId: string): Promise<Account> {
    const id = uuidv4();
    const now = Timestamp.now();
    
    const docData: any = {
      org_id: orgId,
      bank_name: accountData.bankName,
      is_active: accountData.isActive ?? true,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now,
      archived_at: null,
    };

    // Only add optional fields if they are provided
    if (accountData.ifscCode !== undefined) docData.ifsc_code = accountData.ifscCode;
    if (accountData.branchName !== undefined) docData.branch_name = accountData.branchName;
    if (accountData.accountNo !== undefined) docData.account_no = accountData.accountNo;
    if (accountData.upiId !== undefined) docData.upi_id = accountData.upiId;

    await this.collection.doc(id).set(docData);
    return this.mapFromFirestore(id, docData as AccountFirestoreDoc);
  }

  async update(id: string, accountData: UpdateAccountDTO, userId: string): Promise<Account | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }

    const updates = this.mapToFirestore({
      ...accountData,
      updatedBy: userId,
    });

    updates.updated_at = Timestamp.now();

    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as AccountFirestoreDoc;
    return this.mapFromFirestore(updatedDoc.id, updatedData);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch {
      return false;
    }
  }

  async archive(id: string, userId: string): Promise<Account | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return null;
    }

    const updates = {
      updated_by: userId,
      updated_at: Timestamp.now(),
      archived_at: Timestamp.now(),
    };

    await docRef.update(updates);
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as AccountFirestoreDoc;
    return this.mapFromFirestore(updatedDoc.id, updatedData);
  }
}
