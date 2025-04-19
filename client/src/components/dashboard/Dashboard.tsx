import { Supplier, Customer, Inventory, Order } from "@shared/schema";
import StatsCard from "./StatsCard";
import SalesChart from "./SalesChart";
import RecentOrders from "./RecentOrders";
import LowStockAlert from "./LowStockAlert";
import SupplierDebts from "./SupplierDebts";
import { Link } from "wouter";

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
    <div className="space-y-8 pb-8">
      {/* Page Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="gradient-heading text-3xl font-bold">Business Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time overview of your shop performance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onNewOrder}
            className="primary-button"
          >
            <i className="fas fa-plus mr-2"></i> New Order
          </button>
          <button 
            onClick={onAddStock}
            className="outline-button"
          >
            <i className="fas fa-boxes mr-2"></i> Update Stock
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Sales Trend Chart */}
        <div className="dashboard-section lg:col-span-4">
          <div className="dashboard-section-title">
            <i className="fas fa-chart-line text-primary mr-2"></i>
            Sales Analysis
            <div className="ml-auto">
              <select className="text-xs rounded border border-gray-200 bg-transparent px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
          </div>
          <SalesChart />
        </div>
        
        {/* Recent Orders */}
        <div className="dashboard-section lg:col-span-3">
          <div className="dashboard-section-title">
            <i className="fas fa-shopping-cart text-primary mr-2"></i>
            Recent Orders
            <Link href="/orders">
              <a className="ml-auto text-xs text-primary hover:underline flex items-center">
                View all <i className="fas fa-chevron-right ml-1 text-xs"></i>
              </a>
            </Link>
          </div>
          <RecentOrders orders={recentOrders} customers={customers} />
        </div>
      </div>

      {/* Low Stock Alert and Supplier Debt */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Alert */}
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <div className="flex items-center text-yellow-600">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Low Stock Alert
            </div>
            <button 
              onClick={onAddStock}
              className="ml-auto text-xs outline-button py-1 px-3"
            >
              <i className="fas fa-plus mr-1.5"></i>
              Add Stock
            </button>
          </div>
          <LowStockAlert lowStockItems={lowStockItems} onAddStock={onAddStock} />
        </div>
        
        {/* Supplier Debts */}
        <div className="dashboard-section">
          <div className="dashboard-section-title">
            <div className="flex items-center text-red-600">
              <i className="fas fa-file-invoice-dollar mr-2"></i>
              Supplier Payments
            </div>
            <Link href="/suppliers">
              <a className="ml-auto text-xs text-primary hover:underline flex items-center">
                View all <i className="fas fa-chevron-right ml-1 text-xs"></i>
              </a>
            </Link>
          </div>
          <SupplierDebts suppliers={suppliersWithDebt} />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="dashboard-section-title">
          <i className="fas fa-bolt text-amber-500 mr-2"></i>
          Quick Actions
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={onNewOrder} className="p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-colors text-center">
            <div className="icon-container mx-auto mb-2">
              <i className="fas fa-receipt"></i>
            </div>
            <p className="text-sm font-medium">New Order</p>
          </button>
          
          <button onClick={onAddStock} className="p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-colors text-center">
            <div className="icon-container mx-auto mb-2">
              <i className="fas fa-boxes"></i>
            </div>
            <p className="text-sm font-medium">Update Stock</p>
          </button>
          
          <Link href="/suppliers/new">
            <a className="p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-colors text-center">
              <div className="icon-container mx-auto mb-2">
                <i className="fas fa-truck"></i>
              </div>
              <p className="text-sm font-medium">Add Supplier</p>
            </a>
          </Link>
          
          <Link href="/customers/new">
            <a className="p-4 border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-colors text-center">
              <div className="icon-container mx-auto mb-2">
                <i className="fas fa-user-plus"></i>
              </div>
              <p className="text-sm font-medium">Add Customer</p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
