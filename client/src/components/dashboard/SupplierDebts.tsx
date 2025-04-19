import { Supplier } from "@shared/schema";
import { differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

interface SupplierDebtsProps {
  suppliers: Supplier[];
}

export default function SupplierDebts({ suppliers }: SupplierDebtsProps) {
  const [isPaying, setIsPaying] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handlePayment = async (supplierId: string, supplierName: string, debt: number) => {
    try {
      setIsPaying(supplierId);
      
      // Open a prompt for payment amount
      const amountStr = window.prompt(`Enter payment amount for ${supplierName}:`, debt.toString());
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
  
  // Get supplier initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Calculate payment urgency level
  const getUrgencyLevel = (debt: number): { color: string, label: string } => {
    if (debt > 20000) return { color: 'bg-red-600', label: 'High' };
    if (debt > 10000) return { color: 'bg-orange-500', label: 'Medium' };
    return { color: 'bg-yellow-400', label: 'Low' };
  };

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {suppliers.length === 0 ? (
        <div className="py-8 text-center text-gray-500 flex flex-col items-center">
          <i className="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
          <p>No outstanding supplier debts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map(supplier => {
            const urgency = getUrgencyLevel(supplier.debt);
            
            return (
              <div key={supplier.id} className="group p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
                      <span className="text-sm font-bold">{getInitials(supplier.name)}</span>
                    </div>
                    <div>
                      <Link href={`/suppliers/${supplier.id}`}>
                        <a className="text-sm font-medium text-gray-900 hover:text-primary">
                          {supplier.name}
                        </a>
                      </Link>
                      <div className="flex items-center mt-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${urgency.color} mr-1.5`}></span>
                        <span className="text-xs text-gray-500">{urgency.label} priority</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">₹{supplier.debt.toFixed(2)}</p>
                    {supplier.contact && (
                      <p className="text-xs text-gray-500">{supplier.contact}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => handlePayment(supplier.id, supplier.name, supplier.debt)}
                    disabled={isPaying === supplier.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md 
                      bg-primary/10 text-primary hover:bg-primary/20 
                      transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPaying === supplier.id ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin mr-1.5"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-money-bill-wave mr-1.5"></i>
                        Make Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
