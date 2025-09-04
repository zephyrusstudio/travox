import { FileKind } from "../models/FirestoreTypes";


export class File {
    constructor(
        public readonly id: string,
        public readonly org_id: string,
        public name: string,
        public mime_type: string,
        public size: number,
        public kind: FileKind,
        public path: string,
        public uploaded_by: string,
        public readonly uploaded_at: Date,
        public is_deleted: boolean,
        public booking_id?: string,
        public customer_id?: string,
        public vendor_id?: string,
    ) {}
}
