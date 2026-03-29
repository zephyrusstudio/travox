import { Edit, FileText, Trash2 } from "lucide-react";
import React from "react";
import { SearchField } from "../../design-system/primitives";
import { CustomerTableProps } from "../../types";
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

const CustomerTable: React.FC<CustomerTableProps> & {
  SearchBox: React.FC<SearchBoxProps>;
} = ({ customers, onEdit, onDelete, onViewTickets }) => {
  return (
    <Card className="overflow-hidden rounded-2xl border-gray-200/80 shadow-sm dark:border-gray-700">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
          <span className="font-medium">
            Showing {customers.length} customer{customers.length === 1 ? "" : "s"}
          </span>
          <span>Use actions to open bookings, edit, or delete.</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 dark:bg-gray-900">
              <TableCell header>Name</TableCell>
              <TableCell header>Contact</TableCell>
              <TableCell header>GSTIN</TableCell>
              <TableCell header>Bookings</TableCell>
              <TableCell header>Total Spent</TableCell>
              <TableCell header>Created</TableCell>
              <TableCell header>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {customer.name}
                      </p>
                      {customer.passportNo && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Passport: {customer.passportNo}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {customer.email && (
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.gstin ? (
                      <Badge variant="info" size="sm">
                        {customer.gstin}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {customer.totalBookings} booking
                      {customer.totalBookings !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{customer.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(customer.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={FileText}
                        onClick={() => onViewTickets(customer)}
                        title="View Ticket History"
                      >
                        Bookings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEdit(customer)}
                        title="Edit Customer"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDelete(customer.id)}
                        title="Delete Customer"
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

// Search box kept identical classes and structure
export type SearchBoxProps = { value: string; onChange: (v: string) => void };
const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange }) => (
  <SearchField
    value={value}
    onChange={onChange}
    placeholder="Search customers by name, phone, email, or passport"
  />
);

CustomerTable.SearchBox = SearchBox;
export default CustomerTable;
