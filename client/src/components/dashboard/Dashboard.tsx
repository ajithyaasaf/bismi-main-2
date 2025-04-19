import { Supplier, Customer, Inventory, Order } from "@shared/schema";
import StatsCard from "./StatsCard";
import SalesChart from "./SalesChart";
import RecentOrders from "./RecentOrders";
import LowStockAlert from "./LowStockAlert";
import SupplierDebts from "./SupplierDebts";

interface DashboardProps {
  totalStock: number;
  todaysSales: number;
  supplierDebts: number;
  pendingPayments: number;
  lowStockItems: Inventory[];
  recentOrders: Order[];
  suppliersWithDebt: Supplier[];
  customers: Customer[];
  inventory: Inventory[];
  onAddStock: () => void;
  onNewOrder: () => void;
}

export default function Dashboard({
  totalStock,
  todaysSales,
  supplierDebts,
  pendingPayments,
  lowStockItems,
  recentOrders,
  suppliersWithDebt,
  customers,
  inventory,
  onAddStock,
  onNewOrder
}: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Page Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="gradient-heading text-3xl font-bold">Business Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time overview of your business performance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onNewOrder}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i> New Order
          </button>
          <button 
            onClick={onAddStock}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i> Update Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard 
          title="Current Stock"
          value={`${totalStock.toFixed(1)} kg`}
          icon="warehouse"
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          linkText="View inventory"
          linkHref="/inventory"
          trend="+5% from last week"
          trendDirection="up"
        />
        
        <StatsCard 
          title="Today's Sales"
          value={`₹${todaysSales.toFixed(0)}`}
          icon="rupee-sign"
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
          linkText="View orders"
          linkHref="/orders"
          trend="+12% from yesterday"
          trendDirection="up"
        />
        
        <StatsCard 
          title="Supplier Debts"
          value={`₹${supplierDebts.toFixed(0)}`}
          icon="truck"
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
          linkText="View suppliers"
          linkHref="/suppliers"
          trend="-3% from last month"
          trendDirection="down"
        />
        
        <StatsCard 
          title="Pending Payments"
          value={`₹${pendingPayments.toFixed(0)}`}
          icon="user-friends"
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          linkText="View customers"
          linkHref="/customers"
          trend="+8% from last week"
          trendDirection="up"
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="dashboard-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sales Trend</h2>
            <div className="flex items-center space-x-2">
              <select className="text-xs rounded border-gray-200 bg-transparent px-2 py-1">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
          </div>
          <SalesChart />
        </div>
        
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <RecentOrders orders={recentOrders} customers={customers} />
        </div>
      </div>

      {/* Low Stock Alert and Supplier Debt */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="dashboard-card border-yellow-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-yellow-500"></i>
              <h2 className="text-lg font-semibold">Low Stock Alert</h2>
            </div>
            <button 
              onClick={onAddStock}
              className="text-xs text-primary hover:underline"
            >
              Update inventory
            </button>
          </div>
          <LowStockAlert lowStockItems={lowStockItems} onAddStock={onAddStock} />
        </div>
        
        {/* Supplier Debts */}
        <div className="dashboard-card border-red-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fas fa-money-bill-wave text-red-500"></i>
              <h2 className="text-lg font-semibold">Supplier Debts</h2>
            </div>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <SupplierDebts suppliers={suppliersWithDebt} />
        </div>
      </div>
    </div>
  );
}
