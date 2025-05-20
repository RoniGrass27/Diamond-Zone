import React, { useState, useEffect } from "react";
import { Diamond, Contract, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Diamond as DiamondIcon, FileText, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [diamonds, setDiamonds] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [diamondsData, contractsData, user] = await Promise.all([
          Diamond.list(),
          Contract.list(),
          User.me()
        ]);
        setDiamonds(diamondsData);
        setContracts(contractsData);
        setUserData(user);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalValue = diamonds.reduce((sum, diamond) => sum + (diamond.price || 0), 0);
  const activeContracts = contracts.filter(c => c.status === "Active").length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{userData ? `, ${userData.full_name}` : ''}</h1>
          <p className="text-gray-500">Here's an overview of your diamond trading</p>
        </div>
        <Link to={createPageUrl("Inventory")}>
          <Button className="bg-sky-500 hover:bg-sky-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Diamond
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Diamonds</CardTitle>
            <DiamondIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diamonds.length}</div>
            <p className="text-xs text-gray-500">in your inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">in diamonds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContracts}</div>
            <p className="text-xs text-gray-500">contracts in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Diamonds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diamonds.slice(0, 5).map((diamond) => (
                <div key={diamond.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <DiamondIcon className="h-8 w-8 text-sky-500" />
                    <div>
                      <p className="font-medium">{diamond.diamondNumber 
                                ? `#${String(diamond.diamondNumber).padStart(3, '0')}` 
                                : `${diamond.id.substring(0, 3)}`}</p>
                      <p className="text-sm text-gray-500">{diamond.carat} ct • {diamond.clarity}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{diamond.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contracts.slice(0, 5).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-medium">Contract #{String(contract.contractNumber).padStart(3, '0')}</p>
                      <p className="text-sm text-gray-500">{contract.type} • ${contract.price?.toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={contract.status === "Active" ? "default" : "outline"}
                    className={contract.status === "Active" ? "bg-green-100 text-green-800" : ""}
                  >
                    {contract.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}