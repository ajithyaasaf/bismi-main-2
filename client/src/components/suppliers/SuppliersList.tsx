import { Supplier } from "@shared/schema";
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

interface SuppliersListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onPayment: (supplierId: string, supplierName: string) => void;
}

export default function SuppliersList({ 
  suppliers, 
  onEdit, 
  onDelete,
  onPayment 
}: SuppliersListProps) {
  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <i className="fas fa-truck-loading text-gray-400 text-4xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-900">No suppliers found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your first supplier to get started</p>
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
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Debt</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contact || "-"}</TableCell>
                <TableCell className={`text-right ${supplier.debt > 0 ? 'text-red-600 font-medium' : ''}`}>
                  ₹{supplier.debt.toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(supplier)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => onDelete(supplier)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                    {supplier.debt > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600" 
                        onClick={() => onPayment(supplier.id, supplier.name)}
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
