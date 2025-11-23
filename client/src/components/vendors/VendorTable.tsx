import { Building2, Edit, Search, Trash2, Wallet } from "lucide-react";
import React from "react";
import { Vendor } from "../../types";
import { formatDate } from "../../utils/misc";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";

export type VendorTableProps = {
  vendors: Vendor[];
  onEdit: (v: Vendor) => void;
  onDelete: (vendorId: string) => void;
  onManageAccount: (v: Vendor) => void;
  getVendorExpenseTotal: (vendorId: string) => number;
  totalExpense: number;
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

const VendorTable: React.FC<VendorTableProps> & {
  SearchBox: React.FC<SearchBoxProps>;
} = ({ vendors, onEdit, onDelete, onManageAccount, getVendorExpenseTotal }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">All Vendors</h3>
        <p className="text-sm text-gray-600">
          Manage your travel service providers and suppliers
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Name</TableCell>
              <TableCell header>Service Type</TableCell>
              <TableCell header>Contact</TableCell>
              <TableCell header>Total Expenses</TableCell>
              <TableCell header>Account Status</TableCell>
              <TableCell header>Created</TableCell>
              <TableCell header>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => {
              return (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {vendor.name}
                        </p>
                        {vendor.description && (
                          <p className="text-sm text-gray-500">
                            {vendor.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={getServiceTypeVariant(vendor.serviceType) as any}
                      size="sm"
                    >
                      {vendor.serviceType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {vendor.pocName && (
                        <p className="text-sm text-gray-900">
                          {vendor.pocName}
                        </p>
                      )}
                      {vendor.email && (
                        <p className="text-sm text-gray-600">
                          {vendor.email}
                        </p>
                      )}
                      {vendor.phone && (
                        <p className="text-sm text-gray-600">
                          {vendor.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-green-600">
                      ₹{vendor?.totalExpense?.toLocaleString('en-IN') || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {vendor.accountId ? (
                      <Badge variant="success" size="sm">
                        Linked
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Not Linked
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(vendor.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Wallet}
                        onClick={() => onManageAccount(vendor)}
                        title="Manage Account"
                      >
                        Account
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEdit(vendor)}
                        title="Edit Vendor"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDelete(vendor.id)}
                        title="Delete Vendor"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Search box component
export type SearchBoxProps = { value: string; onChange: (v: string) => void };
const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search vendors..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

VendorTable.SearchBox = SearchBox;
export default VendorTable;