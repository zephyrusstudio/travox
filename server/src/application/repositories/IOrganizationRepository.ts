import { Organization } from '../../domain/Organization';

export interface IOrganizationRepository {
  create(organization: Organization): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findByName(name: string): Promise<Organization | null>;
  // Returns the first organization (ordered by creation time) or null if none exist
  findFirst(): Promise<Organization | null>;
  update(organization: Organization): Promise<Organization>;
  delete(id: string): Promise<void>;
}
