import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  
  // Navigation items with improved icons
  const navItems = [
    { name: "Dashboard", path: "/", icon: "fa-chart-pie" },
    { name: "Suppliers", path: "/suppliers", icon: "fa-truck" },
    { name: "Inventory", path: "/inventory", icon: "fa-warehouse" },
    { name: "Orders", path: "/orders", icon: "fa-shopping-basket" },
    { name: "Customers", path: "/customers", icon: "fa-user-friends" },
    { name: "Transactions", path: "/transactions", icon: "fa-money-bill-wave" },
    { name: "Reports", path: "/reports", icon: "fa-chart-line" }
  ];
  
  const isActive = (path: string) => {
    if (path === "/") return location === path;
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-gray-800 bg-opacity-80 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        ></motion.div>
      )}
      
      {/* Sidebar */}
      <motion.div 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl 
          transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-700">
          <h1 className="text-2xl font-bold font-sans">
            <span className="gradient-heading text-2xl">Bismi</span>
            <span className="ml-2">Chicken Shop</span>
          </h1>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={closeSidebar}
              >
                <a className={`
                  flex items-center px-4 py-3 rounded-lg group transition-all duration-200
                  ${isActive(item.path) 
                    ? 'text-white bg-primary shadow-md' 
                    : 'text-gray-200 hover:bg-gray-700/50 hover:text-white'}
                `}>
                  <div className={`
                    icon-container mr-3 
                    ${isActive(item.path) ? 'bg-white/20' : ''}
                  `}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-5 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="icon-container">
              <i className="fas fa-store"></i>
            </div>
            <div>
              <p className="text-sm text-gray-300">Managing</p>
              <p className="font-medium">Bismi Chicken Shop</p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
