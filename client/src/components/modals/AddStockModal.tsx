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
import * as InventoryService from '@/lib/inventory-service';
import * as SupplierService from '@/lib/supplier-service';
import * as TransactionService from '@/lib/transaction-service';

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
      
      // 1. Fetch current inventory items from Firestore
      const inventoryItems = await InventoryService.getInventoryItems();
      console.log('Retrieved inventory items from Firestore:', inventoryItems);
      
      const existingItem = inventoryItems.find((item: any) => item.type === type);
      
      // 2. Update or add inventory in Firestore
      let inventoryResult;
      if (existingItem) {
        // Update existing inventory in Firestore
        console.log(`Updating existing inventory item: ${existingItem.id}`);
        inventoryResult = await InventoryService.updateInventoryItem(existingItem.id, {
          quantity: existingItem.quantity + qtyNum,
          rate: rateNum // Update with latest rate
        });
      } else {
        // Create new inventory item in Firestore
        console.log('Creating new inventory item');
        inventoryResult = await InventoryService.addInventoryItem({
          type,
          quantity: qtyNum,
          rate: rateNum
        });
      }
      
      console.log('Inventory operation result:', inventoryResult);
      
      // 3. Update supplier debt in Firestore
      const selectedSupplier = suppliers.find(s => s.id === supplier);
      if (selectedSupplier) {
        const totalAmount = qtyNum * rateNum;
        const currentDebt = selectedSupplier.debt || 0;
        const newDebt = currentDebt + totalAmount;
        
        console.log(`Updating supplier ${supplier} debt from ${currentDebt} to ${newDebt}`);
        
        // Update supplier in Firestore
        const supplierResult = await SupplierService.updateSupplier(supplier, {
          debt: newDebt
        });
        
        console.log('Supplier update result:', supplierResult);
        
        // Also create a transaction record
        const transactionResult = await TransactionService.addTransaction({
          type: 'expense',
          amount: totalAmount,
          entityId: supplier,
          entityType: 'supplier',
          description: `Stock purchase: ${qtyNum} kg of ${type} at ₹${rateNum}/kg`
        });
        
        console.log('Transaction created:', transactionResult);
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
      <DialogContent className="max-w-[450px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Add new stock items to your inventory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Supplier Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="stock-supplier" className="text-sm font-medium sm:text-right">
              Supplier
            </Label>
            <div className="sm:col-span-3">
              <Select 
                value={supplier} 
                onValueChange={setSupplier}
              >
                <SelectTrigger className="w-full">
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
          
          {/* Item Type */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="stock-type" className="text-sm font-medium sm:text-right">
              Item Type
            </Label>
            <div className="sm:col-span-3">
              <Select 
                value={type} 
                onValueChange={setType}
              >
                <SelectTrigger className="w-full">
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
          
          {/* Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="stock-quantity" className="text-sm font-medium sm:text-right">
              Quantity (kg)
            </Label>
            <Input
              id="stock-quantity"
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="sm:col-span-3"
              placeholder="0.00"
            />
          </div>
          
          {/* Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="stock-rate" className="text-sm font-medium sm:text-right">
              Rate (₹ per kg)
            </Label>
            <Input
              id="stock-rate"
              type="number"
              step="0.01"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="sm:col-span-3"
              placeholder="0.00"
            />
          </div>
          
          {/* Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="stock-total" className="text-sm font-medium sm:text-right">
              Total Amount (₹)
            </Label>
            <Input
              id="stock-total"
              type="text"
              value={total}
              className="sm:col-span-3 bg-slate-50"
              disabled
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Adding...' : 'Add Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
