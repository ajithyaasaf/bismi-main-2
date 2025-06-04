import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Supplier, Transaction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PaymentModal from '@/components/modals/PaymentModal';
import * as SupplierService from '@/lib/supplier-service';
import * as TransactionService from '@/lib/transaction-service';

export default function SupplierDebts() {
  const [firestoreSuppliers, setFirestoreSuppliers] = useState<any[]>([]);
  const [firestoreTransactions, setFirestoreTransactions] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<{id: string, name: string, debt?: number} | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API data queries
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

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
      
      // Use API only - single source of truth
      await apiRequest('POST', `/api/suppliers/${supplierId}/payment`, { 
        amount,
        description: `Payment to supplier: ${supplierName}`
      });
      
      toast({
        title: "Payment recorded",
        description: `Payment of ₹${amount.toFixed(2)} to ${supplierName} has been recorded`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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
      (t: any) => t.entityId === supplierId && t.type === 'payment'
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return supplierPayments.length > 0 ? new Date(supplierPayments[0].date) : null;
  };
  
  // Calculate days since last payment using transaction data
  const getPaymentDays = (supplier: any) => {
    const lastPaymentDate = getLastPaymentDate(supplier.id);
    
    if (lastPaymentDate) {
      const diffInTime = new Date().getTime() - lastPaymentDate.getTime();
      const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
      return diffInDays;
    }
    
    return null;
  };

  // Determine which suppliers to display
  const displaySuppliers = firestoreSuppliers.length > 0 ? firestoreSuppliers : suppliers;
  const isPageLoading = isFirestoreLoading && isLoading;

  if (isPageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier Debts</CardTitle>
          <CardDescription>Outstanding amounts owed to suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const suppliersWithDebt = displaySuppliers.filter((supplier: any) => supplier.debt > 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Supplier Debts</CardTitle>
          <CardDescription>Outstanding amounts owed to suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {suppliersWithDebt.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No outstanding debts to suppliers</p>
          ) : (
            <div className="space-y-4">
              {suppliersWithDebt.map((supplier: any) => {
                const paymentDays = getPaymentDays(supplier);
                const isUrgent = paymentDays !== null && paymentDays > 30;
                
                return (
                  <div
                    key={supplier.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {paymentDays !== null && (
                          <span className={isUrgent ? 'text-red-600' : ''}>
                            Last payment: {paymentDays} days ago
                          </span>
                        )}
                        {supplier.contact && (
                          <span className="text-gray-400">• {supplier.contact}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isUrgent ? "destructive" : "secondary"}>
                        ₹{supplier.debt.toFixed(2)}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(supplier)}
                        disabled={isPaying === supplier.id}
                      >
                        {isPaying === supplier.id ? "Processing..." : "Pay"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  );
}