import { Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as CustomerService from "@/lib/customer-service";

interface CustomersListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayment: (customerId: string, customerName: string) => void;
}

export default function CustomersList({ 
  customers, 
  onEdit, 
  onDelete,
  onPayment 
}: CustomersListProps) {
  
  // Create WhatsApp link for a customer
  // Function to handle WhatsApp message sending
  const handleWhatsAppClick = async (customer: Customer) => {
    if (!customer.contact) return;
    
    try {
      // Get the latest customer data to ensure pending amount is up-to-date
      let latestCustomer = customer;
      
      try {
        // Try to get the latest customer data from Firestore
        const updatedCustomer = await CustomerService.getCustomerById(customer.id);
        if (updatedCustomer && 'id' in updatedCustomer && 'name' in updatedCustomer) {
          // Make sure we have a complete customer object
          latestCustomer = {
            id: updatedCustomer.id || customer.id,
            name: updatedCustomer.name || customer.name,
            type: updatedCustomer.type || customer.type,
            contact: updatedCustomer.contact || customer.contact,
            pendingAmount: updatedCustomer.pendingAmount !== undefined ? 
              updatedCustomer.pendingAmount : customer.pendingAmount,
            createdAt: updatedCustomer.createdAt || customer.createdAt
          };
          console.log("Got latest customer data for WhatsApp message:", latestCustomer);
        }
      } catch (error) {
        console.error("Error getting latest customer data:", error);
        // Continue with existing customer data if fetch fails
      }
      
      // Clean the phone number (remove spaces, dashes, etc.)
      let phoneNumber = latestCustomer.contact ? latestCustomer.contact.replace(/[\s-()]/g, '') : '';
      if (!phoneNumber) return;
      
      // Ensure it has the country code (assuming India +91, but this should be adapted for other regions)
      if (!phoneNumber.startsWith('+')) {
        // If it starts with 0, replace it with +91
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+91' + phoneNumber.substring(1);
        } 
        // If it doesn't have a country code, add +91
        else if (!phoneNumber.startsWith('91')) {
          phoneNumber = '+91' + phoneNumber;
        }
        // If it starts with 91 but no +, add +
        else if (phoneNumber.startsWith('91')) {
          phoneNumber = '+' + phoneNumber;
        }
      }
      
      // Create a dynamic message with customer details
      let message = `*BISMI CHICKEN SHOP*\n\nHello ${latestCustomer.name},`;
      
      // Add pending amount info if applicable
      if (latestCustomer.pendingAmount && latestCustomer.pendingAmount > 0) {
        message += `\n\n*Current Pending Amount: ₹${latestCustomer.pendingAmount.toFixed(2)}*`;
        message += `\n\nThis is a friendly reminder about your pending payment. Please settle at your earliest convenience.`;
      } else {
        message += `\n\nThank you for your business with us.`;
      }
      
      // Add a closing message
      message += `\n\nFor any queries, please contact us.`;
      
      // Create the WhatsApp URL
      const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      // Open in a new tab
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error("Error creating WhatsApp message:", error);
    }
  };
  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <i className="fas fa-users text-gray-400 text-4xl mb-3"></i>
          <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your first customer to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile view - Card layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {customers.map((customer) => (
          <Card key={customer.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">{customer.name}</h3>
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full 
                    ${customer.type === 'hotel' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {customer.type === 'hotel' ? 'Hotel' : 'Retail'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {customer.contact && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleWhatsAppClick(customer)}
                          >
                            <i className="fab fa-whatsapp text-lg"></i>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Send WhatsApp message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 w-9"
                    onClick={() => onEdit(customer)}
                  >
                    <i className="fas fa-edit"></i>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 w-9 text-red-600" 
                    onClick={() => onDelete(customer)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-100">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-medium">{customer.contact || "-"}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Pending Amount</p>
                  <p className={`font-bold text-base ${customer.pendingAmount > 0 ? 'text-amber-600' : ''}`}>
                    ₹{customer.pendingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {customer.pendingAmount > 0 && (
                <div className="p-3 bg-gray-50">
                  <Button 
                    variant="outline"
                    className="w-full justify-center text-green-600 border-green-200 hover:bg-green-50" 
                    onClick={() => onPayment(customer.id, customer.name)}
                  >
                    <i className="fas fa-money-bill-wave mr-2"></i>
                    Record Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Desktop view - Table layout */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Pending Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full 
                      ${customer.type === 'hotel' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {customer.type === 'hotel' ? 'Hotel' : 'Retail'}
                    </span>
                  </TableCell>
                  <TableCell>{customer.contact || "-"}</TableCell>
                  <TableCell className={`text-right ${customer.pendingAmount > 0 ? 'text-amber-600 font-medium' : ''}`}>
                    ₹{customer.pendingAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      {customer.contact && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleWhatsAppClick(customer)}
                              >
                                <i className="fab fa-whatsapp"></i>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send WhatsApp message</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(customer)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600" 
                        onClick={() => onDelete(customer)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                      {customer.pendingAmount > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600" 
                          onClick={() => onPayment(customer.id, customer.name)}
                        >
                          <i className="fas fa-money-bill-wave"></i>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
