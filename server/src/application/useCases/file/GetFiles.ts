import { inject, injectable } from "tsyringe";
import { IFileRepository } from "../../repositories/IFileRepository";
import { File } from "../../../domain/File";

interface GetFilesRequest {
    org_id: string;
}

@injectable()
export class GetFiles {
    constructor(
        @inject("FileRepository") private fileRepository: IFileRepository
    ) {}

    async execute(data: GetFilesRequest): Promise<File[]> {
        return this.fileRepository.findAll(data.org_id);
    }
}
