import React, { useState, useEffect } from "react";
import { User, Contract, Diamond } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, QrCode, FileText } from "lucide-react";
import { format } from "date-fns";

import ContractForm from "../components/contracts/ContractForm";
import QRCodeDialog from "../components/contracts/QRCodeDialog";

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsData, diamondsData] = await Promise.all([
        Contract.list(),
        Diamond.list()
      ]);
      setContracts(contractsData);
      setDiamonds(diamondsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async (contractData) => {
    try {
      await Contract.create({
        type: contractData.type,
        diamondId: contractData.diamond_id,
        buyerEmail: contractData.buyer_email,
        sellerEmail: contractData.seller_email,
        price: contractData.price,
        expirationDate: contractData.expiration_date,
        status: "pending",
        createdDate: new Date()
      });
      await loadData();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating contract:", error);
    }
  };

  const viewQrCode = (contract) => {
    setSelectedContract(contract);
    setShowQrDialog(true);
  };

  const filteredContracts = contracts.filter(contract => 
    contract.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contract Management</h1>
          <p className="text-gray-500">Create and manage diamond contracts</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-sky-500 hover:bg-sky-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Contracts</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Contract #</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Diamond</th>
                  <th className="text-left py-3 px-4">Created At</th>
                  <th className="text-left py-3 px-4">Expiration Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">Loading...</td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No contracts found</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(contract => {
                    const diamond = diamonds.find(d => String(d.id) === String(contract.diamondId?._id));
                    return (
                      <tr key={contract.id} className="border-b">
                        <td className="py-3 px-4 font-medium">#{String(contract.contractNumber).padStart(3, '0')}</td>
                        <td className="py-3 px-4">{contract.type}</td>
                        <td className="py-3 px-4">
                          {diamond && diamond.diamondNumber
                            ? `#${String(diamond.diamondNumber).padStart(3, '0')}`
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {contract.createdDate ? format(new Date(contract.createdDate), 'MMM d, yyyy') : '—'}
                        </td>
                         <td className="py-3 px-4">
                          {contract.expirationDate ? (
                            <span
                              className={
                                new Date(contract.expirationDate) < new Date(new Date().setDate(new Date().getDate() + 5))
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {format(new Date(contract.expirationDate), 'MMM d, yyyy')}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={contract.status === "Active" ? "default" : "outline"}
                            className={
                              contract.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                              contract.status === "Active" ? "bg-green-100 text-green-800" :
                              contract.status === "Completed" ? "bg-blue-100 text-blue-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewQrCode(contract)}
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            View QR
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      {showCreateDialog && (
        <ContractForm
          onSubmit={handleCreateContract}
          onCancel={() => setShowCreateDialog(false)}
          diamonds={diamonds}
        />
      )}

      {/* QR Code Dialog */}
      <QRCodeDialog
        contract={selectedContract}
        open={showQrDialog}
        onOpenChange={setShowQrDialog}
        diamonds={diamonds}
      />
    </div>
  );
}