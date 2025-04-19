import { Link } from "wouter";
import { Order, Customer } from "@shared/schema";
import { format } from "date-fns";

interface RecentOrdersProps {
  orders: Order[];
  customers: Customer[];
}

export default function RecentOrders({ orders, customers }: RecentOrdersProps) {
  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };
  
  // Format items for display
  const formatItems = (order: Order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return 'No items';
    
    // Take first 2 items and summarize
    const displayItems = items.slice(0, 2).map(item => 
      `${item.quantity} kg ${item.type}`
    ).join(', ');
    
    return items.length > 2 
      ? `${displayItems} and ${items.length - 2} more` 
      : displayItems;
  };

  // Get customer initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get random color for avatar
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="max-h-[350px] overflow-y-auto">
      {orders.length === 0 ? (
        <div className="py-8 text-center text-gray-500 flex flex-col items-center">
          <i className="fas fa-clipboard-list text-2xl text-gray-400 mb-2"></i>
          <p>No recent orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const customerName = getCustomerName(order.customerId);
            const initials = getInitials(customerName);
            const avatarColor = getAvatarColor(order.customerId);
            
            return (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <a className="block p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center mr-3`}>
                      <span className="text-sm font-bold">{initials}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customerName}
                        </p>
                        <span className={`
                          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${order.status === 'completed' ? 'status-completed' : 
                            order.status === 'cancelled' ? 'status-cancelled' : 'status-pending'}
                        `}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <i className="fas fa-calendar-alt mr-1.5 text-gray-400"></i>
                        <span>{order.date ? format(new Date(order.date), 'MMM d, yyyy • h:mm a') : 'No date'}</span>
                      </div>
                      
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <i className="fas fa-shopping-basket mr-1.5 text-gray-400"></i>
                        <span className="truncate">{formatItems(order)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm font-semibold text-primary">
                      ₹{(order.total || 0).toFixed(2)}
                    </div>
                    <i className="fas fa-chevron-right text-xs text-gray-400"></i>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
