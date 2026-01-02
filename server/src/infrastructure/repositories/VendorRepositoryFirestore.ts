import { injectable } from 'tsyringe';
import { firestore } from '../../config/firestore';
import { IVendorRepository } from '../../application/repositories/IVendorRepository';
import { Vendor } from '../../domain/Vendor';
import { VendorDocument, ServiceType } from '../../models/FirestoreTypes';
import { Timestamp } from 'firebase-admin/firestore';

@injectable()
export class VendorRepositoryFirestore implements IVendorRepository {
  private collection = firestore.collection('vendors');

  async create(vendor: Vendor, orgId: string): Promise<Vendor> {
    const doc: any = {
      org_id: orgId,
      name: vendor.name,
      service_type: vendor.serviceType,
      total_expense: vendor.totalExpense,
      total_bookings: vendor.totalBookings,
      created_by: vendor.createdBy,
      updated_by: vendor.updatedBy,
      is_deleted: vendor.isDeleted,
      created_at: Timestamp.fromDate(vendor.createdAt),
      updated_at: Timestamp.fromDate(vendor.updatedAt),
      // Always set archived_at (null if not archived) so Firestore queries work correctly
      archived_at: vendor.archivedAt ? Timestamp.fromDate(vendor.archivedAt) : null
    };

    // Only add optional fields if they are not undefined
    if (vendor.pocName !== undefined) doc.poc_name = vendor.pocName;
    if (vendor.phone !== undefined) doc.phone = vendor.phone;
    if (vendor.email !== undefined) doc.email = vendor.email;
    if (vendor.gstin !== undefined) doc.gstin = vendor.gstin;
    if (vendor.accountId !== undefined) doc.account_id = vendor.accountId;

    const docRef = await this.collection.add(doc);
    vendor.id = docRef.id;
    return vendor;
  }

  async findById(id: string, orgId: string): Promise<Vendor | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data() as VendorDocument;
    if (data.org_id !== orgId || data.is_deleted) return null;

    return this.mapFirestoreToVendor(data, doc.id);
  }

  async findByEmail(email: string, orgId: string): Promise<Vendor | null> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('email', '==', email)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id);
  }

  async findByPhone(phone: string, orgId: string): Promise<Vendor | null> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('phone', '==', phone)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id);
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Vendor | null> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('account_id', '==', accountId)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id);
  }

  async findByNameAndServiceType(name: string, serviceType: ServiceType, orgId: string): Promise<Vendor | null> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('name', '==', name)
      .where('service_type', '==', serviceType)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();

    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id);
  }

  async findByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]> {
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('service_type', '==', serviceType)
      .where('is_deleted', '==', false)
      .orderBy('name')
      .get();

    return querySnapshot.docs.map(doc => this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id));
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Vendor[]> {
    // Simplified query for testing - just filter by org_id
    let query = this.collection.where('org_id', '==', orgId);

    if (offset) {
      query = query.offset(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const querySnapshot = await query.get();
    // Filter out deleted vendors in code instead of database query
    return querySnapshot.docs
      .map(doc => this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id))
      .filter(vendor => !vendor.isDeleted);
  }

  async countAll(orgId: string): Promise<number> {
    const snapshot = await this.collection
      .where('org_id', '==', orgId)
      .count()
      .get();
    const totalCount = snapshot.data().count;
    // Get count of deleted vendors
    const deletedSnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', true)
      .count()
      .get();
    return totalCount - deletedSnapshot.data().count;
  }

  async update(vendor: Vendor, orgId: string): Promise<Vendor> {
    const doc: any = {
      name: vendor.name,
      service_type: vendor.serviceType,
      total_expense: vendor.totalExpense,
      total_bookings: vendor.totalBookings,
      updated_by: vendor.updatedBy,
      updated_at: Timestamp.fromDate(vendor.updatedAt)
    };

    // Only add optional fields if they are not undefined
    if (vendor.pocName !== undefined) doc.poc_name = vendor.pocName;
    if (vendor.phone !== undefined) doc.phone = vendor.phone;
    if (vendor.email !== undefined) doc.email = vendor.email;
    if (vendor.gstin !== undefined) doc.gstin = vendor.gstin;
    if (vendor.accountId !== undefined) doc.account_id = vendor.accountId;
    if (vendor.archivedAt !== undefined) doc.archived_at = Timestamp.fromDate(vendor.archivedAt);

    await this.collection.doc(vendor.id).update(doc);
    return vendor;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const vendor = await this.findById(id, orgId);
    if (!vendor) return false;

    vendor.softDelete(updatedBy);
    await this.update(vendor, orgId);
    return true;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as VendorDocument;
    if (data.org_id !== orgId) return false;

    await this.collection.doc(id).delete();
    return true;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const vendor = await this.findById(id, orgId);
    if (!vendor) return false;

    vendor.archive(updatedBy);
    await this.update(vendor, orgId);
    return true;
  }

  async search(query: string, orgId: string, limit?: number): Promise<Vendor[]> {
    // Simplified search for testing - get all vendors and filter in code
    const allVendors = await this.findAll(orgId, (limit || 20) * 2);
    
    // Basic text search in name, email, and poc name
    const searchTerm = query.toLowerCase();
    return allVendors
      .filter(vendor => 
        vendor.name.toLowerCase().includes(searchTerm) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchTerm)) ||
        (vendor.pocName && vendor.pocName.toLowerCase().includes(searchTerm))
      )
      .slice(0, limit || 20);
  }

  async getActiveVendors(orgId: string): Promise<Vendor[]> {
    // Query all non-deleted vendors and filter archived ones in code
    // This handles documents where archived_at field may not exist
    const querySnapshot = await this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false)
      .orderBy('name')
      .get();

    return querySnapshot.docs
      .map(doc => this.mapFirestoreToVendor(doc.data() as VendorDocument, doc.id))
      .filter(vendor => !vendor.archivedAt);
  }

  async getVendorExpenseStats(vendorId: string, orgId: string): Promise<{
    totalExpense: number;
    totalBookings: number;
    lastTransactionDate?: Date;
  }> {
    const vendor = await this.findById(vendorId, orgId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    return {
      totalExpense: vendor.totalExpense,
      totalBookings: vendor.totalBookings,
      // TODO: Add lastTransactionDate from payments/bookings collection
      lastTransactionDate: undefined
    };
  }

  /**
   * No-op for base Firestore repository (only cached repo needs this)
   */
  async invalidateCacheForVendor(vendorId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }

  private mapFirestoreToVendor(doc: VendorDocument, id: string): Vendor {
    return new Vendor(
      id,
      doc.org_id,
      doc.name,
      doc.service_type,
      doc.poc_name,
      doc.phone,
      doc.email,
      doc.gstin,
      doc.account_id,
      doc.total_expense,
      doc.total_bookings,
      doc.created_by,
      doc.updated_by,
      doc.is_deleted,
      doc.archived_at?.toDate(),
      doc.created_at.toDate(),
      doc.updated_at.toDate()
    );
  }
}
