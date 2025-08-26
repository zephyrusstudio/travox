import { injectable } from 'tsyringe';
import { IOrganizationRepository } from '../../application/repositories/IOrganizationRepository';
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
    const docData = {
      name: organization.name,
      created_at: now,
    };

    const docRef = await this.collection.add(docData);
    organization.id = docRef.id;
    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

  const data = doc.data() as OrganizationDocument;
  const createdAt = data.created_at.toDate();
  return new Organization(doc.id, data.name, createdAt, createdAt);
  }

  async findByName(name: string): Promise<Organization | null> {
    const query = await this.collection.where('name', '==', name).limit(1).get();
    if (query.empty) return null;

    const doc = query.docs[0];
  const data = doc.data() as OrganizationDocument;
  const createdAt = data.created_at.toDate();
  return new Organization(doc.id, data.name, createdAt, createdAt);
  }

  async findFirst(): Promise<Organization | null> {
    const query = await this.collection.orderBy('created_at', 'asc').limit(1).get();
    if (query.empty) return null;

    const doc = query.docs[0];
  const data = doc.data() as OrganizationDocument;
  const createdAt = data.created_at.toDate();
  return new Organization(doc.id, data.name, createdAt, createdAt);
  }

  async update(organization: Organization): Promise<Organization> {
    const updateData = {
      name: organization.name,
    };

    await this.collection.doc(organization.id).set(updateData, { merge: true });
    // update domain timestamp but do not persist updated_at (removed from schema)
    organization.updatedAt = new Date();
    return organization;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
