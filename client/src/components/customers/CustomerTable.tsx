import { Edit, FileText, Search, Trash2 } from "lucide-react";
import React from "react";
import { Customer } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader } from "../ui/Card";
import Table, {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/Table";

export type CustomerTableProps = {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  onViewTickets: (c: Customer) => void;
  getBookingsByCustomer: (id: string) => any[];
};

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN");

const CustomerTable: React.FC<CustomerTableProps> & {
  SearchBox: React.FC<SearchBoxProps>;
} = ({ customers, onEdit, onDelete, onViewTickets, getBookingsByCustomer }) => {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
        <p className="text-sm text-gray-600">
          Manage customer information and view booking history
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell header>Name</TableCell>
              <TableCell header>Contact</TableCell>
              <TableCell header>GSTIN</TableCell>
              <TableCell header>Bookings</TableCell>
              <TableCell header>Created</TableCell>
              <TableCell header>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const bookings = getBookingsByCustomer(customer.customer_id);
              return (
                <TableRow key={customer.customer_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.full_name}
                      </p>
                      {customer.passport_number && (
                        <p className="text-sm text-gray-500">
                          Passport: {customer.passport_number}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {customer.email && (
                        <p className="text-sm text-gray-900">
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-gray-600">
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
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {bookings.length} booking
                      {bookings.length !== 1 ? "s" : ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatDate(customer.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={FileText}
                        onClick={() => onViewTickets(customer)}
                        title="View Ticket History"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEdit(customer)}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onDelete(customer.customer_id)}
                      />
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
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input
      type="text"
      placeholder="Search customers..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);

CustomerTable.SearchBox = SearchBox;
export default CustomerTable;
