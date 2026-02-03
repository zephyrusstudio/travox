import { injectable } from 'tsyringe';
import { IOrganizationRepository } from '../../../application/repositories/IOrganizationRepository';
import { Organization } from '../../../domain/Organization';
import { OrganizationModel } from '../../../models/mongoose/OrganizationModel';

@injectable()
export class OrganizationRepositoryMongo implements IOrganizationRepository {
  
  async create(organization: Organization): Promise<Organization> {
    const doc = new OrganizationModel({
      name: organization.name,
    });

    const saved = await doc.save();
    
    return new Organization(
      saved._id.toString(),
      saved.name,
      saved.createdAt,
      saved.updatedAt
    );
  }

  async findById(id: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findById(id);
    if (!doc) return null;

    return new Organization(
      doc._id.toString(),
      doc.name,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findByName(name: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne({ name });
    if (!doc) return null;

    return new Organization(
      doc._id.toString(),
      doc.name,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async findFirst(): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne().sort({ createdAt: 1 });
    if (!doc) return null;

    return new Organization(
      doc._id.toString(),
      doc.name,
      doc.createdAt,
      doc.updatedAt
    );
  }

  async update(organization: Organization): Promise<Organization> {
    const doc = await OrganizationModel.findByIdAndUpdate(
      organization.id,
      { name: organization.name },
      { new: true }
    );

    if (!doc) {
      throw new Error('Organization not found');
    }

    organization.updatedAt = doc.updatedAt;
    return organization;
  }

  async delete(id: string): Promise<void> {
    await OrganizationModel.findByIdAndDelete(id);
  }
}
