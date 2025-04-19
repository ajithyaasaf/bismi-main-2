import { Inventory } from "@shared/schema";
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

interface InventoryListProps {
  items: Inventory[];
  onEdit: (item: Inventory) => void;
  onDelete: (item: Inventory) => void;
}

export default function InventoryList({ items, onEdit, onDelete }: InventoryListProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <i className="fas fa-boxes text-gray-400 text-4xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-900">No inventory items found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your first item to get started</p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to format type names properly
  const formatType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity (kg)</TableHead>
              <TableHead className="text-right">Rate (₹/kg)</TableHead>
              <TableHead className="text-right">Value (₹)</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{formatType(item.type)}</TableCell>
                <TableCell className={`text-right ${item.quantity < 5 ? 'text-amber-600 font-medium' : ''} ${item.quantity < 2 ? 'text-red-600 font-medium' : ''}`}>
                  {item.quantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ₹{item.rate.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ₹{(item.quantity * item.rate).toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(item)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => onDelete(item)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
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
