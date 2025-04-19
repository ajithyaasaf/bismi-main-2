import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction, Supplier, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionsList from "@/components/transactions/TransactionsList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Fetch suppliers for transaction entity details
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  // Fetch customers for transaction entity details
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const handleAddClick = () => {
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (transaction: Transaction) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await apiRequest('DELETE', `/api/transactions/${transaction.id}`, undefined);
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        
        // Also invalidate suppliers or customers cache based on entity type
        if (transaction.entityType === 'supplier') {
          queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
        } else if (transaction.entityType === 'customer') {
          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">Manage payments and receipts</p>
        </div>
        <Button onClick={handleAddClick}>
          <i className="fas fa-plus mr-2"></i> Add Transaction
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      ) : (
        <TransactionsList 
          transactions={transactions} 
          suppliers={suppliers}
          customers={customers}
          onDelete={handleDeleteClick}
        />
      )}

      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          suppliers={suppliers}
          customers={customers}
        />
      )}
    </div>
  );
}
