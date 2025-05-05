import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomersList from "@/components/customers/CustomersList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as CustomerService from "@/lib/customer-service";

export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [firestoreCustomers, setFirestoreCustomers] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load customers from Firestore directly
  useEffect(() => {
    async function loadFirestoreCustomers() {
      try {
        setIsFirestoreLoading(true);
        const customers = await CustomerService.getCustomers();
        console.log("Loaded customers directly from Firestore:", customers);
        setFirestoreCustomers(customers);
      } catch (error) {
        console.error("Error loading customers from Firestore:", error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreCustomers();
  }, []);

  // Fetch customers from API as backup
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        // First delete from Firestore directly
        try {
          const result = await CustomerService.deleteCustomer(customer.id);
          console.log(`Delete result from Firestore: ${result ? 'Success' : 'Not found'}`);
        } catch (firestoreError) {
          console.error("Error deleting customer from Firestore:", firestoreError);
        }
        
        // Then delete via API for backward compatibility
        await apiRequest('DELETE', `/api/customers/${customer.id}`, undefined);
        
        toast({
          title: "Customer deleted",
          description: `${customer.name} has been successfully deleted`,
        });
        
        // Refresh local state
        setFirestoreCustomers(prev => prev.filter(c => c.id !== customer.id));
        
        // Refresh API data via query cache
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      } catch (error) {
        console.error("Error during customer deletion:", error);
        toast({
          title: "Error",
          description: "Failed to delete customer",
          variant: "destructive",
        });
      }
    }
  };

  const handlePayment = async (customerId: string, customerName: string) => {
    const amountStr = prompt(`Enter payment amount from ${customerName}:`);
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('POST', `/api/customers/${customerId}/payment`, { 
        amount,
        description: `Payment from customer: ${customerName}`
      });
      
      toast({
        title: "Payment recorded",
        description: `Payment of ₹${amount.toFixed(2)} from ${customerName} has been recorded`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "There was an error recording the payment",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    
    // Refresh Firestore data
    async function refreshFirestoreCustomers() {
      try {
        const customers = await CustomerService.getCustomers();
        console.log("Refreshed customers from Firestore:", customers);
        setFirestoreCustomers(customers);
      } catch (error) {
        console.error("Error refreshing customers from Firestore:", error);
      }
    }
    
    refreshFirestoreCustomers();
  };
  
  // Determine which customers to display - prefer Firestore data when available
  const displayCustomers = firestoreCustomers.length > 0 ? firestoreCustomers : customers;
  const isPageLoading = isFirestoreLoading && isLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customers and pending payments</p>
        </div>
        <Button onClick={handleAddClick}>
          <i className="fas fa-plus mr-2"></i> Add Customer
        </Button>
      </div>

      {isPageLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading customers...</p>
        </div>
      ) : (
        <>
          {firestoreCustomers.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">✓</span> Using Firestore direct connection: {firestoreCustomers.length} customers loaded
              </p>
            </div>
          )}
          
          <CustomersList 
            customers={displayCustomers as Customer[]} 
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onPayment={handlePayment}
          />
        </>
      )}

      {isFormOpen && (
        <CustomerForm
          customer={selectedCustomer}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
