import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Transaction, Supplier, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionsList from "@/components/transactions/TransactionsList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as TransactionService from "@/lib/transaction-service";
import * as SupplierService from "@/lib/supplier-service";
import * as CustomerService from "@/lib/customer-service";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load data directly from Firestore
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Directly fetch transactions from Firestore
        const transactionsCollection = collection(db, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsCollection);
        const transactionsData = transactionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: data.id || doc.id,
            date: data.date instanceof Date ? data.date : new Date(data.date.seconds * 1000),
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt?.seconds * 1000),
            amount: Number(data.amount),
            description: data.description || '',
            entityId: data.entityId || '',
            entityType: data.entityType || '',
            type: data.type || ''
          } as Transaction;
        });
        
        console.log("Retrieved", transactionsData.length, "transactions from Firestore");
        setTransactions(transactionsData);
        
        // Fetch suppliers from Firestore
        const suppliersCollection = collection(db, 'suppliers');
        const suppliersSnapshot = await getDocs(suppliersCollection);
        const suppliersData = suppliersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: data.id || doc.id,
            name: data.name || '',
            debt: Number(data.debt || 0),
            contact: data.contact || null,
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt?.seconds * 1000)
          } as Supplier;
        });
        console.log("Retrieved", suppliersData.length, "suppliers from Firestore");
        setSuppliers(suppliersData);
        
        // Fetch customers from Firestore
        const customersCollection = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customersData = customersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: data.id || doc.id,
            name: data.name || '',
            type: data.type || '',
            contact: data.contact || null,
            pendingAmount: Number(data.pendingAmount || 0),
            createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt?.seconds * 1000)
          } as Customer;
        });
        console.log("Retrieved", customersData.length, "customers from Firestore");
        setCustomers(customersData);
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
        toast({
          title: "Error",
          description: "Failed to load data from Firestore.",
          variant: "destructive",
        });
        
        // Fallback to API data
        try {
          const [txnRes, suppRes, custRes] = await Promise.all([
            fetch('/api/transactions').then(r => r.json()),
            fetch('/api/suppliers').then(r => r.json()),
            fetch('/api/customers').then(r => r.json())
          ]);
          
          setTransactions(txnRes);
          setSuppliers(suppRes);
          setCustomers(custRes);
          console.log("Using API fallback data instead");
        } catch (fallbackError) {
          console.error("Error loading fallback data:", fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [toast]);

  const handleAddClick = () => {
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (transaction: Transaction) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        // First try deleting from Firestore directly
        try {
          await TransactionService.deleteTransaction(transaction.id);
          console.log(`Transaction deleted from Firestore: ${transaction.id}`);
          
          // Update local state
          setFirestoreTransactions(prev => prev.filter(t => t.id !== transaction.id));
        } catch (firestoreError) {
          console.error("Error deleting transaction from Firestore:", firestoreError);
        }
        
        // Also delete via API for backward compatibility
        await apiRequest('DELETE', `/api/transactions/${transaction.id}`, undefined);
        
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted",
        });
        
        // Refresh API data
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        
        // Also invalidate suppliers or customers cache based on entity type
        if (transaction.entityType === 'supplier') {
          queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
        } else if (transaction.entityType === 'customer') {
          queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        }
      } catch (error) {
        console.error("Error during transaction deletion:", error);
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
