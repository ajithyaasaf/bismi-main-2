import { Inventory } from "@shared/schema";

interface LowStockAlertProps {
  lowStockItems: Inventory[];
  onAddStock: () => void;
}

export default function LowStockAlert({ lowStockItems, onAddStock }: LowStockAlertProps) {
  return (
    <div className="max-h-[300px] overflow-y-auto">
      {lowStockItems.length === 0 ? (
        <div className="py-8 text-center text-gray-500 flex flex-col items-center">
          <i className="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
          <p>All inventory items are at sufficient levels</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {lowStockItems.map(item => (
            <div key={item.id} className="py-3 flex items-center justify-between group">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <span className={`h-9 w-9 rounded-full ${item.quantity < 2 ? 'bg-red-100' : 'bg-yellow-100'} flex items-center justify-center`}>
                    <i className={`fas fa-exclamation ${item.quantity < 2 ? 'text-red-600' : 'text-yellow-600'}`}></i>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.quantity < 2 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                        style={{ width: `${Math.min(item.quantity * 20, 100)}%` }}
                      ></div>
                    </div>
                    <p className="ml-2 text-xs text-gray-500">
                      <span className="font-medium">{item.quantity.toFixed(1)} kg</span> remaining
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onAddStock}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 focus:outline-none transition-colors"
              >
                <i className="fas fa-plus mr-1.5"></i>
                Add Stock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
