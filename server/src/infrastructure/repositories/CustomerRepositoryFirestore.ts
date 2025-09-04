import { injectable } from 'tsyringe';
import { ICustomerRepository } from '../../application/repositories/ICustomerRepository';
import { Customer } from '../../domain/Customer';
import { CustomerDocument } from '../../models/FirestoreTypes';
import { firestore } from '../../config/firestore';
import { Timestamp } from 'firebase-admin/firestore';

const CUSTOMERS_COLLECTION = 'customers';

@injectable()
export class CustomerRepositoryFirestore implements ICustomerRepository {
  private collection = firestore.collection(CUSTOMERS_COLLECTION);

  async create(customer: Customer, orgId: string): Promise<Customer> {
    const now = Timestamp.now();
    const docData: any = {
      org_id: orgId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      total_bookings: customer.totalBookings,
      total_spent: customer.totalSpent,
      created_by: customer.createdBy,
      updated_by: customer.updatedBy,
      is_deleted: customer.isDeleted,
      created_at: now,
      updated_at: now,
    };

    // Only add optional fields if they are not undefined
    if (customer.passportNo !== undefined) docData.passport_no = customer.passportNo;
    if (customer.aadhaarNo !== undefined) docData.aadhaar_no = customer.aadhaarNo;
    if (customer.visaNo !== undefined) docData.visa_no = customer.visaNo;
    if (customer.gstin !== undefined) docData.gstin = customer.gstin;
    if (customer.accountId !== undefined) docData.account_id = customer.accountId;
    if (customer.archivedAt !== undefined) docData.archived_at = Timestamp.fromDate(customer.archivedAt);

    const docRef = await this.collection.add(docData);
    customer.id = docRef.id;
    return customer;
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as CustomerDocument;
    if (data.org_id !== orgId) return null;
    
    return this.documentToDomain(data, doc.id);
  }

  async findByEmail(email: string, orgId: string): Promise<Customer | null> {
    const query = await this.collection
      .where('org_id', '==', orgId)
      .where('email', '==', email)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();
    
    if (query.empty) return null;
    
    const doc = query.docs[0];
    const data = doc.data() as CustomerDocument;
    return this.documentToDomain(data, doc.id);
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    const query = await this.collection
      .where('org_id', '==', orgId)
      .where('phone', '==', phone)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();
    
    if (query.empty) return null;
    
    const doc = query.docs[0];
    const data = doc.data() as CustomerDocument;
    return this.documentToDomain(data, doc.id);
  }

  async findByPassport(passportNo: string, orgId: string): Promise<Customer | null> {
    const query = await this.collection
      .where('org_id', '==', orgId)
      .where('passport_no', '==', passportNo)
      .where('is_deleted', '==', false)
      .limit(1)
      .get();
    
    if (query.empty) return null;
    
    const doc = query.docs[0];
    const data = doc.data() as CustomerDocument;
    return this.documentToDomain(data, doc.id);
  }

  async findAll(orgId: string, limit?: number): Promise<Customer[]> {
    // Simplified query for testing - just filter by org_id
    let query = this.collection.where('org_id', '==', orgId);
    
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    // Filter out deleted customers in code instead of database query
    return snapshot.docs
      .map(doc => {
        const data = doc.data() as CustomerDocument;
        return this.documentToDomain(data, doc.id);
      })
      .filter(customer => !customer.isDeleted);
  }

  async update(customer: Customer, orgId: string): Promise<Customer> {
    const updateData: any = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      total_bookings: customer.totalBookings,
      total_spent: customer.totalSpent,
      updated_by: customer.updatedBy,
      is_deleted: customer.isDeleted,
      updated_at: Timestamp.now(),
    };

    if (customer.passportNo !== undefined) updateData.passport_no = customer.passportNo;
    if (customer.aadhaarNo !== undefined) updateData.aadhaar_no = customer.aadhaarNo;
    if (customer.visaNo !== undefined) updateData.visa_no = customer.visaNo;
    if (customer.gstin !== undefined) updateData.gstin = customer.gstin;
    if (customer.accountId !== undefined) updateData.account_id = customer.accountId;
    if (customer.archivedAt !== undefined) updateData.archived_at = Timestamp.fromDate(customer.archivedAt);

    await this.collection.doc(customer.id).set(updateData, { merge: true });
    customer.updatedAt = new Date();
    return customer;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as CustomerDocument;
    if (data.org_id !== orgId) return false;

    await this.collection.doc(id).set({
      is_deleted: true,
      updated_by: updatedBy,
      updated_at: Timestamp.now(),
    }, { merge: true });

    return true;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as CustomerDocument;
    if (data.org_id !== orgId) return false;

    await this.collection.doc(id).delete();
    return true;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as CustomerDocument;
    if (data.org_id !== orgId) return false;

    await this.collection.doc(id).set({
      archived_at: Timestamp.now(),
      updated_by: updatedBy,
      updated_at: Timestamp.now(),
    }, { merge: true });

    return true;
  }

  async search(query: string, orgId: string, limit: number = 20): Promise<Customer[]> {
    // Simplified search for testing - get all customers and filter in code
    const allCustomers = await this.findAll(orgId, limit * 2); // Get more to account for filtering
    
    // Basic text search in name, email, and phone
    const searchTerm = query.toLowerCase();
    return allCustomers
      .filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
      .slice(0, limit);
  }

  async getActiveCustomers(orgId: string): Promise<Customer[]> {
    const query = this.collection
      .where('org_id', '==', orgId)
      .where('is_deleted', '==', false);

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data() as CustomerDocument;
      return this.documentToDomain(data, doc.id);
    });
  }

  async getCustomerBookingStats(customerId: string, orgId: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }> {
    // This would require joining with bookings collection
    // For now, return the basic stats from customer document
    const customer = await this.findById(customerId, orgId);
    if (!customer) {
      return { totalBookings: 0, totalSpent: 0 };
    }

    // TODO: Implement actual stats calculation from bookings collection
    return {
      totalBookings: customer.totalBookings,
      totalSpent: customer.totalSpent, // Now using the tracked totalSpent
      lastBookingDate: undefined // Would need to get from latest booking
    };
  }

  private documentToDomain(doc: CustomerDocument, id: string): Customer {
    return new Customer(
      id,
      doc.org_id,
      doc.name,
      doc.phone,
      doc.email,
      doc.passport_no,
      doc.aadhaar_no,
      doc.visa_no,
      doc.gstin,
      doc.account_id,
      doc.total_bookings || 0,
      doc.total_spent || 0,
      doc.created_by,
      doc.updated_by,
      doc.is_deleted,
      doc.archived_at?.toDate(),
      doc.created_at.toDate(),
      doc.updated_at.toDate()
    );
  }
}
