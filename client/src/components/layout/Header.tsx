import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle?: string;
}

export default function Header({ toggleSidebar, pageTitle }: HeaderProps) {
  const [location] = useLocation();
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Get page title from current location or passed prop
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    if (location === "/") return "Dashboard";
    return location.slice(1).charAt(0).toUpperCase() + location.slice(2);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-600 rounded-md hover:bg-gray-100 md:hidden focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <i className="fas fa-bars"></i>
        </button>

        <div className="hidden md:block">
          <h1 className="text-xl font-semibold gradient-heading">{getPageTitle()}</h1>
          <p className="text-xs text-gray-500">{currentDate}</p>
        </div>

        <div className="flex items-center md:hidden">
          <h2 className="text-lg font-semibold font-sans">
            <span className="text-primary">Bismi</span> Shop
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button className="p-2 text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none relative">
            <i className="fas fa-bell"></i>
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
          </button>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded-full hover:bg-gray-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white shadow-sm">
              <span className="text-sm font-medium">SA</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">Admin</p>
              <p className="text-xs text-gray-500">Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
