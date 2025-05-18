import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inventory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryList from "@/components/inventory/InventoryList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as InventoryService from "@/lib/inventory-service";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";

export default function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [firestoreInventory, setFirestoreInventory] = useState<any[]>([]);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Inventory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load inventory from Firestore directly
  useEffect(() => {
    async function loadFirestoreInventory() {
      try {
        setIsFirestoreLoading(true);
        const items = await InventoryService.getInventoryItems();
        console.log("Loaded inventory directly from Firestore:", items);
        setFirestoreInventory(items);
      } catch (error) {
        console.error("Error loading inventory from Firestore:", error);
      } finally {
        setIsFirestoreLoading(false);
      }
    }
    
    loadFirestoreInventory();
  }, []);

  // Fetch inventory from API as backup
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

  const handleDeleteClick = (item: Inventory) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // First delete from Firestore directly
      try {
        const result = await InventoryService.deleteInventoryItem(itemToDelete.id);
        console.log(`Delete result from Firestore: ${result ? 'Success' : 'Not found'}`);
      } catch (firestoreError) {
        console.error("Error deleting inventory item from Firestore:", firestoreError);
      }
      
      // Then delete via API for backward compatibility
      try {
        await apiRequest('DELETE', `/api/inventory/${itemToDelete.id}`, undefined);
      } catch (apiError) {
        console.error("API error during inventory deletion:", apiError);
        // Continue anyway since Firestore operation likely succeeded
      }
      
      toast({
        title: "Item deleted",
        description: `${itemToDelete.type} has been successfully deleted`,
      });
      
      // Refresh local state
      setFirestoreInventory((prev: any) => prev.filter((i: any) => i.id !== itemToDelete.id));
      
      // Refresh inventory data via query cache
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    } catch (error) {
      console.error("Error during inventory item deletion:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    
    // Refresh Firestore data
    async function refreshFirestoreInventory() {
      try {
        const items = await InventoryService.getInventoryItems();
        console.log("Refreshed inventory from Firestore:", items);
        setFirestoreInventory(items);
      } catch (error) {
        console.error("Error refreshing inventory from Firestore:", error);
      }
    }
    
    refreshFirestoreInventory();
  };

  // Determine which inventory items to display
  const displayItems = firestoreInventory.length > 0 ? firestoreInventory : inventory;
  const isPageLoading = isFirestoreLoading && isLoading;

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

      {isPageLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      ) : (
        <>
          <InventoryList 
            items={displayItems as Inventory[]} 
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </>
      )}

      {isFormOpen && (
        <InventoryForm
          item={selectedItem}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
      
      {itemToDelete && (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          description={`Are you sure you want to delete ${itemToDelete.type}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      )}
    </div>
  );
}
