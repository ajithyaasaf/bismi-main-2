import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Customer, Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomersList from "@/components/customers/CustomersList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as CustomerService from "@/lib/customer-service";
import * as OrderService from "@/lib/order-service";
import PaymentModal from "@/components/modals/PaymentModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { CustomerInvoice } from "@/components/invoices/CustomerInvoice";


export default function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<{id: string, name: string, pendingAmount?: number} | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [firestoreCustomers, setFirestoreCustomers] = useState<any[]>([]);
  const [firestoreOrders, setFirestoreOrders] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState<Customer | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load customers and orders from Firestore directly
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        setIsFirestoreLoading(true);
        
        // Load customers
        const customers = await CustomerService.getCustomers();
        console.log("Loaded customers directly from Firestore:", customers);
        setFirestoreCustomers(customers);
        
        // Load orders for invoice generation
        const orders = await OrderService.getOrders();
        console.log("Loaded orders directly from Firestore:", orders);
        setFirestoreOrders(orders);
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreData();
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

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      // First delete from Firestore directly
      try {
        const result = await CustomerService.deleteCustomer(customerToDelete.id);
        console.log(`Delete result from Firestore: ${result ? 'Success' : 'Not found'}`);
      } catch (firestoreError) {
        console.error("Error deleting customer from Firestore:", firestoreError);
      }
      
      // Then delete via API for backward compatibility
      await apiRequest('DELETE', `/api/customers/${customerToDelete.id}`, undefined);
      
      toast({
        title: "Customer deleted",
        description: `${customerToDelete.name} has been successfully deleted`,
      });
      
      // Refresh local state
      setFirestoreCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      
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
      
      // Use API only - single source of truth
      await apiRequest('POST', `/api/customers/${customerId}/payment`, { 
        amount,
        description: `Payment from customer: ${customerName}`
      });
      
      toast({
        title: "Payment recorded",
        description: `Payment of ₹${amount.toFixed(2)} from ${customerName} has been recorded`,
      });
      
      // Refresh data via query cache
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
    async function refreshFirestoreData() {
      try {
        const customers = await CustomerService.getCustomers();
        console.log("Refreshed customers from Firestore:", customers);
        setFirestoreCustomers(customers);
        
        // Also refresh orders for invoice data
        const orders = await OrderService.getOrders();
        setFirestoreOrders(orders);
      } catch (error) {
        console.error("Error refreshing data from Firestore:", error);
      }
    }
    
    refreshFirestoreData();
  };
  
  // Handler for generating invoice
  const handleGenerateInvoice = (customer: Customer) => {
    setInvoiceCustomer(customer);
    setIsInvoiceModalOpen(true);
  };
  
  // Close invoice modal
  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setInvoiceCustomer(null);
  };
  
  // We've removed the manual recalculation function as it's now handled automatically

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
            onGenerateInvoice={handleGenerateInvoice}
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
      
      {/* Delete Confirmation Dialog */}
      {customerToDelete && (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          description={`Are you sure you want to delete ${customerToDelete.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      )}
      
      {/* Invoice Modal */}
      {invoiceCustomer && (
        <CustomerInvoice
          isOpen={isInvoiceModalOpen}
          onClose={closeInvoiceModal}
          customer={invoiceCustomer}
          orders={firestoreOrders as Order[]}
        />
      )}
    </div>
  );
}
