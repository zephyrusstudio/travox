/* eslint-disable @typescript-eslint/no-explicit-any */
import { Building2, Edit, Trash2 } from "lucide-react";
import React from "react";
import { Vendor } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";

export type VendorGridProps = {
  vendors: Vendor[];
  onEdit: (v: Vendor) => void;
  onDelete: (vendorId: string) => void;
  onManageAccount: (v: Vendor) => void;
  getVendorExpenseTotal: (vendorId: string) => number;
};

const getServiceTypeVariant = (serviceType: string) => {
  switch (serviceType.toLowerCase()) {
    case "flight":
      return "info";
    case "hotel":
      return "success";
    case "visa":
      return "warning";
    default:
      return "default";
  }
};

const VendorGrid: React.FC<VendorGridProps> = ({
  vendors,
  onEdit,
  onDelete,
  onManageAccount,
  getVendorExpenseTotal,
}) => {
  if (vendors?.length === 0) return;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => {
        const totalExpenses = getVendorExpenseTotal(vendor.id);
        return (
          <Card key={vendor.id} hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {vendor.name}
                    </h3>
                    <Badge
                      variant={getServiceTypeVariant(vendor.serviceType) as any}
                      size="sm"
                    >
                      {vendor.serviceType}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => onEdit(vendor)}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => onDelete(vendor.id)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {vendor.pocName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span>{" "}
                    {vendor.pocName}
                  </p>
                )}
                {vendor.email && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {vendor.email}
                  </p>
                )}
                {vendor.phone && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {vendor.phone}
                  </p>
                )}

                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Expenses:</span>
                    <span className="text-green-600 font-semibold ml-2">
                      ₹{totalExpenses.toLocaleString()}
                    </span>
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Account:{" "}
                      {vendor.accountId ? (
                        <span className="text-green-600 font-medium">
                          Linked
                        </span>
                      ) : (
                        <span className="text-gray-400">Not linked</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VendorGrid;
