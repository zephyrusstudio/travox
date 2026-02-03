import { injectable } from 'tsyringe';
import { ICustomerRepository, CustomerSearchParams } from '../../../application/repositories/ICustomerRepository';
import { Customer } from '../../../domain/Customer';
import { CustomerModel } from '../../../models/mongoose/CustomerModel';

@injectable()
export class CustomerRepositoryMongo implements ICustomerRepository {

  private toDomain(doc: any): Customer {
    return new Customer(
      doc._id.toString(),
      doc.orgId,
      doc.name,
      doc.phone,
      doc.email,
      doc.passportNo,
      doc.aadhaarNo,
      doc.visaNo,
      doc.gstin,
      doc.accountId,
      doc.totalBookings || 0,
      doc.totalSpent || 0,
      doc.createdBy,
      doc.updatedBy,
      doc.isDeleted,
      doc.archivedAt,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async create(customer: Customer, orgId: string): Promise<Customer> {
    const doc = new CustomerModel({
      orgId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      passportNo: customer.passportNo,
      aadhaarNo: customer.aadhaarNo,
      visaNo: customer.visaNo,
      gstin: customer.gstin,
      accountId: customer.accountId,
      totalBookings: customer.totalBookings,
      totalSpent: customer.totalSpent,
      createdBy: customer.createdBy,
      updatedBy: customer.updatedBy,
      isDeleted: customer.isDeleted,
      archivedAt: customer.archivedAt,
    });

    const saved = await doc.save();
    customer.id = saved._id.toString();
    return customer;
  }

  async findById(id: string, orgId: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ _id: id, orgId });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string, orgId: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      orgId, 
      email, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByPhone(phone: string, orgId: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      orgId, 
      phone, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByPassport(passportNo: string, orgId: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      orgId, 
      passportNo, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      orgId, 
      accountId, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(orgId: string, limit?: number): Promise<Customer[]> {
    let query = CustomerModel.find({ orgId, isDeleted: false })
      .sort({ updatedAt: -1 });

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async update(customer: Customer, orgId: string): Promise<Customer> {
    const updateData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      passportNo: customer.passportNo,
      aadhaarNo: customer.aadhaarNo,
      visaNo: customer.visaNo,
      gstin: customer.gstin,
      accountId: customer.accountId,
      totalBookings: customer.totalBookings,
      totalSpent: customer.totalSpent,
      updatedBy: customer.updatedBy,
      isDeleted: customer.isDeleted,
      archivedAt: customer.archivedAt,
    };

    await CustomerModel.findOneAndUpdate(
      { _id: customer.id, orgId },
      updateData,
      { new: true }
    );

    customer.updatedAt = new Date();
    return customer;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await CustomerModel.findOneAndUpdate(
      { _id: id, orgId },
      { isDeleted: true, updatedBy }
    );
    return result !== null;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await CustomerModel.findOneAndDelete({ _id: id, orgId });
    return result !== null;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await CustomerModel.findOneAndUpdate(
      { _id: id, orgId },
      { archivedAt: new Date(), updatedBy }
    );
    return result !== null;
  }

  async search(query: string, orgId: string, limit: number = 20): Promise<Customer[]> {
    const allCustomers = await this.findAll(orgId, limit * 2);
    
    const searchTerm = query.toLowerCase();
    return allCustomers
      .filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        (customer.phone && customer.phone.includes(searchTerm))
      )
      .slice(0, limit);
  }

  async advancedSearch(params: CustomerSearchParams, orgId: string): Promise<Customer[]> {
    const allCustomers = await this.getActiveCustomers(orgId);
    
    const { q, name, email, phone, gstin } = params;
    
    return allCustomers.filter(customer => {
      if (q) {
        const searchTerm = q.toLowerCase();
        const matchesGeneral = 
          customer.name.toLowerCase().includes(searchTerm) ||
          (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
          (customer.phone && customer.phone.includes(searchTerm)) ||
          (customer.gstin && customer.gstin.toLowerCase().includes(searchTerm));
        
        if (!matchesGeneral) return false;
      }
      
      if (name) {
        const nameLower = name.toLowerCase();
        if (!customer.name.toLowerCase().includes(nameLower)) return false;
      }
      
      if (email) {
        const emailLower = email.toLowerCase();
        if (!customer.email || !customer.email.toLowerCase().includes(emailLower)) return false;
      }
      
      if (phone) {
        if (!customer.phone || !customer.phone.includes(phone)) return false;
      }
      
      if (gstin) {
        const gstinLower = gstin.toLowerCase();
        if (!customer.gstin || !customer.gstin.toLowerCase().includes(gstinLower)) return false;
      }
      
      return true;
    });
  }

  async getActiveCustomers(orgId: string, limit?: number, offset?: number): Promise<Customer[]> {
    let query = CustomerModel.find({ orgId, isDeleted: false });

    if (offset) {
      query = query.skip(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async countActiveCustomers(orgId: string): Promise<number> {
    return await CustomerModel.countDocuments({ orgId, isDeleted: false });
  }

  async getCustomerBookingStats(customerId: string, orgId: string): Promise<{
    totalBookings: number;
    totalSpent: number;
    lastBookingDate?: Date;
  }> {
    const customer = await this.findById(customerId, orgId);
    if (!customer) {
      return { totalBookings: 0, totalSpent: 0 };
    }

    return {
      totalBookings: customer.totalBookings,
      totalSpent: customer.totalSpent,
      lastBookingDate: undefined
    };
  }

  /**
   * No-op for base MongoDB repository (only cached repo needs this)
   */
  async invalidateCacheForCustomer(customerId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }
}
