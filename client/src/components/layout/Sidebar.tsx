import { useLocation, Link } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  
  // Navigation items
  const navItems = [
    { name: "Dashboard", path: "/", icon: "fa-tachometer-alt" },
    { name: "Suppliers", path: "/suppliers", icon: "fa-truck-loading" },
    { name: "Inventory", path: "/inventory", icon: "fa-boxes" },
    { name: "Orders", path: "/orders", icon: "fa-shopping-cart" },
    { name: "Customers", path: "/customers", icon: "fa-users" },
    { name: "Transactions", path: "/transactions", icon: "fa-exchange-alt" },
    { name: "Reports", path: "/reports", icon: "fa-chart-bar" }
  ];
  
  const isActive = (path: string) => {
    if (path === "/") return location === path;
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-xl font-bold font-sans tracking-tight">
            <span className="text-orange-400">Bismi</span> Chicken Shop
          </h1>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={closeSidebar}
              >
                <a className={`
                  flex items-center px-4 py-3 rounded-md group
                  ${isActive(item.path) 
                    ? 'text-white bg-blue-700' 
                    : 'text-gray-300 hover:bg-gray-700'}
                `}>
                  <i className={`fas ${item.icon} mr-3`}></i>
                  <span>{item.name}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <Link href="/settings">
            <a className="flex items-center text-gray-300 hover:text-white" onClick={closeSidebar}>
              <i className="fas fa-cog mr-3"></i>
              <span>Settings</span>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
