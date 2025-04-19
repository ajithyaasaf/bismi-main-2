import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { Customer, Inventory, OrderItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from "@/components/ui/separator";

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  inventory: Inventory[];
}

export default function NewOrderModal({ isOpen, onClose, customers, inventory }: NewOrderModalProps) {
  const [customerType, setCustomerType] = useState('hotel');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<{
    id: string;
    type: string;
    quantity: string;
    rate: string;
  }[]>([{ id: '1', type: 'chicken', quantity: '', rate: '' }]);
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Item types
  const itemTypes = [
    { value: 'chicken', label: 'Chicken' },
    { value: 'eeral', label: 'Eeral' },
    { value: 'leg-piece', label: 'Leg Piece' },
    { value: 'goat', label: 'Goat' },
    { value: 'kadai', label: 'Kadai' },
    { value: 'beef', label: 'Beef' }
  ];
  
  // Hotels (filtered customers)
  const hotels = customers.filter(c => c.type === 'hotel');
  
  // Calculate total order amount
  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return total + (quantity * rate);
    }, 0);
  };
  
  // Add item to order
  const addItem = () => {
    setItems([
      ...items,
      { 
        id: String(items.length + 1), 
        type: 'chicken', 
        quantity: '', 
        rate: '' 
      }
    ]);
  };
  
  // Remove item from order
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };
  
  // Update item field
  const updateItem = (id: string, field: string, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };
  
  // Set default rate based on inventory when item type changes
  const updateItemType = (id: string, type: string) => {
    const inventoryItem = inventory.find(item => item.type === type);
    const rate = inventoryItem ? String(inventoryItem.rate) : '';
    
    setItems(items.map(item => 
      item.id === id ? { ...item, type, rate } : item
    ));
  };
  
  // Reset form
  const resetForm = () => {
    setCustomerType('hotel');
    setCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setItems([{ id: '1', type: 'chicken', quantity: '', rate: '' }]);
    setPaymentStatus('paid');
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate customer
      let orderCustomerId = customerId;
      
      if (customerType === 'hotel') {
        if (!customerId) {
          toast({
            title: "Customer required",
            description: "Please select a hotel",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // Random customer - create if not exists
        if (!customerName) {
          toast({
            title: "Customer name required",
            description: "Please enter customer name",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        // Create new customer
        const newCustomer = await apiRequest('POST', '/api/customers', {
          name: customerName,
          type: 'random',
          contact: customerPhone,
          pendingAmount: 0
        });
        
        orderCustomerId = newCustomer.id;
      }
      
      // Validate items
      const validItems: OrderItem[] = [];
      let hasError = false;
      
      for (const item of items) {
        const quantity = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        
        if (isNaN(quantity) || quantity <= 0) {
          toast({
            title: "Invalid quantity",
            description: `Please enter a valid quantity for ${item.type}`,
            variant: "destructive"
          });
          hasError = true;
          break;
        }
        
        if (isNaN(rate) || rate <= 0) {
          toast({
            title: "Invalid rate",
            description: `Please enter a valid rate for ${item.type}`,
            variant: "destructive"
          });
          hasError = true;
          break;
        }
        
        // Check inventory has enough stock
        const inventoryItem = inventory.find(i => i.type === item.type);
        if (!inventoryItem || inventoryItem.quantity < quantity) {
          toast({
            title: "Insufficient stock",
            description: `Not enough ${item.type} in inventory. Available: ${inventoryItem?.quantity || 0}kg`,
            variant: "destructive"
          });
          hasError = true;
          break;
        }
        
        validItems.push({
          itemId: inventoryItem.id,
          type: item.type,
          quantity,
          rate
        });
      }
      
      if (hasError) {
        setIsSubmitting(false);
        return;
      }
      
      // Calculate total
      const total = calculateTotal();
      
      // Create order
      await apiRequest('POST', '/api/orders', {
        customerId: orderCustomerId,
        items: validItems,
        date: new Date(),
        total,
        status: paymentStatus,
        type: customerType
      });
      
      // Show success message
      toast({
        title: "Order created",
        description: `Order for ${customerType === 'hotel' ? 
          customers.find(c => c.id === customerId)?.name || 'customer' : 
          customerName} has been created`
      });
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      
      // Close modal and reset form
      resetForm();
      onClose();
      
    } catch (error) {
      toast({
        title: "Error creating order",
        description: "There was an error creating the order",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>
            Create a new order for a customer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-type" className="text-right">
              Customer Type
            </Label>
            <div className="col-span-3">
              <Select 
                value={customerType} 
                onValueChange={setCustomerType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="random">Random Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {customerType === 'hotel' ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hotel-select" className="text-right">
                Select Hotel
              </Label>
              <div className="col-span-3">
                <Select 
                  value={customerId} 
                  onValueChange={setCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-name" className="text-right">
                  Customer Name
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer-phone" className="text-right">
                  Phone Number
                </Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter phone number"
                />
              </div>
            </>
          )}
          
          <Separator className="my-2" />
          
          <div>
            <h4 className="text-sm font-medium mb-2">Order Items</h4>
            
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-5">
                  <Label htmlFor={`item-type-${item.id}`} className="text-xs">Item</Label>
                  <Select 
                    value={item.type} 
                    onValueChange={(value) => updateItemType(item.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`item-qty-${item.id}`} className="text-xs">Qty (kg)</Label>
                  <Input
                    id={`item-qty-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-3">
                  <Label htmlFor={`item-rate-${item.id}`} className="text-xs">Rate (₹)</Label>
                  <Input
                    id={`item-rate-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {index === 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={addItem}
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => removeItem(item.id)}
                    >
                      <i className="fas fa-minus text-xs"></i>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="mt-4 bg-slate-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                <span className="text-lg font-bold text-gray-900">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="payment-status" className="block text-sm font-medium mb-1">
                Payment Status
              </Label>
              <Select 
                value={paymentStatus} 
                onValueChange={setPaymentStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
