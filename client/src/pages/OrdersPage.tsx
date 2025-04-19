import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Order, Customer, Inventory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import OrdersList from "@/components/orders/OrdersList";
import NewOrderModal from "@/components/modals/NewOrderModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function OrdersPage() {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Fetch customers for order details
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  // Fetch inventory for order creation
  const { data: inventory = [] } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
  });

  const handleUpdateStatusClick = async (order: Order) => {
    const newStatus = order.status === "pending" ? "paid" : "pending";
    try {
      await apiRequest('PUT', `/api/orders/${order.id}`, { 
        status: newStatus 
      });
      
      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    } catch (error) {
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
        await apiRequest('DELETE', `/api/orders/${order.id}`, undefined);
        toast({
          title: "Order deleted",
          description: "The order has been successfully deleted",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete order",
          variant: "destructive",
        });
      }
    }
  };

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

      {isLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <OrdersList 
          orders={orders} 
          customers={customers}
          onUpdateStatus={handleUpdateStatusClick}
          onDelete={handleDeleteClick}
        />
      )}

      {isNewOrderModalOpen && (
        <NewOrderModal 
          isOpen={isNewOrderModalOpen} 
          onClose={() => setIsNewOrderModalOpen(false)}
          customers={customers}
          inventory={inventory}
        />
      )}
    </div>
  );
}
