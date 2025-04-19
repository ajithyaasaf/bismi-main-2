import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
}

export default function AddStockModal({ isOpen, onClose, suppliers }: AddStockModalProps) {
  const [supplier, setSupplier] = useState('');
  const [type, setType] = useState('chicken');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('');
  const [total, setTotal] = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Item types
  const itemTypes = [
    { value: 'chicken', label: 'Chicken' },
    { value: 'eeral', label: 'Eeral' },
    { value: 'leg-piece', label: 'Leg Piece' },
    { value: 'goat', label: 'Goat' },
    { value: 'kadai', label: 'Kadai' },
    { value: 'beef', label: 'Beef' }
  ];
  
  // Calculate total when quantity or rate changes
  useEffect(() => {
    if (quantity && rate) {
      const totalValue = parseFloat(quantity) * parseFloat(rate);
      setTotal(totalValue.toFixed(2));
    } else {
      setTotal('0.00');
    }
  }, [quantity, rate]);
  
  // Reset form
  const resetForm = () => {
    setSupplier('');
    setType('chicken');
    setQuantity('');
    setRate('');
    setTotal('0.00');
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate inputs
      if (!supplier) {
        toast({
          title: "Missing supplier",
          description: "Please select a supplier",
          variant: "destructive"
        });
        return;
      }
      
      if (!type) {
        toast({
          title: "Missing item type",
          description: "Please select an item type",
          variant: "destructive"
        });
        return;
      }
      
      const qtyNum = parseFloat(quantity);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid positive quantity",
          variant: "destructive"
        });
        return;
      }
      
      const rateNum = parseFloat(rate);
      if (isNaN(rateNum) || rateNum <= 0) {
        toast({
          title: "Invalid rate",
          description: "Please enter a valid positive rate",
          variant: "destructive"
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // 1. Check if inventory item already exists
      const inventory = await queryClient.fetchQuery({
        queryKey: ['/api/inventory'],
        queryFn: async () => {
          const res = await fetch('/api/inventory');
          return res.json();
        }
      });
      
      const existingItem = inventory.find((item: any) => item.type === type);
      
      // 2. Update inventory
      if (existingItem) {
        // Update existing inventory
        await apiRequest('PUT', `/api/inventory/${existingItem.id}`, {
          quantity: existingItem.quantity + qtyNum,
          rate: rateNum // Update with latest rate
        });
      } else {
        // Create new inventory item
        await apiRequest('POST', '/api/inventory', {
          type,
          quantity: qtyNum,
          rate: rateNum
        });
      }
      
      // 3. Update supplier debt
      const selectedSupplier = suppliers.find(s => s.id === supplier);
      if (selectedSupplier) {
        const totalAmount = qtyNum * rateNum;
        const newDebt = selectedSupplier.debt + totalAmount;
        
        await apiRequest('PUT', `/api/suppliers/${supplier}`, {
          debt: newDebt
        });
      }
      
      // Show success message
      toast({
        title: "Stock added",
        description: `Added ${qtyNum} kg of ${type} to inventory`
      });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      
      // Close modal and reset form
      resetForm();
      onClose();
      
    } catch (error) {
      toast({
        title: "Error adding stock",
        description: "There was an error adding stock to inventory",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Add new stock items to your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-supplier" className="text-right">
              Supplier
            </Label>
            <div className="col-span-3">
              <Select 
                value={supplier} 
                onValueChange={setSupplier}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-type" className="text-right">
              Item Type
            </Label>
            <div className="col-span-3">
              <Select 
                value={type} 
                onValueChange={setType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map(item => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-quantity" className="text-right">
              Quantity (kg)
            </Label>
            <Input
              id="stock-quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-rate" className="text-right">
              Rate (₹ per kg)
            </Label>
            <Input
              id="stock-rate"
              type="number"
              step="0.01"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock-total" className="text-right">
              Total Amount (₹)
            </Label>
            <Input
              id="stock-total"
              type="text"
              value={total}
              className="col-span-3"
              disabled
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
