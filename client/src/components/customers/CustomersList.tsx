import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomersListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayment: (customerId: string, customerName: string) => void;
}

export default function CustomersList({ 
  customers, 
  onEdit, 
  onDelete,
  onPayment 
}: CustomersListProps) {
  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <i className="fas fa-users text-gray-400 text-4xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your first customer to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Pending Amount</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${customer.type === 'hotel' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {customer.type === 'hotel' ? 'Hotel' : 'Random'}
                  </span>
                </TableCell>
                <TableCell>{customer.contact || "-"}</TableCell>
                <TableCell className={`text-right ${customer.pendingAmount > 0 ? 'text-amber-600 font-medium' : ''}`}>
                  ₹{customer.pendingAmount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(customer)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => onDelete(customer)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                    {customer.pendingAmount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600" 
                        onClick={() => onPayment(customer.id, customer.name)}
                      >
                        <i className="fas fa-money-bill-wave"></i>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
