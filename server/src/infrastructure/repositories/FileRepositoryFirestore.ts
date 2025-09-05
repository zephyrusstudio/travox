import { inject, injectable } from 'tsyringe';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { IFileRepository } from '../../application/repositories/IFileRepository';
import { FileDocument } from '../../models/FirestoreTypes';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class FileRepositoryFirestore implements IFileRepository {
  private readonly collection = 'files';

  constructor(
    @inject('Firestore') private firestore: Firestore
  ) {}

  async create(fileData: Omit<FileDocument, 'id' | 'created_at' | 'updated_at'>): Promise<FileDocument> {
    const id = uuidv4();
    const now = Timestamp.now();
    
    // Filter out undefined values to avoid Firestore validation errors
    const cleanFileData = Object.fromEntries(
      Object.entries(fileData).filter(([_, value]) => value !== undefined)
    ) as Omit<FileDocument, 'id' | 'created_at' | 'updated_at'>;
    
    const file: FileDocument = {
      ...cleanFileData,
      id,
      created_at: now,
      updated_at: now
    };

    await this.firestore.collection(this.collection).doc(id).set(file);
    return file;
  }

  async findById(id: string, orgId: string): Promise<FileDocument | null> {
    const doc = await this.firestore
      .collection(this.collection)
      .doc(id)
      .get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as FileDocument;
    
    if (data.org_id !== orgId) {
      return null;
    }

    return data;
  }

  async findAll(orgId: string, filters?: {
    kind?: string;
    uploadedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileDocument[]> {
    let query = this.firestore
      .collection(this.collection)
      .where('org_id', '==', orgId);

    if (filters?.kind) {
      query = query.where('kind', '==', filters.kind);
    }

    if (filters?.uploadedBy) {
      query = query.where('uploaded_by', '==', filters.uploadedBy);
    }

    const snapshot = await query.get();
    
    // Sort in memory to avoid composite index requirement
    let docs = snapshot.docs.map(doc => doc.data() as FileDocument);
    docs = docs.sort((a, b) => b.uploaded_at.toMillis() - a.uploaded_at.toMillis());

    // Apply pagination in memory
    if (filters?.offset) {
      docs = docs.slice(filters.offset);
    }

    if (filters?.limit) {
      docs = docs.slice(0, filters.limit);
    }

    return docs;
  }

  async update(id: string, updates: Partial<FileDocument>, orgId: string): Promise<FileDocument> {
    const docRef = this.firestore.collection(this.collection).doc(id);
    
    // First check if the document exists and belongs to the org
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('File not found');
    }

    const data = doc.data() as FileDocument;
    if (data.org_id !== orgId) {
      throw new Error('File not found');
    }

    // Filter out undefined values to avoid Firestore validation errors
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const updateData = {
      ...cleanUpdates,
      updated_at: Timestamp.now()
    };

    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    return updatedDoc.data() as FileDocument;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const docRef = this.firestore.collection(this.collection).doc(id);
    
    // First check if the document exists and belongs to the org
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error('File not found');
    }

    const data = doc.data() as FileDocument;
    if (data.org_id !== orgId) {
      throw new Error('File not found');
    }

    await docRef.delete();
  }
}
