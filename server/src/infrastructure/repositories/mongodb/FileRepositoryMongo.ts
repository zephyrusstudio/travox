import { injectable } from 'tsyringe';
import { IFileRepository } from '../../../application/repositories/IFileRepository';
import { FileDocument } from '../../../models/FirestoreTypes';
import { FileModel } from '../../../models/mongoose/FileModel';

@injectable()
export class FileRepositoryMongo implements IFileRepository {

  private toFileDocument(doc: any): FileDocument {
    return {
      id: doc._id.toString(),
      org_id: doc.orgId,
      name: doc.name,
      mime_type: doc.mimeType,
      size: doc.size,
      kind: doc.kind,
      gdrive_id: doc.gdriveId,
      uploaded_by: doc.uploadedBy,
      uploaded_at: doc.uploadedAt,
      created_at: doc.createdAt,
      updated_at: doc.updatedAt,
    };
  }

  async create(fileData: Omit<FileDocument, 'id' | 'created_at' | 'updated_at'>): Promise<FileDocument> {
    const doc = new FileModel({
      orgId: fileData.org_id,
      name: fileData.name,
      mimeType: fileData.mime_type,
      size: fileData.size,
      kind: fileData.kind,
      gdriveId: fileData.gdrive_id,
      uploadedBy: fileData.uploaded_by,
      uploadedAt: fileData.uploaded_at,
    });

    const saved = await doc.save();
    return this.toFileDocument(saved);
  }

  async findById(id: string, orgId: string): Promise<FileDocument | null> {
    const doc = await FileModel.findOne({ _id: id, orgId });
    if (!doc) return null;
    return this.toFileDocument(doc);
  }

  async findAll(orgId: string, filters?: {
    kind?: string;
    uploadedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileDocument[]> {
    const query: any = { orgId };

    if (filters?.kind) {
      query.kind = filters.kind;
    }

    if (filters?.uploadedBy) {
      query.uploadedBy = filters.uploadedBy;
    }

    let docsQuery = FileModel.find(query).sort({ uploadedAt: -1 });

    if (filters?.offset) {
      docsQuery = docsQuery.skip(filters.offset);
    }

    if (filters?.limit) {
      docsQuery = docsQuery.limit(filters.limit);
    }

    const docs = await docsQuery.exec();
    return docs.map(doc => this.toFileDocument(doc));
  }

  async update(id: string, updates: Partial<FileDocument>, orgId: string): Promise<FileDocument> {
    const doc = await FileModel.findOne({ _id: id, orgId });
    if (!doc) {
      throw new Error('File not found');
    }

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.mime_type !== undefined) updateData.mimeType = updates.mime_type;
    if (updates.size !== undefined) updateData.size = updates.size;
    if (updates.kind !== undefined) updateData.kind = updates.kind;
    if (updates.gdrive_id !== undefined) updateData.gdriveId = updates.gdrive_id;
    if (updates.uploaded_by !== undefined) updateData.uploadedBy = updates.uploaded_by;
    if (updates.uploaded_at !== undefined) updateData.uploadedAt = updates.uploaded_at;

    const updatedDoc = await FileModel.findOneAndUpdate(
      { _id: id, orgId },
      updateData,
      { new: true }
    );

    if (!updatedDoc) {
      throw new Error('File not found');
    }

    return this.toFileDocument(updatedDoc);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const doc = await FileModel.findOne({ _id: id, orgId });
    if (!doc) {
      throw new Error('File not found');
    }

    await FileModel.findOneAndDelete({ _id: id, orgId });
  }
}
