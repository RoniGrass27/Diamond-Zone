
import React from "react";
import { Link } from "react-router-dom";
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

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="h-16 border-b flex items-center px-6">
          <Diamond className="h-6 w-6 text-sky-500" />
          <span className="ml-2 font-semibold text-lg">Diamond Zone</span>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl("Inventory")}>
              <Button variant="ghost" className="w-full justify-start">
                <Diamond className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </Link>
            <Link to={createPageUrl("Contracts")}>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Contracts
              </Button>
            </Link>
            <Link to={createPageUrl("Marketplace")}>
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Marketplace
              </Button>
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700">
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
