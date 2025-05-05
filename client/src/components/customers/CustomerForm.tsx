import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as CustomerService from "@/lib/customer-service";  // Import dedicated Customer service

interface CustomerFormProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerForm({ customer, isOpen, onClose }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [type, setType] = useState(customer?.type || "hotel");
  const [contact, setContact] = useState(customer?.contact || "");
  const [pendingAmount, setPendingAmount] = useState(customer?.pendingAmount?.toString() || "0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = Boolean(customer);
  
  const handleSubmit = async () => {
    // Validate
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a customer name",
        variant: "destructive",
      });
      return;
    }
    
    const pendingValue = parseFloat(pendingAmount);
    if (isNaN(pendingValue) || pendingValue < 0) {
      toast({
        title: "Invalid pending amount",
        description: "Pending amount must be a valid positive number or zero",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data
      const customerData = {
        name,
        type,
        contact,
        pendingAmount: pendingValue,
      };
      
      console.log("Saving customer data directly to Firestore:", customerData);
      
      if (isEditing && customer) {
        // First try the API for consistency with the rest of the app
        try {
          await apiRequest('PUT', `/api/customers/${customer.id}`, customerData);
          console.log("Customer updated via API");
        } catch (apiError) {
          console.log("API update failed, using direct Firestore update", apiError);
          // Fallback: Update directly in Firestore
          const result = await CustomerService.updateCustomer(customer.id, customerData);
          console.log("Customer updated directly in Firestore:", result);
        }
        
        toast({
          title: "Customer updated",
          description: `${name} has been updated successfully`,
        });
      } else {
        // Always add to Firestore directly for new customers
        try {
          // Directly add to Firestore for most reliable operation
          const result = await CustomerService.addCustomer(customerData);
          console.log("Customer added to Firestore:", result);
          
          // Also try the API to keep the server data in sync (but don't fail if it errors)
          try {
            await apiRequest('POST', '/api/customers', customerData);
            console.log("Customer also saved via API");
          } catch (apiError) {
            console.log("API creation failed, but Firestore update succeeded", apiError);
          }
          
          toast({
            title: "Customer added",
            description: `${name} has been added successfully`,
          });
        } catch (firestoreError) {
          console.error("Firestore save failed, trying API as fallback", firestoreError);
          
          // Firestore failed, try API as fallback
          await apiRequest('POST', '/api/customers', customerData);
          console.log("Customer saved via API fallback");
          
          toast({
            title: "Customer added",
            description: `${name} has been added successfully (via server)`,
          });
        }
      }
      
      // Refresh customers data
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update customer" 
          : "Failed to add customer",
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
            {isEditing ? `Edit Customer: ${customer?.name}` : "Add New Customer"}
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
              placeholder="Enter customer name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <div className="col-span-3">
              <Select 
                value={type} 
                onValueChange={setType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Label htmlFor="pendingAmount" className="text-right">
              Pending (₹)
            </Label>
            <Input
              id="pendingAmount"
              type="number"
              value={pendingAmount}
              onChange={(e) => setPendingAmount(e.target.value)}
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