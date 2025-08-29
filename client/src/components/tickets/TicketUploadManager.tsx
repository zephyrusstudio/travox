import axios from "axios";
import { addDoc, collection } from "firebase/firestore";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Loader,
  Plus,
  Upload,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { mockData } from "../../data/mockData";
import { db } from "../../firebaseconfig";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
import Modal from "../ui/Modal";

interface Passenger {
  name: string;
  age: string | null;
  primary: boolean;
}

interface AdditionalInfo {
  total_stay_nights: string;
  number_of_rooms: string;
  guest_summary: string;
  meal_plan: string;
  inclusions: string;
  hotel_name: string;
  hotel_address: string;
  hotel_star_rating: string;
  booking_agency_name: string;
  booking_agency_contact_mobile: string;
  booking_agency_contact_email: string;
  booking_agency_address: string;
}

interface ExtractedData {
  document_type: string;
  pnr_booking_id: string;
  route: string;
  service_provider: string;
  vehicle_number: string | null;
  journey_date: string;
  journey_time: string | null;
  arrival_time: string | null;
  travel_class: string;
  booking_amount: string;
  passenger_list: Passenger[];
  additional_info: AdditionalInfo;
}

interface ApiResponse {
  total_files: number;
  successful_extractions: number;
  failed_extractions: number;
  total_processing_time: number;
  results: {
    file_index: number;
    filename: string;
    processing_method: string;
    processing_time: number;
    data: ExtractedData;
  }[];
}

interface TicketData {
  id: string;
  fileName: string;
  uploadDate: string;
  status: "processing" | "extracted" | "error";
  pdfUrl: string;
  responseData?: ExtractedData;
  manualData?: {
    customerId: string;
    customerName: string;
    packageName: string;
    finalAmount: string;
    discount: number;
    advanceReceived: number;
    receivableAmount: string;
    bookingStatus: string;
  };
}

type BookingStatus = "Generated" | "Under Review" | "Confirmed";

interface EditData {
  customerId: string;
  customerName: string;
  packageName: string;
  finalAmount: number;
  discount: number;
  advanceReceived: number;
  bookingStatus: BookingStatus;
}

