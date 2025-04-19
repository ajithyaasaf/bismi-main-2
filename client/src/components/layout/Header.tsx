import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  
  // Get page title from current location
  const getPageTitle = () => {
    if (location === "/") return "Dashboard";
    return location.slice(1).charAt(0).toUpperCase() + location.slice(2);
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-500 rounded-md md:hidden focus:outline-none"
        >
          <i className="fas fa-bars"></i>
        </button>

        <div className="flex items-center">
          <h2 className="text-lg font-semibold font-sans md:hidden">
            <span className="text-orange-500">Bismi</span> Shop
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none">
          <i className="fas fa-bell"></i>
        </button>
        
        <div className="relative">
          <div className="flex items-center cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <span className="text-sm font-medium">SA</span>
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700 hidden md:inline-block">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
