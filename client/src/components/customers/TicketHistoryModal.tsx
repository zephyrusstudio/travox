import { Eye, FileText } from "lucide-react";
import React from "react";
import { Customer } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export type TicketHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  tickets: Array<{
    id: string;
    fileName: string;
    uploadDate: string;
    pnr: string;
    route: string;
    amount: number;
    status: string;
    linkedBookingId?: string;
  }>;
};

const TicketHistoryModal: React.FC<TicketHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
  tickets,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ticket History - ${customer?.full_name ?? ""}`}
      size="xl"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            Customer Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <span className="font-medium">Name:</span> {customer?.full_name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {customer?.email || "N/A"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {customer?.phone || "N/A"}
              </p>
              <p>
                <span className="font-medium">GSTIN:</span>{" "}
                {customer?.gstin || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Uploaded Tickets</h4>
          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {ticket.fileName}
                        </span>
                        <Badge variant="success" size="sm">
                          {ticket.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>
                            <span className="font-medium">PNR:</span>{" "}
                            {ticket.pnr}
                          </p>
                          <p>
                            <span className="font-medium">Route:</span>{" "}
                            {ticket.route}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Upload Date:</span>{" "}
                            {new Date(ticket.uploadDate).toLocaleDateString()}
                          </p>
                          <p>
                            <span className="font-medium">Amount:</span> ₹
                            {ticket.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" icon={Eye}>
                        View PDF
                      </Button>
                      {ticket.linkedBookingId && (
                        <Button variant="outline" size="sm">
                          View Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No tickets uploaded for this customer
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  onClose();
                  window.location.hash = "#tickets";
                }}
              >
                Upload Ticket
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TicketHistoryModal;
