import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Diamond, 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { toast } from "react-toastify";

export default function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await User.logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect to login even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col justify-between min-h-screen">
        <div className="h-16 border-b flex items-center px-6">
          <Diamond className="h-6 w-6 text-sky-500" />
          <span className="ml-2 font-semibold text-lg">Diamond Zone</span>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/inventory">
              <Button variant="ghost" className="w-full justify-start">
                <Diamond className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </Link>
            <Link to="/contracts">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Contracts
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Marketplace
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        {children}
      </div>
    </div>
  );
}