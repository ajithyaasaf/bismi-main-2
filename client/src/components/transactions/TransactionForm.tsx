import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Supplier, Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  customers: Customer[];
}

export default function TransactionForm({ isOpen, onClose, suppliers, customers }: TransactionFormProps) {
  const [entityType, setEntityType] = useState('supplier');
  const [entityId, setEntityId] = useState('');
  const [type, setType] = useState('payment');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle entity type change
  const handleEntityTypeChange = (value: string) => {
    setEntityType(value);
    setEntityId(''); // Reset entity selection when type changes
    
    // Also reset transaction type based on entity type
    if (value === 'supplier') {
      setType('payment');
    } else {
      setType('receipt');
    }
  };
  
  // Handle transaction type change
  const handleTypeChange = (value: string) => {
    setType(value);
  };
  
  // Get entity options based on type
  const getEntityOptions = () => {
    if (entityType === 'supplier') {
      return suppliers;
    } else {
      return customers;
    }
  };
  
  // Get entity name from ID
  const getEntityName = (id: string) => {
    const entity = getEntityOptions().find(e => e.id === id);
    return entity ? entity.name : '';
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate
    if (!entityId) {
      toast({
        title: entityType === 'supplier' ? "Supplier required" : "Customer required",
        description: `Please select a ${entityType}`,
        variant: "destructive",
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Amount must be a valid positive number",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data
      const transactionData = {
        entityId,
        entityType,
        amount: amountValue,
        type,
        date: new Date(),
        description: description || `${type === 'payment' ? 'Payment to' : 'Receipt from'} ${getEntityName(entityId)}`
      };
      
      // Create transaction
      await apiRequest('POST', '/api/transactions', transactionData);
      
      // Show success message
      toast({
        title: "Transaction created",
        description: `Transaction has been recorded successfully`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Also invalidate suppliers or customers cache
      if (entityType === 'supplier') {
        queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      }
      
      // Close modal
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add New Transaction
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entity-type" className="text-right">
              Entity Type
            </Label>
            <div className="col-span-3">
              <Select 
                value={entityType} 
                onValueChange={handleEntityTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="entity" className="text-right">
              {entityType === 'supplier' ? 'Supplier' : 'Customer'}
            </Label>
            <div className="col-span-3">
              <Select 
                value={entityId} 
                onValueChange={setEntityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${entityType}`} />
                </SelectTrigger>
                <SelectContent>
                  {getEntityOptions().map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>{entity.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="transaction-type" className="text-right">
              Transaction
            </Label>
            <div className="col-span-3">
              <Select 
                value={type} 
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {entityType === 'supplier' ? (
                    <SelectItem value="payment">Payment (To Supplier)</SelectItem>
                  ) : (
                    <SelectItem value="receipt">Receipt (From Customer)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional description"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
