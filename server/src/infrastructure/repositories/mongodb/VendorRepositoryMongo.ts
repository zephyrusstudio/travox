import { injectable } from 'tsyringe';
import { IVendorRepository } from '../../../application/repositories/IVendorRepository';
import { Vendor } from '../../../domain/Vendor';
import { IVendor, VendorModel } from '../../../models/mongoose/VendorModel';
import { ServiceType } from '../../../models/FirestoreTypes';

@injectable()
export class VendorRepositoryMongo implements IVendorRepository {

  private toDomain(doc: IVendor): Vendor {
    return new Vendor(
      doc._id.toString(),
      doc.orgId,
      doc.name,
      doc.serviceType,
      doc.pocName,
      doc.phone,
      doc.email,
      doc.gstin,
      doc.accountId,
      doc.totalExpense || 0,
      doc.totalBookings || 0,
      doc.createdBy,
      doc.updatedBy,
      doc.isDeleted,
      doc.archivedAt,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async create(vendor: Vendor, orgId: string): Promise<Vendor> {
    const doc = new VendorModel({
      orgId,
      name: vendor.name,
      serviceType: vendor.serviceType,
      pocName: vendor.pocName,
      phone: vendor.phone,
      email: vendor.email,
      gstin: vendor.gstin,
      accountId: vendor.accountId,
      totalExpense: vendor.totalExpense,
      totalBookings: vendor.totalBookings,
      createdBy: vendor.createdBy,
      updatedBy: vendor.updatedBy,
      isDeleted: vendor.isDeleted,
      archivedAt: vendor.archivedAt,
    });

    const saved = await doc.save();
    vendor.id = saved._id.toString();
    return vendor;
  }

  async findById(id: string, orgId: string): Promise<Vendor | null> {
    const doc = await VendorModel.findOne({ _id: id, orgId, isDeleted: false });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string, orgId: string): Promise<Vendor | null> {
    const doc = await VendorModel.findOne({ orgId, email, isDeleted: false });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByPhone(phone: string, orgId: string): Promise<Vendor | null> {
    const doc = await VendorModel.findOne({ orgId, phone, isDeleted: false });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByNameAndServiceType(name: string, serviceType: ServiceType, orgId: string): Promise<Vendor | null> {
    const doc = await VendorModel.findOne({ 
      orgId, 
      name, 
      serviceType, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByAccountId(accountId: string, orgId: string): Promise<Vendor | null> {
    const doc = await VendorModel.findOne({ 
      orgId, 
      accountId, 
      isDeleted: false 
    });
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByServiceType(serviceType: ServiceType, orgId: string): Promise<Vendor[]> {
    const docs = await VendorModel.find({ 
      orgId, 
      serviceType, 
      isDeleted: false 
    }).sort({ name: 1 });
    return docs.map(doc => this.toDomain(doc));
  }

  async findAll(orgId: string, limit?: number, offset?: number): Promise<Vendor[]> {
    let query = VendorModel.find({ orgId, isDeleted: false });

    if (offset) {
      query = query.skip(offset);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const docs = await query.exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async countAll(orgId: string): Promise<number> {
    return await VendorModel.countDocuments({ orgId, isDeleted: false });
  }

  async update(vendor: Vendor, orgId: string): Promise<Vendor> {
    const updateData = {
      name: vendor.name,
      serviceType: vendor.serviceType,
      pocName: vendor.pocName,
      phone: vendor.phone,
      email: vendor.email,
      gstin: vendor.gstin,
      accountId: vendor.accountId,
      totalExpense: vendor.totalExpense,
      totalBookings: vendor.totalBookings,
      updatedBy: vendor.updatedBy,
      isDeleted: vendor.isDeleted,
      archivedAt: vendor.archivedAt,
    };

    await VendorModel.findOneAndUpdate(
      { _id: vendor.id, orgId },
      updateData,
      { new: true }
    );

    vendor.updatedAt = new Date();
    return vendor;
  }

  async softDelete(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await VendorModel.findOneAndUpdate(
      { _id: id, orgId },
      { isDeleted: true, updatedBy }
    );
    return result !== null;
  }

  async delete(id: string, orgId: string): Promise<boolean> {
    const result = await VendorModel.findOneAndDelete({ _id: id, orgId });
    return result !== null;
  }

  async archive(id: string, orgId: string, updatedBy: string): Promise<boolean> {
    const result = await VendorModel.findOneAndUpdate(
      { _id: id, orgId },
      { archivedAt: new Date(), updatedBy }
    );
    return result !== null;
  }

  async search(query: string, orgId: string, limit: number = 20): Promise<Vendor[]> {
    const allVendors = await this.findAll(orgId, limit * 2);
    
    const searchTerm = query.toLowerCase();
    return allVendors
      .filter(vendor => 
        vendor.name.toLowerCase().includes(searchTerm) ||
        (vendor.pocName && vendor.pocName.toLowerCase().includes(searchTerm)) ||
        (vendor.email && vendor.email.toLowerCase().includes(searchTerm)) ||
        (vendor.phone && vendor.phone.includes(searchTerm))
      )
      .slice(0, limit);
  }

  async getActiveVendors(orgId: string): Promise<Vendor[]> {
    const docs = await VendorModel.find({ orgId, isDeleted: false });
    return docs.map(doc => this.toDomain(doc));
  }

  async getVendorExpenseStats(vendorId: string, orgId: string): Promise<{
    totalExpense: number;
    totalBookings: number;
    lastTransactionDate?: Date;
  }> {
    const vendor = await this.findById(vendorId, orgId);
    if (!vendor) {
      return { totalExpense: 0, totalBookings: 0 };
    }

    return {
      totalExpense: vendor.totalExpense,
      totalBookings: vendor.totalBookings,
      lastTransactionDate: undefined
    };
  }

  /**
   * No-op for base MongoDB repository (only cached repo needs this)
   */
  async invalidateCacheForVendor(vendorId: string, orgId: string): Promise<void> {
    // No-op: Base repository doesn't use cache
  }
}
