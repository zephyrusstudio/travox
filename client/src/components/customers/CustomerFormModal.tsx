import axios from "axios";
import React, { useEffect, useState } from "react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export type CustomerFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  passport_no: string;
  aadhaar_no: string;
  visa_no: string;
  gstin: string;
};

export type CustomerFormModalProps = {
  isOpen: boolean;
  title: string;
  isEditing: boolean;
  selectedCustomer?: CustomerFormState | null;
  setSelectedCustomer: (customer: CustomerFormState | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
};

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyN2Y1cEJEblRVYlNtQXN6Y29CaiIsImVtYWlsIjoidGFtYWxjb2Rlc0BnbWFpbC5jb20iLCJyb2xlIjoiT3duZXIiLCJuYW1lIjoiVGFtYWwgRGFzIiwib3JnSWQiOiJ2M1h0WE81QTdOVzh3cTJBcFZDMCIsImlhdCI6MTc1NjUwMTQ5MywiZXhwIjoxNzU3NDAxNDkzLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20ifQ.AUJHcPzx2ijx-9DT9bHnt3_o7qJIQmFuCzZMoC8Pyg4tnJZ5AE62YrGRfat7hBVdaTodI1dXCWG5sKdhfuPbfPndqa8bGoyov9YidDbsP8tnp91xHZsjJdE2nyamrx2XAaNf9NRnrzPoXWtwf-0wGxncSlTM_bAfBFqgu1peMhACyRHSZoqXXRgWRyFJ0VqHKj2uzQ3X09rQ23tf3q38xCGIt0e57iNPhGBNw49pXmc_blgIA-tWp4gIypUE6QGvSVVNR3_bxWRRw87CoQQLe0xaKVb40grk7csDYD7pG7JnlL_efwWCZjsb_AL5vFKpyuoedCYkHJ-Vc_HN6fsMrw";

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  title,
  isEditing,
  selectedCustomer,
  setSelectedCustomer,
  setIsFormOpen,
}) => {
  const [formData, setFormData] = useState<CustomerFormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    passport_no: "",
    aadhaar_no: "",
    visa_no: "",
    gstin: "",
  });

  async function createCustomer() {
    const url = "http://localhost:3000/customers";

    const data = {
      name: formData?.name,
      email: formData?.email,
      phone: formData?.phone,
      address: formData?.address,
      passport_no: formData?.passport_no,
      aadhaar_no: formData?.aadhaar_no,
      visa_no: formData?.visa_no,
      gstin: formData?.gstin,
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response?.status === 201) {
        onClose();
      }

      return response.data;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  const submitForm: React.FormEventHandler = async (e) => {
    e.preventDefault();
    // if (selectedCustomer) {
    //   updateCustomer(selectedCustomer.customer_id, formData);
    // } else {
    //   addCustomer(formData);
    // }
    console.log(formData);
    await createCustomer();

    setSelectedCustomer(null);
  };

  const onClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      passport_no: "",
      aadhaar_no: "",
      visa_no: "",
      gstin: "",
    });
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  useEffect(() => {
    if (selectedCustomer === null) return;

    setFormData({
      name: selectedCustomer?.name || "",
      email: selectedCustomer?.email || "",
      phone: selectedCustomer?.phone || "",
      address: selectedCustomer?.address || "",
      passport_no: selectedCustomer?.passport_no || "",
      aadhaar_no: selectedCustomer?.aadhaar_no || "",
      visa_no: selectedCustomer?.visa_no || "",
      gstin: selectedCustomer?.gstin || "",
    });
  }, [selectedCustomer]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      title={title}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          submitForm(e);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
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
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
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
              value={formData.passport_no}
              onChange={(e) =>
                setFormData({ ...formData, passport_no: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) =>
                setFormData({ ...formData, gstin: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Number
            </label>
            <input
              type="text"
              value={formData.aadhaar_no}
              onChange={(e) =>
                setFormData({ ...formData, aadhaar_no: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visa Number
            </label>
            <input
              type="text"
              value={formData.visa_no}
              onChange={(e) =>
                setFormData({ ...formData, visa_no: e.target.value })
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
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
