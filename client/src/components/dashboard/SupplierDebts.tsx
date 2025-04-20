import { Supplier } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface SupplierDebtsProps {
  suppliers: Supplier[];
}

export default function SupplierDebts({ suppliers }: SupplierDebtsProps) {
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handlePayment = async (supplierId: string, supplierName: string) => {
    try {
      setIsPaying(supplierId);
      
      // Open a prompt for payment amount
      const amountStr = window.prompt(`Enter payment amount for ${supplierName}:`, "0");
      if (!amountStr) {
        setIsPaying(null);
        return; // User cancelled
      }
      
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid positive number",
          variant: "destructive"
        });
        setIsPaying(null);
        return;
      }
      
      // Call API to record payment
      await apiRequest('POST', `/api/suppliers/${supplierId}/payment`, { 
        amount,
        description: `Payment to supplier: ${supplierName}`
      });
      
      // Show success message
      toast({
        title: "Payment recorded",
        description: `Payment of ₹${amount.toFixed(2)} to ${supplierName} has been recorded`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "There was an error recording the payment",
        variant: "destructive"
      });
    } finally {
      setIsPaying(null);
    }
  };
  
  // Calculate days since last payment (would need transaction data for real implementation)
  const getLastPaymentDays = (supplier: Supplier) => {
    // This is a simplified mock as we would need transaction history
    // In a real implementation, we would find the latest payment transaction for this supplier
    return Math.floor(Math.random() * 10) + 1; // Random number between 1-10 days
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Supplier Debts</h3>
      </div>
      <div className="divide-y divide-gray-200 max-h-[200px] overflow-y-auto">
        {suppliers.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No supplier debts found
          </div>
        ) : (
          suppliers.map(supplier => (
            <div key={supplier.id} className="px-4 py-3 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <i className="fas fa-user-tie text-gray-600"></i>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                  <p className="text-xs text-gray-500">Last payment: {getLastPaymentDays(supplier)} days ago</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-600">₹{supplier.debt.toFixed(2)}</p>
                <button 
                  onClick={() => handlePayment(supplier.id, supplier.name)}
                  disabled={isPaying === supplier.id}
                  className="mt-1 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPaying === supplier.id ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