const TicketUploadManager: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editData, setEditData] = useState<EditData>({
    customerId: "",
    customerName: "",
    packageName: "",
    finalAmount: 0,
    discount: 0,
    advanceReceived: 0,
    bookingStatus: "Generated",
  });

  const [newCustomerData, setNewCustomerData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    passport_no: "",
    gstin: "",
  });

  const saveTicketToFirebase = async (ticket: TicketData) => {
    try {
      const docRef = await addDoc(collection(db, "tickets"), ticket);
      console.log("Ticket saved with ID:", docRef.id);
    } catch (e) {
      console.error("Error adding ticket:", e);
    }
  };

  // Mock AI extraction function

  // const handleFileUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const files = event.target.files;
  //   if (!files || files.length === 0) return;

  //   setIsUploading(true);

  //   for (const file of files) {
  //     if (file.type !== "application/pdf") {
  //       alert("Please upload only PDF files");
  //       continue;
  //     }

  //     const ticketId = Math.random().toString(36);
  //     const newTicket: TicketData = {
  //       id: ticketId,
  //       fileName: file.name,
  //       uploadDate: new Date().toISOString(),
  //       status: "processing",
  //       pdfUrl: URL.createObjectURL(file),
  //     };

  //     setTickets((prev) => [...prev, newTicket]);

  //     try {
  //       const formData = new FormData();
  //       formData.append("files", file);

  //       const res = await axios.post<ApiResponse>(
  //         "https://ai-pass-scan.onrender.com/scan",
  //         formData,
  //         {
  //           headers: {
  //             "Content-Type": "multipart/form-data",
  //           },
  //         }
  //       );

  //       const extractedData = res.data.results[0]?.data;
  //       if (!extractedData) {
  //         throw new Error("No data extracted");
  //       }

  //       setTickets((prev) =>
  //         prev.map((ticket) =>
  //           ticket.id === ticketId
  //             ? {
  //                 ...ticket,
  //                 status: "extracted",
  //                 responseData: extractedData,
  //                 manualData: {
  //                   customerId: "",
  //                   customerName: "",
  //                   packageName: `${extractedData.route} - ${extractedData.document_type} Trip`,
  //                   finalAmount: extractedData.booking_amount,
  //                   discount: 0,
  //                   advanceReceived: 0,
  //                   receivableAmount: extractedData.booking_amount,
  //                   bookingStatus: "Generated",
  //                 },
  //               }
  //             : ticket
  //         )
  //       );
  //     } catch (error) {
  //       setTickets((prev) =>
  //         prev.map((ticket) =>
  //           ticket.id === ticketId ? { ...ticket, status: "error" } : ticket
  //         )
  //       );
  //     }

  //     const extractedData = res.data.results[0]?.data;
  //     if (!extractedData) throw new Error("No data extracted");

  //     const updatedTicket: TicketData = {
  //       ...newTicket,
  //       status: "extracted",
  //       responseData: extractedData,
  //       manualData: {
  //         customerId: "",
  //         customerName: "",
  //         packageName: `${extractedData.route} - ${extractedData.document_type} Trip`,
  //         finalAmount: extractedData.booking_amount,
  //         discount: 0,
  //         advanceReceived: 0,
  //         receivableAmount: extractedData.booking_amount,
  //         bookingStatus: "Generated",
  //       },
  //     };

  //     // Update UI state
  //     setTickets((prev) =>
  //       prev.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket))
  //     );

  //     // Save to Firebase
  //     await saveTicketToFirebase(updatedTicket);
  //   }

  //   // // Save to Firebase
  //   // await saveTicketToFirebase(updatedTicket);

  //   // setIsUploading(false);
  //   // if (fileInputRef.current) {
  //   //   fileInputRef.current.value = "";
  //   // }
  // };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of files) {
      if (file.type !== "application/pdf") {
        alert("Please upload only PDF files");
        continue;
      }

      const ticketId = Math.random().toString(36);
      const newTicket: TicketData = {
        id: ticketId,
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        status: "processing",
        pdfUrl: URL.createObjectURL(file),
      };

      setTickets((prev) => [...prev, newTicket]);

      try {
        // Prepare form data
        const formData = new FormData();
        formData.append("files", file);

        // Call your API
        const res = await axios.post<ApiResponse>(
          "https://ai-pass-scan.onrender.com/scan",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const extractedData = res.data.results[0]?.data;
        if (!extractedData) {
          throw new Error("No data extracted");
        }

        // Construct updated ticket
        const updatedTicket: TicketData = {
          ...newTicket,
          status: "extracted",
          responseData: extractedData,
          manualData: {
            customerId: "",
            customerName: "",
            packageName: `${extractedData.route} - ${extractedData.document_type} Trip`,
            finalAmount: extractedData.booking_amount,
            discount: 0,
            advanceReceived: 0,
            receivableAmount: extractedData.booking_amount,
            bookingStatus: "Generated",
          },
        };

        // Update local state
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? updatedTicket : ticket
          )
        );

        // Save to Firebase
        await saveTicketToFirebase(updatedTicket);
      } catch (error) {
        console.error("Error processing file:", error);
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status: "error" } : ticket
          )
        );
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // const handleFileUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const files = event.target.files;
  //   if (!files || files.length === 0) return;

  //   setIsUploading(true);

  //   for (const file of files) {
  //     if (file.type !== "application/pdf") {
  //       alert("Please upload only PDF files");
  //       continue;
  //     }

  //     const formData = new FormData();
  //     formData.append("files", file); // send under "files" key

  //   try {
  //     const res = await axios.post(
  //       "https://ai-pass-scan.onrender.com/scan",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );

  //     console.log("Upload successful:", res.data);
  //   } catch (error) {
  //     console.error("Upload failed:", error);
  //   }
  // }

  //   setIsUploading(false);

  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  const handleEditTicket = (ticket: TicketData) => {
    console.log("🚀 ~ handleEditTicket ~ ticket:", ticket);
    setSelectedTicket(ticket);
    if (ticket?.manualData) {
      setEditData({
        customerId: ticket.manualData.customerId || "",
        customerName: ticket.manualData.customerName || "",
        packageName: ticket.manualData.packageName || "",
        finalAmount:
          parseFloat(ticket.manualData.finalAmount?.replace(/[^\d.]/g, "")) ||
          0,
        discount: ticket.manualData.discount ?? 0,
        advanceReceived: ticket.manualData.advanceReceived ?? 0,
        bookingStatus:
          (ticket.manualData.bookingStatus as BookingStatus) || "Generated",
      });
    }

    setIsEditModalOpen(true);
  };

  const updateField = <K extends keyof EditData>(
    field: K,
    value: EditData[K]
  ) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // const handleEditTicket = (ticket: TicketData) => {
  //   setSelectedTicket(ticket);
  //   setEditData(
  //     ticket.manualData || {
  //       customerId: "",
  //       customerName: "",
  //       packageName: "",
  //       finalAmount: 0,
  //       discount: 0,
  //       advanceReceived: 0,
  //       receivableAmount: 0,
  //       bookingStatus: "Generated",
  //     }
  //   );
  //   setIsEditModalOpen(true);
  // };

  // const handleSaveTicket = () => {
  //   if (!selectedTicket) return;

  //   const receivableAmount =
  //     editData.finalAmount - editData.discount - editData.advanceReceived;

  //   setTickets((prev) =>
  //     prev.map((ticket) =>
  //       ticket.id === selectedTicket.id
  //         ? {
  //             ...ticket,
  //             status: "draft",
  //             manualData: {
  //               ...editData,
  //               receivableAmount,
  //             },
  //           }
  //         : ticket
  //     )
  //   );

  //   setIsEditModalOpen(false);
  // };

  // const handleFinalizeBooking = (ticket: TicketData) => {
  //   if (!ticket.extractedData || !ticket.manualData) return;

  //   const customer = customers.find(
  //     (c) => c.customer_id === ticket.manualData!.customerId
  //   );
  //   if (!customer) {
  //     alert("Please select a customer");
  //     return;
  //   }

  //   // Create booking
  //   const bookingData = {
  //     customer_id: ticket.manualData.customerId,
  //     customer_name: customer.full_name,
  //     package_name: ticket.manualData.packageName,
  //     booking_date: ticket.extractedData.bookingDate,
  //     travel_start_date: ticket.extractedData.journeyDate,
  //     travel_end_date:
  //       ticket.extractedData.returnDate || ticket.extractedData.journeyDate,
  //     pax_count: ticket.extractedData.paxList.length,
  //     total_amount: ticket.manualData.finalAmount,
  //     advance_received: ticket.manualData.advanceReceived,
  //     balance_amount: ticket.manualData.receivableAmount,
  //     status: "confirmed" as const,
  //     pnr: ticket.extractedData.pnr,
  //     ticketId: ticket.id,
  //   };

  //   addBooking(bookingData);

  //   setTickets((prev) =>
  //     prev.map((t) =>
  //       t.id === ticket.id
  //         ? {
  //             ...t,
  //             status: "finalized",
  //             linkedBookingId: "generated-booking-id",
  //           }
  //         : t
  //     )
  //   );

  //   alert("Booking created successfully!");
  // };

  // const handleAddNewCustomer = () => {
  //   addCustomer(newCustomerData);
  //   setNewCustomerData({
  //     full_name: "",
  //     email: "",
  //     phone: "",
  //     address: "",
  //     passport_no: "",
  //     gstin: "",
  //   });
  //   setIsAddCustomerModalOpen(false);
  // };

  // const handleDeleteTicket = (ticketId: string) => {
  //   if (window.confirm("Are you sure you want to delete this ticket?")) {
  //     setTickets((prev) => prev.filter((t) => t.id !== ticketId));
  //   }
  // };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.extractedData?.pnr
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.manualData?.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Loader className="w-4 h-4 animate-spin" />;
      case "extracted":
        return <Bot className="w-4 h-4" />;
      case "draft":
        return <Edit className="w-4 h-4" />;
      case "finalized":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "processing":
        return "info";
      case "extracted":
        return "warning";
      case "draft":
        return "default";
      case "finalized":
        return "success";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ticket Upload & Billing Automation
          </h1>
          <p className="text-gray-600">
            AI-powered ticket processing and automatic booking creation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            icon={Upload}
            disabled={isUploading}
          >
            {isUploading ? "Processing..." : "Upload Tickets"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{tickets.length}</p>
            <p className="text-sm text-gray-600">Total Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">
              {
                tickets.filter(
                  (t) =>
                    t.status === "extracted" ||
                    t.status === "draft" ||
                    t.status === "finalized"
                ).length
              }
            </p>
            <p className="text-sm text-gray-600">AI Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {tickets.filter((t) => t.status === "finalized").length}
            </p>
            <p className="text-sm text-gray-600">Finalized</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Loader className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">
              {tickets.filter((t) => t.status === "processing").length}
            </p>
            <p className="text-sm text-gray-600">Processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tickets, PNR, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="processing">Processing</option>
              <option value="extracted">AI Extracted</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900 truncate">
                    {ticket.fileName}
                  </span>
                </div>
                <Badge
                  variant={getStatusVariant(ticket.status) as any}
                  size="sm"
                >
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(ticket.status)}
                    <span className="capitalize">{ticket.status}</span>
                  </div>
                </Badge>
              </div>

              {ticket.responseData && (
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      AI Extracted Data
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">PNR:</span>{" "}
                        {ticket.responseData.pnr_booking_id}
                      </p>
                      <p>
                        <span className="font-medium">PAX:</span>{" "}
                        {ticket.responseData.passenger_list.length} passengers
                      </p>
                      <p>
                        <span className="font-medium">Route:</span>{" "}
                        {ticket.responseData.route}
                      </p>
                      <p>
                        <span className="font-medium">Journey:</span>{" "}
                        {ticket.responseData.journey_date
                          ? new Date(
                              ticket.responseData.journey_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Amount:</span> ₹
                        {ticket.responseData.booking_amount.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span>{" "}
                        {ticket.responseData.document_type}
                      </p>
                    </div>
                  </div>

                  {ticket.manualData && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Manual Entry
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Customer:</span>{" "}
                          {ticket.manualData.customerName || "Not selected"}
                        </p>
                        <p>
                          <span className="font-medium">Package:</span>{" "}
                          {ticket.manualData.packageName}
                        </p>
                        <p>
                          <span className="font-medium">Final Amount:</span> ₹
                          {ticket.manualData.finalAmount.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Receivable:</span> ₹
                          {ticket.manualData.receivableAmount.toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {ticket.manualData.bookingStatus}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  {ticket.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => window.open(ticket.pdfUrl, "_blank")}
                    />
                  )}
                  {ticket.status === "extracted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit}
                      onClick={() => handleEditTicket(ticket)}
                    />
                  )}
                  {/*
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteTicket(ticket.id)}
                  /> */}
                </div>
                {/* {ticket.status === "draft" && (
                  <Button
                    size="sm"
                    onClick={() => handleFinalizeBooking(ticket)}
                  >
                    Finalize Booking
                  </Button>
                )} */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Ticket Details"
        size="xl"
      >
        <div className="space-y-6">
          {selectedTicket?.responseData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                AI Extracted Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <span className="font-medium">PNR:</span>{" "}
                    {selectedTicket.responseData.pnr_booking_id}
                  </p>
                  {/* <p>
                    <span className="font-medium">Booking Date:</span>{" "}
                    {new Date(
                      selectedTicket.responseData.bookingDate
                    ).toLocaleDateString()}
                  </p> */}
                  <p>
                    <span className="font-medium">Journey Date:</span>{" "}
                    {new Date(
                      selectedTicket.responseData.journey_date
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Journey Time:</span>{" "}
                    {selectedTicket.responseData.journey_time}
                  </p>
                </div>
                <div>
                  {/* <p>
                    <span className="font-medium">Return Date:</span>{" "}
                    {selectedTicket.responseData.returnDate
                      ? new Date(
                          selectedTicket.responseData.returnDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </p> */}
                  <p>
                    <span className="font-medium">Booking Amount:</span> ₹
                    {selectedTicket.responseData.booking_amount.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {selectedTicket.responseData.travel_class}
                  </p>
                  <p>
                    <span className="font-medium">Route:</span>{" "}
                    {selectedTicket.responseData.route}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <h5 className="font-medium text-gray-900 mb-2">
                  Passenger List
                </h5>
                <div className="space-y-1">
                  {selectedTicket.responseData.passenger_list.map(
                    (pax, index) => (
                      <p key={index} className="text-sm">
                        {index + 1}. {pax.name}{" "}
                        {pax.primary && (
                          <Badge variant="info" size="sm">
                            Primary
                          </Badge>
                        )}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <div className="flex space-x-2">
                <select
                  value={editData.customerId}
                  onChange={(e) => {
                    const customer = customers.find(
                      (c) => c.customer_id === e.target.value
                    );
                    updateField("customerId", e.target.value);
                    updateField("customerName", customer?.full_name || "");
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  {mockData.customers.map((customer) => (
                    <option
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.full_name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => setIsAddCustomerModalOpen(true)}
                />
              </div>
            </div>

            {/* Package Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name *
              </label>
              <input
                type="text"
                value={editData.packageName}
                onChange={(e) => updateField("packageName", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Final Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final Amount *
              </label>
              <input
                type="number"
                value={editData.finalAmount}
                onChange={(e) =>
                  updateField("finalAmount", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                value={editData.discount}
                onChange={(e) =>
                  updateField("discount", parseFloat(e.target.value) || 0)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Advance Received */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Received
              </label>
              <input
                type="number"
                value={editData.advanceReceived}
                onChange={(e) =>
                  updateField(
                    "advanceReceived",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Booking Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking Status
              </label>
              <select
                value={editData.bookingStatus}
                onChange={(e) =>
                  updateField("bookingStatus", e.target.value as BookingStatus)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Generated">Generated</option>
                <option value="Under Review">Under Review</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Calculation Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p>Final Amount: ₹{editData.finalAmount.toLocaleString()}</p>
                <p>Discount: ₹{editData.discount.toLocaleString()}</p>
                <p>Advance: ₹{editData.advanceReceived.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-blue-900">
                  Receivable Amount: ₹{" "}
                  {(
                    editData.finalAmount -
                    editData.discount -
                    editData.advanceReceived
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            {/* <Button onClick={handleSaveTicket} icon={Save}>
              Save as Draft
            </Button> */}
          </div>
        </div>
      </Modal>
      {/* Add Customer Modal */}
      {/* <Modal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        title="Add New Customer"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newCustomerData.full_name}
                onChange={(e) =>
                  setNewCustomerData({
                    ...newCustomerData,
                    full_name: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newCustomerData.email}
                onChange={(e) =>
                  setNewCustomerData({
                    ...newCustomerData,
                    email: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={newCustomerData.phone}
                onChange={(e) =>
                  setNewCustomerData({
                    ...newCustomerData,
                    phone: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passport Number
              </label>
              <input
                type="text"
                value={newCustomerData.passport_no}
                onChange={(e) =>
                  setNewCustomerData({
                    ...newCustomerData,
                    passport_no: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={newCustomerData.address}
              onChange={(e) =>
                setNewCustomerData({
                  ...newCustomerData,
                  address: e.target.value,
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsAddCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewCustomer}>Add Customer</Button>
          </div>
        </div>
      </Modal> */}
    </div>
  );
};

export default TicketUploadManager;
