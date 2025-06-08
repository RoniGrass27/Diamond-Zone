import React, { useState, useEffect } from "react";
import { User, Contract, Diamond } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, QrCode, FileText, Clock, User as UserIcon, Eye } from "lucide-react";
import { format } from "date-fns";

import ContractForm from "../components/contracts/ContractForm";
import QRCodeDialog from "../components/contracts/QRCodeDialog";
import ContractDetailDialog from "../components/contracts/ContractDetailDialog";

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [diamonds, setDiamonds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      setCurrentUser(userData);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadData = async () => {
    try {
      const [contractsData, diamondsData, usersData] = await Promise.all([
        Contract.list(),
        Diamond.list(),
        fetchAllUsers()
      ]);
      setContracts(contractsData);
      setDiamonds(diamondsData);
      setUsers(usersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const handleCreateContract = async (contractData) => {
    try {
      console.log('Creating contract with data:', contractData);
      
      const result = await Contract.create({
        type: contractData.type,
        diamondId: contractData.diamondId,
        buyerEmail: contractData.buyerEmail,
        sellerEmail: contractData.sellerEmail,
        price: contractData.price,
        expirationDate: contractData.expirationDate,
        duration: contractData.duration,
        terms: contractData.terms,
        status: "pending",
        createdDate: new Date(),
        blockchain_enabled: contractData.blockchain_enabled,
        wallet_address: contractData.wallet_address
      });
      
      console.log('Contract creation result:', result);
      
      await loadData();
      setShowCreateDialog(false);
      
      return { success: true };
    } catch (error) {
      console.error("Error creating contract:", error);
      return { error: error.message || 'Failed to create contract' };
    }
  };

  const handleApproveContract = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contracts/${contractId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadData();
        setShowDetailDialog(false);
      }
    } catch (error) {
      console.error('Error approving contract:', error);
    }
  };

  const handleRejectContract = async (contractId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contracts/${contractId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadData();
        setShowDetailDialog(false);
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
    }
  };

  const viewQrCode = (contract) => {
    setSelectedContract(contract);
    setShowQrDialog(true);
  };

  const viewContractDetails = (contract) => {
    setSelectedContract(contract);
    setShowDetailDialog(true);
  };

  const getUserFullName = (email) => {
    const user = users.find(u => u.email === email);
    return user ? user.fullName || user.full_name : email;
  };

  const getContractDisplayInfo = (contract) => {
    if (!currentUser) return { direction: contract.type, counterparty: 'Unknown' };
    
    const userEmail = currentUser.email;
    
    if (contract.type === 'MemoFrom') {
      if (contract.sellerEmail === userEmail) {
        return {
          direction: 'Memo To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Memo From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: false
        };
      }
    } else if (contract.type === 'Buy') {
      if (contract.buyerEmail === userEmail) {
        return {
          direction: 'Buying From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Sell To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: false
        };
      }
    } else if (contract.type === 'Sell') {
      if (contract.sellerEmail === userEmail) {
        return {
          direction: 'Selling To',
          counterparty: contract.buyerEmail,
          counterpartyName: getUserFullName(contract.buyerEmail),
          isInitiator: true
        };
      } else {
        return {
          direction: 'Buy From',
          counterparty: contract.sellerEmail,
          counterpartyName: getUserFullName(contract.sellerEmail),
          isInitiator: false
        };
      }
    }
    
    return { 
      direction: contract.type, 
      counterparty: 'Unknown',
      counterpartyName: 'Unknown'
    };
  };

  const getDiamondDisplayNumber = (contract) => {
    if (contract.diamondInfo && contract.diamondInfo.diamondNumber) {
      return `#${String(contract.diamondInfo.diamondNumber).padStart(3, '0')}`;
    }
    
    if (contract.diamondId && contract.diamondId.diamondNumber) {
      return `#${String(contract.diamondId.diamondNumber).padStart(3, '0')}`;
    }
    
    const diamond = diamonds.find(d => String(d.id) === String(contract.diamondId?._id || contract.diamondId));
    if (diamond && diamond.diamondNumber) {
      return `#${String(diamond.diamondNumber).padStart(3, '0')}`;
    }
    
    return 'N/A';
  };

  const filteredContracts = contracts.filter(contract => 
    contract.contractNumber?.toString().includes(searchQuery.toLowerCase()) ||
    contract.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getContractDisplayInfo(contract).direction.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                  <th className="text-left py-3 px-4">Details</th>
                  <th className="text-left py-3 px-4">Created At</th>
                  <th className="text-left py-3 px-4">Expiration</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">Loading...</td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No contracts found</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(contract => {
                    const displayInfo = getContractDisplayInfo(contract);
                    
                    return (
                      <tr 
                        key={contract.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={() => viewContractDetails(contract)}
                      >
                        <td className="py-3 px-4 font-medium">
                          #{String(contract.contractNumber).padStart(3, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {contract.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getDiamondDisplayNumber(contract)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {contract.price && (
                              <div className="font-medium text-green-600">
                                ${contract.price.toLocaleString()}
                              </div>
                            )}
                            {contract.duration && (
                              <div className="text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {contract.duration} days
                              </div>
                            )}
                            {contract.terms && contract.terms !== "Standard terms apply." && (
                              <div className="text-xs text-gray-400 truncate max-w-[150px]" title={contract.terms}>
                                {contract.terms}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {contract.createdDate ? format(new Date(contract.createdDate), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm">
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
                            variant={contract.status === "approved" ? "default" : "outline"}
                            className={getStatusColor(contract.status)}
                          >
                            {contract.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewContractDetails(contract);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewQrCode(contract);
                              }}
                              title="View QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Contract Detail Dialog */}
      <ContractDetailDialog
        contract={selectedContract}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        currentUser={currentUser}
        users={users}
        onApprove={handleApproveContract}
        onReject={handleRejectContract}
      />
    </div>
  );
}