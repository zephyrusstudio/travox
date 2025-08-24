import { firestore } from '../config/firestore';
import { 
  CollectionReference, 
  DocumentReference, 
  Query, 
  QuerySnapshot, 
  DocumentSnapshot,
  Timestamp,
  FieldValue 
} from 'firebase-admin/firestore';
import { BaseDocument } from '../models/FirestoreTypes';

/**
 * Base Firestore Repository with common CRUD operations
 * Provides multi-tenant support with org_id filtering
 */
export abstract class BaseFirestoreRepository<T extends BaseDocument> {
  protected collection: CollectionReference;

  constructor(collectionName: string) {
    this.collection = firestore.collection(collectionName);
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>, orgId: string): Promise<T> {
    const now = Timestamp.now();
    const docData = {
      ...data,
      org_id: orgId,
      created_at: now,
      updated_at: now,
    } as T;

    const docRef = await this.collection.add(docData);
    return { ...docData, id: docRef.id } as T;
  }

  /**
   * Find document by ID with org_id validation
   */
  async findById(id: string, orgId: string): Promise<T | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data() as T;
    if (data.org_id !== orgId) return null; // Multi-tenant security
    
    return { ...data, id: doc.id } as T;
  }

  /**
   * Find documents by field with org_id filtering
   */
  async findByField(field: keyof T, value: any, orgId: string, limit?: number): Promise<T[]> {
    let query = this.collection
      .where('org_id', '==', orgId)
      .where(field as string, '==', value);
    
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    return this.snapshotToArray(snapshot);
  }

  /**
   * Find all documents for an organization with optional pagination
   */
  async findAll(orgId: string, limit?: number, startAfter?: DocumentSnapshot): Promise<T[]> {
    let query = this.collection.where('org_id', '==', orgId);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    return this.snapshotToArray(snapshot);
  }

  /**
   * Update document with org_id validation
   */
  async update(id: string, data: Partial<T>, orgId: string): Promise<T | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return null;
    
    const existingData = doc.data() as T;
    if (existingData.org_id !== orgId) return null; // Multi-tenant security

    const updateData = {
      ...data,
      updated_at: Timestamp.now(),
    };

    await docRef.set(updateData, { merge: true });
    
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as T;
    return { ...updatedData, id: updatedDoc.id } as T;
  }

  /**
   * Soft delete document (set is_deleted flag if it exists)
   */
  async softDelete(id: string, orgId: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return false;
    
    const data = doc.data() as T;
    if (data.org_id !== orgId) return false; // Multi-tenant security

    await docRef.set({
      is_deleted: true,
      updated_at: Timestamp.now(),
    }, { merge: true });

    return true;
  }

  /**
   * Hard delete document with org_id validation
   */
  async delete(id: string, orgId: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as T;
    if (data.org_id !== orgId) return false; // Multi-tenant security

    await this.collection.doc(id).delete();
    return true;
  }

  /**
   * Archive document (set archived_at timestamp)
   */
  async archive(id: string, orgId: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return false;
    
    const data = doc.data() as T;
    if (data.org_id !== orgId) return false; // Multi-tenant security

    await docRef.set({
      archived_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }, { merge: true });

    return true;
  }

  /**
   * Count documents for an organization
   */
  async count(orgId: string, whereClause?: { field: keyof T; value: any }): Promise<number> {
    let query = this.collection.where('org_id', '==', orgId);
    
    if (whereClause) {
      query = query.where(whereClause.field as string, '==', whereClause.value);
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Check if document exists with org_id validation
   */
  async exists(id: string, orgId: string): Promise<boolean> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return false;
    
    const data = doc.data() as T;
    return data.org_id === orgId;
  }

  /**
   * Convert QuerySnapshot to array of documents
   */
  protected snapshotToArray(snapshot: QuerySnapshot): T[] {
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as T));
  }

  /**
   * Build complex query with multiple conditions
   */
  protected buildQuery(orgId: string, conditions: QueryCondition[]): Query {
    let query = this.collection.where('org_id', '==', orgId);
    
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });

    return query;
  }

  /**
   * Execute custom query
   */
  async executeQuery(query: Query): Promise<T[]> {
    const snapshot = await query.get();
    return this.snapshotToArray(snapshot);
  }
}

export interface QueryCondition {
  field: string;
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
}

/**
 * Utility functions for common Firestore operations
 */
export class FirestoreUtils {
  /**
   * Convert JavaScript Date to Firestore Timestamp
   */
  static dateToTimestamp(date: Date): Timestamp {
    return Timestamp.fromDate(date);
  }

  /**
   * Convert Firestore Timestamp to JavaScript Date
   */
  static timestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  /**
   * Get current timestamp
   */
  static now(): Timestamp {
    return Timestamp.now();
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return firestore.collection('_').doc().id;
  }

  /**
   * Batch write operations
   */
  static getBatch() {
    return firestore.batch();
  }

  /**
   * Create server timestamp for created_at/updated_at fields
   */
  static serverTimestamp() {
    return FieldValue.serverTimestamp();
  }
}
