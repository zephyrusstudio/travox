import { File } from "../../domain/File";

export interface IFileRepository {
    save(file: File): Promise<void>;
    findById(id: string, org_id: string): Promise<File | null>;
    findAll(org_id: string): Promise<File[]>;
    delete(id: string, org_id: string): Promise<void>;
}
