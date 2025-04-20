import { Inventory } from "@shared/schema";

interface LowStockAlertProps {
  lowStockItems: Inventory[];
  onAddStock: () => void;
}

export default function LowStockAlert({ lowStockItems, onAddStock }: LowStockAlertProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Low Stock Alert</h3>
      </div>
      <div className="divide-y divide-gray-200 max-h-[200px] overflow-y-auto">
        {lowStockItems.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No low stock items
          </div>
        ) : (
          lowStockItems.map(item => (
            <div key={item.id} className="px-4 py-3 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <span className={`h-8 w-8 rounded-full ${item.quantity < 2 ? 'bg-red-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                    <i className={`fas fa-exclamation ${item.quantity < 2 ? 'text-red-600' : 'text-yellow-600'}`}></i>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                  <p className="text-xs text-gray-500">Only {item.quantity.toFixed(1)} kg left</p>
                </div>
              </div>
              <button 
                onClick={onAddStock}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none"
              >
                Order Stock
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
