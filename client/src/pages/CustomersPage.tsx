import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomersList from "@/components/customers/CustomersList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as CustomerService from "@/lib/customer-service";
import PaymentModal from "@/components/modals/PaymentModal";

export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<{id: string, name: string, pendingAmount?: number} | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
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

  const openPaymentModal = (customerId: string, customerName: string) => {
    const customer = firestoreCustomers.find(c => c.id === customerId) || 
                     customers.find(c => c.id === customerId);
    
    setPaymentCustomer({
      id: customerId,
      name: customerName,
      pendingAmount: customer?.pendingAmount || 0
    });
    setPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentCustomer(null);
    setIsPaymentProcessing(false);
  };
  
  const handlePaymentSubmit = async (amount: number) => {
    if (!paymentCustomer) return;
    
    try {
      const { id: customerId, name: customerName } = paymentCustomer;
      setIsPaymentProcessing(true);
      
      console.log(`Processing payment from customer ${customerId} (${customerName}): ${amount}`);
      
      // First add the transaction directly to Firestore
      try {
        const transactionData = {
          type: 'receipt',
          amount: amount,
          entityId: customerId,
          entityType: 'customer',
          date: new Date(),
          description: `Payment from customer: ${customerName}`
        };
        
        // Import the transaction service
        const TransactionService = await import('@/lib/transaction-service');
        const result = await TransactionService.addTransaction(transactionData);
        console.log("Transaction added to Firestore successfully:", result);
        
        // Also update the customer's pending amount in Firestore
        const customer = firestoreCustomers.find(c => c.id === customerId);
        if (customer) {
          const currentPending = customer.pendingAmount || 0;
          const newPending = Math.max(0, currentPending - amount);
          
          // Update customer pendingAmount in Firestore
          const updateResult = await CustomerService.updateCustomer(customerId, { 
            pendingAmount: newPending
          });
          console.log("Customer pending amount updated in Firestore:", updateResult);
        }
        
        // Show success immediately since Firestore operation succeeded
        toast({
          title: "Payment recorded",
          description: `Payment of ₹${amount.toFixed(2)} from ${customerName} has been recorded`,
        });
      } catch (firestoreError) {
        console.error("Error handling payment in Firestore:", firestoreError);
        // Continue to API as fallback
      }
      
      // Then also try the API for backwards compatibility
      try {
        await apiRequest('POST', `/api/customers/${customerId}/payment`, { 
          amount,
          description: `Payment from customer: ${customerName}`
        });
        console.log("Payment also recorded via API");
      } catch (apiError) {
        console.error("API payment failed, but Firestore operation may have succeeded:", apiError);
        // We already showed success toast if Firestore succeeded, so no need to show error here
      }
      
      // Refresh local state after payment
      const refreshedCustomers = await CustomerService.getCustomers();
      setFirestoreCustomers(refreshedCustomers);
      
      // Refresh API data via query cache
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error) {
      console.error("Error during payment processing:", error);
      toast({
        title: "Payment failed",
        description: "There was an error recording the payment",
        variant: "destructive",
      });
    } finally {
      setIsPaymentProcessing(false);
      closePaymentModal();
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
          <CustomersList 
            customers={displayCustomers as Customer[]} 
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onPayment={openPaymentModal}
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
      
      {/* Payment Modal */}
      {paymentCustomer && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={closePaymentModal}
          onSubmit={handlePaymentSubmit}
          entityName={paymentCustomer.name}
          entityType="customer"
          currentAmount={paymentCustomer.pendingAmount || 0}
        />
      )}
    </div>
  );
}
