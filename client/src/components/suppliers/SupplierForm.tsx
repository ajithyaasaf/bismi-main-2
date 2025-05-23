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
      
      // Check for Vercel deployment
      const isVercelDeployment = window.location.hostname.includes('.vercel.app') || 
                                window.location.hostname.includes('.replit.app');
      
      let firestoreSuccess = false;
      
      if (isEditing && supplier) {
        // First update directly in Firestore
        try {
          await SupplierService.updateSupplier(supplier.id, supplierData);
          console.log("Supplier updated in Firestore successfully");
          firestoreSuccess = true;
        } catch (firestoreError) {
          console.error("Error updating supplier in Firestore:", firestoreError);
        }
        
        // Then update via API for backward compatibility
        try {
          await apiRequest('PUT', `/api/suppliers/${supplier.id}`, supplierData);
          console.log("Supplier updated via API successfully");
        } catch (apiError: any) {
          // If we're in Vercel and the error is 405, treat as success if Firestore worked
          if (isVercelDeployment && apiError.message?.includes('405') && firestoreSuccess) {
            console.log("API returned 405 in Vercel but Firestore update succeeded");
          } else if (!firestoreSuccess) {
            // Only throw if neither operation succeeded
            throw apiError;
          }
        }
        
        toast({
          title: "Supplier updated",
          description: `${name} has been updated successfully`,
        });
      } else {
        // First create directly in Firestore
        try {
          const newSupplier = await SupplierService.addSupplier(supplierData);
          console.log("Supplier added to Firestore successfully:", newSupplier);
          firestoreSuccess = true;
        } catch (firestoreError) {
          console.error("Error adding supplier to Firestore:", firestoreError);
        }
        
        // Then create via API for backward compatibility
        try {
          await apiRequest('POST', '/api/suppliers', supplierData);
          console.log("Supplier added via API successfully");
        } catch (apiError: any) {
          // If we're in Vercel and the error is 405, treat as success if Firestore worked
          if (isVercelDeployment && apiError.message?.includes('405') && firestoreSuccess) {
            console.log("API returned 405 in Vercel but Firestore creation succeeded");
          } else if (!firestoreSuccess) {
            // Only throw if neither operation succeeded
            throw apiError;
          }
        }
        
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
      <DialogContent className="max-w-[450px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Supplier: ${supplier?.name}` : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="text-sm font-medium sm:text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:col-span-3"
              placeholder="Enter supplier name"
            />
          </div>
          
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="contact" className="text-sm font-medium sm:text-right">
              Contact
            </Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="sm:col-span-3"
              placeholder="Enter contact details"
            />
          </div>
          
          {/* Debt */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="debt" className="text-sm font-medium sm:text-right">
              Debt (₹)
            </Label>
            <Input
              id="debt"
              type="number"
              value={debt}
              onChange={(e) => setDebt(e.target.value)}
              className="sm:col-span-3"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
