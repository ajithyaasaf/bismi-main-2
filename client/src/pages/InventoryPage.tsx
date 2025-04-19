import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inventory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryList from "@/components/inventory/InventoryList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory
  const { data: inventory = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
  });

  const handleAddClick = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (item: Inventory) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (item: Inventory) => {
    if (confirm(`Are you sure you want to delete ${item.type}?`)) {
      try {
        await apiRequest('DELETE', `/api/inventory/${item.id}`, undefined);
        toast({
          title: "Item deleted",
          description: `${item.type} has been successfully deleted`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete inventory item",
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
          <h1 className="text-2xl font-bold text-gray-900 font-sans">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage stock levels and prices</p>
        </div>
        <Button onClick={handleAddClick}>
          <i className="fas fa-plus mr-2"></i> Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      ) : (
        <InventoryList 
          items={inventory} 
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {isFormOpen && (
        <InventoryForm
          item={selectedItem}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
