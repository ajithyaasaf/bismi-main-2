import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Order, Customer, Inventory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import OrdersList from "@/components/orders/OrdersList";
import NewOrderModal from "@/components/modals/NewOrderModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as OrderService from "@/lib/order-service";
import * as CustomerService from "@/lib/customer-service";
import * as InventoryService from "@/lib/inventory-service";

export default function OrdersPage() {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [firestoreOrders, setFirestoreOrders] = useState<any[]>([]);
  const [firestoreCustomers, setFirestoreCustomers] = useState<any[]>([]);
  const [firestoreInventory, setFirestoreInventory] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load data from Firestore directly
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        setIsFirestoreLoading(true);
        
        // Load orders
        const orders = await OrderService.getOrders();
        console.log("Loaded orders directly from Firestore:", orders);
        setFirestoreOrders(orders);
        
        // Load customers
        const customers = await CustomerService.getCustomers();
        console.log("Loaded customers directly from Firestore:", customers);
        setFirestoreCustomers(customers);
        
        // Load inventory
        const inventory = await InventoryService.getInventoryItems();
        console.log("Loaded inventory directly from Firestore:", inventory);
        setFirestoreInventory(inventory);
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreData();
  }, []);

  // Fetch orders from API as backup
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Fetch customers for order details from API as backup
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch inventory for order creation from API as backup
  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
  });

  const handleUpdateStatusClick = async (order: Order) => {
    const newStatus = order.status === "pending" ? "paid" : "pending";
    try {
      // First update in Firestore
      try {
        const result = await OrderService.updateOrder(order.id, { status: newStatus });
        console.log("Order status updated in Firestore:", result);
      } catch (firestoreError) {
        console.error("Error updating order status in Firestore:", firestoreError);
      }
      
      // Then update via API for backward compatibility
      await apiRequest('PUT', `/api/orders/${order.id}`, { 
        status: newStatus 
      });
      
      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
      
      // Refresh local state
      setFirestoreOrders(prev => 
        prev.map(o => o.id === order.id ? {...o, status: newStatus} : o)
      );
      
      // Refresh API data via query cache
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    } catch (error) {
      console.error("Error during order status update:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (order: Order) => {
    if (confirm("Are you sure you want to delete this order?")) {
      try {
        // First delete from Firestore
        try {
          const result = await OrderService.deleteOrder(order.id);
          console.log(`Delete order result from Firestore: ${result ? 'Success' : 'Not found'}`);
        } catch (firestoreError) {
          console.error("Error deleting order from Firestore:", firestoreError);
        }
        
        // Then delete via API for backward compatibility
        await apiRequest('DELETE', `/api/orders/${order.id}`, undefined);
        
        toast({
          title: "Order deleted",
          description: "The order has been successfully deleted",
        });
        
        // Refresh local state
        setFirestoreOrders(prev => prev.filter(o => o.id !== order.id));
        
        // Refresh API data via query cache
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      } catch (error) {
        console.error("Error during order deletion:", error);
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive",
        });
      }
    }
  };

  // For form modal closure, make sure to refresh Firestore data
  const handleModalClose = () => {
    setIsNewOrderModalOpen(false);
    
    // Refresh Firestore data
    async function refreshFirestoreData() {
      try {
        const orders = await OrderService.getOrders();
        console.log("Refreshed orders from Firestore:", orders);
        setFirestoreOrders(orders);
        
        // Also refresh customers and inventory since they might have been updated
        const customers = await CustomerService.getCustomers();
        setFirestoreCustomers(customers);
        
        const inventory = await InventoryService.getInventoryItems();
        setFirestoreInventory(inventory);
      } catch (error) {
        console.error("Error refreshing data from Firestore:", error);
      }
    }
    
    refreshFirestoreData();
  };
  
  // Determine which data to display - prefer Firestore data when available
  const displayOrders = firestoreOrders.length > 0 ? firestoreOrders : orders;
  const displayCustomers = firestoreCustomers.length > 0 ? firestoreCustomers : customers;
  const displayInventory = firestoreInventory.length > 0 ? firestoreInventory : inventory;
  const isPageLoading = isFirestoreLoading && isLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage orders and sales</p>
        </div>
        <Button onClick={() => setIsNewOrderModalOpen(true)}>
          <i className="fas fa-plus mr-2"></i> New Order
        </Button>
      </div>

      {isPageLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <>
          {firestoreOrders.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">✓</span> Using Firestore direct connection: {firestoreOrders.length} orders loaded
              </p>
            </div>
          )}
          
          <OrdersList 
            orders={displayOrders as Order[]} 
            customers={displayCustomers as Customer[]}
            onUpdateStatus={handleUpdateStatusClick}
            onDelete={handleDeleteClick}
          />
        </>
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal 
          isOpen={isNewOrderModalOpen} 
          onClose={handleModalClose}
          customers={displayCustomers as Customer[]}
          inventory={displayInventory as Inventory[]}
        />
      )}
    </div>
  );
}
