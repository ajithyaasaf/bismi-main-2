import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as SupplierService from "@/lib/supplier-service"; // Import Supplier Firestore service

interface SupplierFormProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SupplierForm({ supplier, isOpen, onClose }: SupplierFormProps) {
  const [name, setName] = useState(supplier?.name || "");
  const [contact, setContact] = useState(supplier?.contact || "");
  const [debt, setDebt] = useState(supplier?.debt.toString() || "0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = Boolean(supplier);
  
  const handleSubmit = async () => {
    // Validate
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a supplier name",
        variant: "destructive",
      });
      return;
    }
    
    const debtValue = parseFloat(debt);
    if (isNaN(debtValue) || debtValue < 0) {
      toast({
        title: "Invalid debt value",
        description: "Debt must be a valid positive number or zero",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data
      const supplierData = {
        name,
        contact,
        debt: debtValue,
      };
      
      if (isEditing && supplier) {
        // First update directly in Firestore
        try {
          await SupplierService.updateSupplier(supplier.id, supplierData);
          console.log("Supplier updated in Firestore successfully");
        } catch (firestoreError) {
          console.error("Error updating supplier in Firestore:", firestoreError);
        }
        
        // Then update via API for backward compatibility
        await apiRequest('PUT', `/api/suppliers/${supplier.id}`, supplierData);
        
        toast({
          title: "Supplier updated",
          description: `${name} has been updated successfully`,
        });
      } else {
        // First create directly in Firestore
        try {
          const newSupplier = await SupplierService.addSupplier(supplierData);
          console.log("Supplier added to Firestore successfully:", newSupplier);
        } catch (firestoreError) {
          console.error("Error adding supplier to Firestore:", firestoreError);
        }
        
        // Then create via API for backward compatibility
        await apiRequest('POST', '/api/suppliers', supplierData);
        
        toast({
          title: "Supplier added",
          description: `${name} has been added successfully`,
        });
      }
      
      // Refresh suppliers data
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Error in supplier form submission:", error);
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update supplier" 
          : "Failed to add supplier",
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
            {isEditing ? `Edit Supplier: ${supplier?.name}` : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Enter supplier name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contact" className="text-right">
              Contact
            </Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="col-span-3"
              placeholder="Enter contact details"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="debt" className="text-right">
              Debt (₹)
            </Label>
            <Input
              id="debt"
              type="number"
              value={debt}
              onChange={(e) => setDebt(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              min="0"
              step="0.01"
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
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
