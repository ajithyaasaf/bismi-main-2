import { Supplier } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as SupplierService from "@/lib/supplier-service";
import * as TransactionService from "@/lib/transaction-service";
import PaymentModal from "@/components/modals/PaymentModal";

interface SupplierDebtsProps {
  suppliers: Supplier[];
}

export default function SupplierDebts({ suppliers }: SupplierDebtsProps) {
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{id: string, name: string, debt?: number} | null>(null);
  const [firestoreSuppliers, setFirestoreSuppliers] = useState<any[]>([]);
  const [firestoreTransactions, setFirestoreTransactions] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load data from Firestore
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        setIsFirestoreLoading(true);
        
        // Load suppliers from Firestore
        const suppliersData = await SupplierService.getSuppliers();
        setFirestoreSuppliers(suppliersData);
        
        // Load transactions from Firestore
        const transactionsData = await TransactionService.getTransactions();
        setFirestoreTransactions(transactionsData);
        
        console.log('Loaded suppliers directly from Firestore:', suppliersData);
        console.log('Loaded transactions directly from Firestore:', transactionsData);
      } catch (error) {
        console.error('Error loading data from Firestore:', error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreData();
  }, []);
  
  const openPaymentModal = (supplier: {id: string, name: string, debt?: number}) => {
    setSelectedSupplier(supplier);
    setPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedSupplier(null);
  };
  
  const handlePaymentSubmit = async (amount: number) => {
    if (!selectedSupplier) return;
    
    try {
      const { id: supplierId, name: supplierName } = selectedSupplier;
      setIsPaying(supplierId);
      
      console.log(`Processing payment of ${amount} for supplier ${supplierId}`);
      
      // First, try to use Firestore service directly
      try {
        // Record payment using Firestore service
        const result = await SupplierService.recordSupplierPayment(
          supplierId, 
          amount,
          `Payment to supplier: ${supplierName}`
        );
        
        console.log('Payment recorded in Firestore:', result);
        
        // Show success message
        toast({
          title: "Payment recorded",
          description: `Payment of ₹${amount.toFixed(2)} to ${supplierName} has been recorded`,
        });
        
        // Refresh Firestore data
        const updatedSuppliers = await SupplierService.getSuppliers();
        setFirestoreSuppliers(updatedSuppliers);
        
        const updatedTransactions = await TransactionService.getTransactions();
        setFirestoreTransactions(updatedTransactions);
      } catch (firestoreError) {
        console.error('Error recording payment in Firestore:', firestoreError);
        
        // If Firestore fails, try API as fallback
        try {
          // Call API to record payment as fallback
          await apiRequest('POST', `/api/suppliers/${supplierId}/payment`, { 
            amount,
            description: `Payment to supplier: ${supplierName}`
          });
          
          // API succeeded after Firestore failed
          toast({
            title: "Payment recorded",
            description: `Payment of ₹${amount.toFixed(2)} to ${supplierName} has been recorded through API`,
          });
          
          // Invalidate queries to refresh API data
          queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        } catch (apiError) {
          console.error('API fallback also failed:', apiError);
          
          // Show error since both methods failed
          toast({
            title: "Payment failed",
            description: "There was an error recording the payment. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment failed",
        description: "There was an error recording the payment",
        variant: "destructive"
      });
    } finally {
      setIsPaying(null);
      closePaymentModal();
    }
  };
  
  // Find the last payment transaction date for a supplier
  const getLastPaymentDate = (supplierId: string) => {
    if (firestoreTransactions.length === 0) return null;
    
    const supplierPayments = firestoreTransactions.filter(
      t => t.entityId === supplierId && t.type === 'payment'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return supplierPayments.length > 0 ? new Date(supplierPayments[0].date) : null;
  };
  
  // Calculate days since last payment using transaction data
  const getPaymentDays = (supplier: any) => {
    const lastPaymentDate = getLastPaymentDate(supplier.id);
    
    if (lastPaymentDate) {
      return differenceInDays(new Date(), lastPaymentDate);
    }
    
    // Default if no payment found
    return '--';
  };
  
  // Determine which suppliers data to display
  const displaySuppliers = firestoreSuppliers.length > 0 ? firestoreSuppliers : suppliers;
  const isLoading = isFirestoreLoading && suppliers.length === 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Supplier Debts</h3>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-[200px] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <i className="fas fa-spinner fa-spin mr-2"></i> Loading supplier data...
          </div>
        ) : displaySuppliers.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No supplier debts found
          </div>
        ) : (
          displaySuppliers.map(supplier => (
            <div key={supplier.id} className="px-4 py-3 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <i className="fas fa-user-tie text-gray-600"></i>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">
                    Last payment: {getPaymentDays(supplier)} {getPaymentDays(supplier) !== '--' ? 'days ago' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">₹{supplier.debt ? supplier.debt.toFixed(2) : '0.00'}</p>
                <button 
                  onClick={() => openPaymentModal(supplier)}
                  disabled={isPaying === supplier.id || !supplier.debt || supplier.debt <= 0}
                  className="mt-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPaying === supplier.id ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Add the PaymentModal component */}
      {selectedSupplier && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={closePaymentModal}
          onSubmit={handlePaymentSubmit}
          entityName={selectedSupplier.name}
          entityType="supplier"
          currentAmount={selectedSupplier.debt || 0}
        />
      )}
    </div>
  );
}
