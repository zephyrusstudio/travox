import { inject, injectable } from "tsyringe";
import { IFileRepository } from "../../repositories/IFileRepository";
import { IBookingRepository } from "../../repositories/IBookingRepository";
import { IGoogleDriveService } from "../../services/IGoogleDriveService";
import { File } from "../../../domain/File";
import { AppError } from "../../../utils/errors";

interface GetBookingTicketRequest {
    booking_id: string;
    org_id: string;
}

@injectable()
export class GetBookingTicket {
    constructor(
        @inject("FileRepository") private fileRepository: IFileRepository,
        @inject("BookingRepository") private bookingRepository: IBookingRepository,
        @inject("GoogleDriveService") private googleDriveService: IGoogleDriveService
    ) {}

    async execute(data: GetBookingTicketRequest): Promise<{file: File, buffer: Buffer}> {
        const booking = await this.bookingRepository.findById(data.booking_id, data.org_id);

        if (!booking) {
            throw new AppError("Booking not found");
        }

        if (!booking.ticketId) {
            throw new AppError("Ticket not found for this booking");
        }

        const file = await this.fileRepository.findById(booking.ticketId, data.org_id);

        if (!file) {
            throw new AppError("File not found");
        }

        const buffer = await this.googleDriveService.downloadFile(file.id);

        return { file, buffer };
    }
}
