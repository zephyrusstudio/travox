import { injectable } from 'tsyringe';
import { IOrganizationRepository } from '../../application/Repositories/IOrganizationRepository';
import { Organization } from '../../domain/Organization';
import { OrganizationDocument } from '../../models/FirestoreTypes';
import { firestore } from '../../config/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const ORGANIZATIONS_COLLECTION = 'organizations';

@injectable()
export class OrganizationRepositoryFirestore implements IOrganizationRepository {
  private collection = firestore.collection(ORGANIZATIONS_COLLECTION);

  async create(organization: Organization): Promise<Organization> {
    const now = Timestamp.now();
    const docData: Omit<OrganizationDocument, 'id'> = {
      org_id: '', // Organizations don't have org_id since they are the org
      name: organization.name,
      created_at: now,
      updated_at: now,
    };

    const docRef = await this.collection.add(docData);
    organization.id = docRef.id;
    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data() as OrganizationDocument;
    return new Organization(
      doc.id,
      data.name,
      data.created_at.toDate(),
      data.updated_at.toDate()
    );
  }

  async findByName(name: string): Promise<Organization | null> {
    const query = await this.collection.where('name', '==', name).limit(1).get();
    if (query.empty) return null;

    const doc = query.docs[0];
    const data = doc.data() as OrganizationDocument;
    return new Organization(
      doc.id,
      data.name,
      data.created_at.toDate(),
      data.updated_at.toDate()
    );
  }

  async update(organization: Organization): Promise<Organization> {
    const updateData = {
      name: organization.name,
      updated_at: Timestamp.now(),
    };

    await this.collection.doc(organization.id).set(updateData, { merge: true });
    organization.updatedAt = new Date();
    return organization;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
