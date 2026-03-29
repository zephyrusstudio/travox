import { Edit, Trash2, Wallet } from "lucide-react";
import React from "react";
import { SearchField } from "../../design-system/primitives";
import { Vendor } from "../../types";
import { formatDate } from "../../utils/misc";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent } from "../ui/Card";
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
};

const getServiceTypeVariant = (serviceType: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
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
  const safeVendors = Array.isArray(vendors) ? vendors : [];
  return (
    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
          <span className="font-medium">
            Showing {safeVendors.length} vendor{safeVendors.length === 1 ? "" : "s"}
          </span>
          <span>Manage account linkage and vendor profile actions from this table.</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 dark:bg-gray-900">
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
            {safeVendors.map((vendor) => {
              return (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
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
                      variant={getServiceTypeVariant(vendor.serviceType)}
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
                      ₹{getVendorExpenseTotal(vendor.id).toLocaleString('en-IN')}
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
                    <div className="flex flex-wrap items-center gap-2">
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
  <SearchField
    value={value}
    onChange={onChange}
    placeholder="Search vendors by name, type, or contact"
  />
);

VendorTable.SearchBox = SearchBox;
export default VendorTable;
