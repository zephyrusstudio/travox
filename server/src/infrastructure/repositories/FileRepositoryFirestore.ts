import { Firestore, Timestamp } from "firebase-admin/firestore";
import { IFileRepository } from "../../application/repositories/IFileRepository";
import { File } from "../../domain/File";
import { FileDocument } from "../../models/FirestoreTypes";

export class FileRepositoryFirestore implements IFileRepository {
    private collection

    constructor(firestore: Firestore) {
        this.collection = firestore.collection('files');
    }

    async save(file: File): Promise<void> {
        const doc: FileDocument = {
            id: file.id,
            org_id: file.org_id,
            name: file.name,
            mime_type: file.mime_type,
            size: file.size,
            kind: file.kind,
            path: file.path,
            uploaded_by: file.uploaded_by,
            uploaded_at: Timestamp.fromDate(file.uploaded_at),
            is_deleted: file.is_deleted,
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
            booking_id: file.booking_id,
            customer_id: file.customer_id,
            vendor_id: file.vendor_id,
        };
        await this.collection.doc(file.id).set(doc);
    }

    async findById(id: string, org_id: string): Promise<File | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) {
            return null;
        }
        const data = doc.data() as FileDocument;
        if (data.org_id !== org_id) {
            return null;
        }
        return new File(
            data.id,
            data.org_id,
            data.name,
            data.mime_type,
            data.size,
            data.kind,
            data.path,
            data.uploaded_by,
            data.uploaded_at.toDate(),
            data.is_deleted,
            data.booking_id,
            data.customer_id,
            data.vendor_id
        );
    }

    async findAll(org_id: string): Promise<File[]> {
        const snapshot = await this.collection.where('org_id', '==', org_id).get();
        return snapshot.docs.map(doc => {
            const data = doc.data() as FileDocument;
            return new File(
                data.id,
                data.org_id,
                data.name,
                data.mime_type,
                data.size,
                data.kind,
                data.path,
                data.uploaded_by,
                data.uploaded_at.toDate(),
                data.is_deleted,
                data.booking_id,
                data.customer_id,
                data.vendor_id
            );
        });
    }

    async delete(id: string, org_id: string): Promise<void> {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return;
        }
        const data = doc.data() as FileDocument;
        if (data.org_id !== org_id) {
            return;
        }
        await docRef.update({ is_deleted: true });
    }
}
