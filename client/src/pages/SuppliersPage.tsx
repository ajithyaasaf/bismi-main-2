import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import SupplierForm from "@/components/suppliers/SupplierForm";
import SuppliersList from "@/components/suppliers/SuppliersList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as SupplierService from "@/lib/supplier-service";

export default function SuppliersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [firestoreSuppliers, setFirestoreSuppliers] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load suppliers from Firestore directly
  useEffect(() => {
    async function loadFirestoreSuppliers() {
      try {
        setIsFirestoreLoading(true);
        const suppliers = await SupplierService.getSuppliers();
        console.log("Loaded suppliers directly from Firestore:", suppliers);
        setFirestoreSuppliers(suppliers);
      } catch (error) {
        console.error("Error loading suppliers from Firestore:", error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreSuppliers();
  }, []);
  
  // Fetch suppliers from API as backup
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const handleAddClick = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      try {
        // First delete from Firestore directly
        try {
          const result = await SupplierService.deleteSupplier(supplier.id);
          console.log(`Delete result from Firestore: ${result ? 'Success' : 'Not found'}`);
        } catch (firestoreError) {
          console.error("Error deleting supplier from Firestore:", firestoreError);
        }
        
        // Then delete via API for backward compatibility
        await apiRequest('DELETE', `/api/suppliers/${supplier.id}`, undefined);
        
        toast({
          title: "Supplier deleted",
          description: `${supplier.name} has been successfully deleted`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      } catch (error) {
        console.error("Error during supplier deletion:", error);
        toast({
          title: "Error",
          description: "Failed to delete supplier",
          variant: "destructive",
        });
      }
    }
  };

  const handlePayment = async (supplierId: string, supplierName: string) => {
    const amountStr = prompt(`Enter payment amount for ${supplierName}:`);
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
      // First use the API for payment
      await apiRequest('POST', `/api/suppliers/${supplierId}/payment`, { 
        amount,
        description: `Payment to supplier: ${supplierName}`
      });
      
      // Then manually create a transaction in Firestore directly
      try {
        const transactionData = {
          type: 'payment',
          amount: amount,
          entityId: supplierId,
          entityType: 'supplier',
          date: new Date(),
          description: `Payment to supplier: ${supplierName}`
        };
        
        // Import the transaction service
        const TransactionService = await import('@/lib/transaction-service');
        const result = await TransactionService.addTransaction(transactionData);
        console.log("Transaction added to Firestore successfully:", result);
      } catch (firestoreError) {
        console.error("Error adding transaction to Firestore:", firestoreError);
      }
      
      toast({
        title: "Payment recorded",
        description: `Payment of ₹${amount.toFixed(2)} to ${supplierName} has been recorded`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error) {
      console.error("Error during payment processing:", error);
      toast({
        title: "Payment failed",
        description: "There was an error recording the payment",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  // Determine which suppliers to display
  const displaySuppliers = firestoreSuppliers.length > 0 ? firestoreSuppliers : suppliers;
  const isPageLoading = isFirestoreLoading && isLoading;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage supplier information and debts</p>
        </div>
        <Button onClick={handleAddClick}>
          <i className="fas fa-plus mr-2"></i> Add Supplier
        </Button>
      </div>

      {isPageLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading suppliers...</p>
        </div>
      ) : (
        <>
          {firestoreSuppliers.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">✓</span> Using Firestore direct connection: {firestoreSuppliers.length} suppliers loaded
              </p>
            </div>
          )}
          
          <SuppliersList 
            suppliers={displaySuppliers as Supplier[]} 
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onPayment={handlePayment}
          />
        </>
      )}

      {isFormOpen && (
        <SupplierForm
          supplier={selectedSupplier}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
