import React, { useState, useEffect } from "react";
import { Diamond, Contract, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Diamond as DiamondIcon, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Clock,
  CheckCircle,
  X,
  Eye,
  ExternalLink,
  User as UserIcon,
  QrCode
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { 
  formatCompactDate, 
  formatDetailedDate,
  formatContractDateTime // Add this import
} from "@/utils/dateUtils";

// Import the QR Code Dialog component
import QRCodeDialog from "@/components/contracts/QRCodeDialog";

export default function Dashboard() {
  const [diamonds, setDiamonds] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageDetail, setShowMessageDetail] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Helper function to format time for messages
  const formatMessageTime = (dateValue) => {
    if (!dateValue) return '';
    try {
      const date = new Date(dateValue);
      return format(date, 'HH:mm');
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [diamondsData, contractsData, user] = await Promise.all([
          Diamond.list(),
          Contract.list(),
          User.me()
        ]);
        
        setDiamonds(diamondsData || []);
        setContracts(contractsData || []);
        setUserData(user);

        try {
          const messagesResponse = await fetch('/api/messages', { headers });
          if (messagesResponse.ok) {
            const messagesResult = await messagesResponse.json();
            const messagesData = messagesResult.messages || messagesResult || [];
            setMessages(Array.isArray(messagesData) ? messagesData : []);
          } else {
            console.warn('Messages API not available yet');
            setMessages([]);
          }
        } catch (messageError) {
          console.warn('Messages feature not ready:', messageError);
          setMessages([]);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        setDiamonds([]);
        setContracts([]);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproveContract = async (messageId, contractId) => {
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
        await fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const [updatedContracts, updatedMessages] = await Promise.all([
          Contract.list(),
          fetchMessages()
        ]);

        setContracts(updatedContracts || []);
        setMessages(updatedMessages || []);
        
        // Close detail dialog if open
        setShowMessageDetail(false);
      }
    } catch (error) {
      console.error('Error approving contract:', error);
    }
  };

  const handleRejectContract = async (messageId, contractId) => {
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
        await fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const [updatedContracts, updatedMessages] = await Promise.all([
          Contract.list(),
          fetchMessages()
        ]);

        setContracts(updatedContracts || []);
        setMessages(updatedMessages || []);
        
        // Close detail dialog if open
        setShowMessageDetail(false);
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.messages || result || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  const formatMessageContent = (message) => {
    if (message.type === 'contract_request') {
      let baseContent = message.content;
      
      if (message.metadata?.contractType === 'MemoFrom' || message.metadata?.contractType === 'MemoTo') {
        if (message.metadata?.duration) {
          baseContent += ` (${message.metadata.duration} days)`;
        }
        if (message.metadata?.terms && message.metadata.terms.trim() !== '' && message.metadata.terms !== 'Standard terms apply.') {
          baseContent += `. Terms: ${message.metadata.terms.substring(0, 50)}${message.metadata.terms.length > 50 ? '...' : ''}`;
        }
      } else if (message.metadata?.price) {
        baseContent += ` for $${message.metadata.price.toLocaleString()}`;
      }
      
      return baseContent;
    } else if (message.type === 'contract_approval') {
      // For contract approval messages, show the contract number if available
      let baseContent = message.content;
      if (message.contractId && message.contractId.contractNumber) {
        baseContent = baseContent.replace(/contract #(\d+)/, `contract #${String(message.contractId.contractNumber).padStart(3, '0')}`);
      }
      return baseContent;
    }
    
    return message.content;
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/messages/${messageId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true, readAt: new Date() } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const openMessageDetail = (message) => {
    setSelectedMessage(message);
    setShowMessageDetail(true);
    
    // Mark as read when opening
    if (!message.isRead) {
      handleMarkAsRead(message._id);
    }
  };

  const getContractStatus = (message) => {
    if (!message.contractId) return null;
    
    // Find the contract status
    const contract = contracts.find(c => c._id === message.contractId._id || c._id === message.contractId);
    return contract?.status || null;
  };

  const getMessageStatusColor = (message) => {
    const contractStatus = getContractStatus(message);
    
    if (contractStatus === 'approved') {
      return 'border-l-green-500 bg-green-50';
    } else if (contractStatus === 'rejected') {
      return 'border-l-red-500 bg-red-50';
    } else if (message.metadata?.priority === 'high') {
      return 'border-l-blue-500 bg-blue-50';
    } else if (message.metadata?.priority === 'medium') {
      return 'border-l-yellow-500 bg-yellow-50';
    } else {
      return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getStatusBadge = (message) => {
    const contractStatus = getContractStatus(message);
    
    if (contractStatus === 'approved') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    } else if (contractStatus === 'rejected') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    } else if (message.isActionRequired && !message.isRead) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          Action Required
        </Badge>
      );
    }
    
    return null;
  };

  // Function to find and show QR code for a contract
  const showQrCode = (message) => {
    if (message.contractId) {
      const contract = contracts.find(c => c._id === message.contractId._id || c._id === message.contractId);
      if (contract) {
        setSelectedContract(contract);
        setShowQrDialog(true);
      }
    }
  };

  // Safe calculations with fallbacks
  const totalValue = Array.isArray(diamonds) ? diamonds.reduce((sum, diamond) => sum + (diamond.price || 0), 0) : 0;
  const activeContracts = Array.isArray(contracts) ? contracts.filter(c => c.status === "pending").length : 0;
  const unreadMessages = Array.isArray(messages) ? messages.filter(m => !m.isRead).length : 0;

  const getMessageIcon = (type) => {
    switch (type) {
      case 'contract_request':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'contract_approval':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offer_notification':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{userData ? `, ${userData.fullName || userData.full_name}` : ''}</h1>
          <p className="text-gray-500">Here's an overview of your diamond trading</p>
        </div>
        <Link to="/inventory">
          <Button className="bg-sky-500 hover:bg-sky-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Diamond
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeContracts}</div>
            <p className="text-xs text-gray-500">awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadMessages}</div>
            <p className="text-xs text-gray-500">unread messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              New Messages
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadMessages}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {!Array.isArray(messages) || messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.slice(0, 5).map((message) => (
                  <div 
                    key={message._id} 
                    className={`p-4 border-l-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getMessageStatusColor(message)} ${
                      !message.isRead ? 'ring-2 ring-blue-200' : ''
                    }`}
                    onClick={() => openMessageDetail(message)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getMessageIcon(message.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className={`text-sm font-medium ${!message.isRead ? 'font-bold' : ''}`}>
                              {message.title}
                            </h4>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            {getStatusBadge(message)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{formatMessageContent(message)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                            <Clock className="h-3 w-3" />
                            {/* Updated to show better time formatting */}
                            <span className="font-medium">{formatCompactDate(message.createdAt)}</span>
                            {message.metadata?.contractType && message.type === 'contract_request' && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {(message.metadata.contractType === 'MemoFrom' || message.metadata.contractType === 'MemoTo') ? 'Memo Request' : message.metadata.contractType}
                                </Badge>
                              </>
                            )}
                            {message.type === 'contract_approval' && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  Contract Update
                                </Badge>
                              </>
                            )}
                            {message.metadata?.duration && (message.metadata.contractType === 'MemoFrom' || message.metadata.contractType === 'MemoTo') && (
                              <>
                                <span>•</span>
                                <span>{message.metadata.duration} days</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {!message.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(message._id);
                            }}
                            className="p-1"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    {message.isActionRequired && message.actionType === 'approve_contract' && !message.isRead && message.contractId && getContractStatus(message) === 'pending' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveContract(message._id, message.contractId._id || message.contractId);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectContract(message._id, message.contractId._id || message.contractId);
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Diamonds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!Array.isArray(diamonds) || diamonds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DiamondIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No diamonds yet</p>
                  <Link to="/inventory">
                    <Button className="mt-2 bg-sky-500 hover:bg-sky-600">
                      Add Your First Diamond
                    </Button>
                  </Link>
                </div>
              ) : (
                diamonds.slice(0, 5).map((diamond) => (
                  <div key={diamond._id || diamond.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <DiamondIcon className="h-8 w-8 text-sky-500" />
                      <div>
                        <p className="font-medium">{diamond.diamondNumber 
                                  ? `#${String(diamond.diamondNumber).padStart(3, '0')}` 
                                  : `${(diamond._id || diamond.id).substring(0, 3)}`}</p>
                        <p className="text-sm text-gray-500">{diamond.carat} ct • {diamond.clarity}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{diamond.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={showMessageDetail} onOpenChange={setShowMessageDetail}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMessage && getMessageIcon(selectedMessage.type)}
              {selectedMessage?.title}
              {selectedMessage && getStatusBadge(selectedMessage)}
            </DialogTitle>
            <DialogDescription>
              {/* Updated to show better date/time formatting */}
              {selectedMessage && formatDetailedDate(selectedMessage.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Message Details</h4>
                <p className="text-sm text-gray-700 mb-3">{formatMessageContent(selectedMessage)}</p>
                
                {selectedMessage.fromUser && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>From: {selectedMessage.fromUser.fullName || selectedMessage.fromUser.businessName} ({selectedMessage.fromUser.email})</span>
                  </div>
                )}
              </div>

              {selectedMessage.metadata && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Contract Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedMessage.metadata.contractType && (
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">{selectedMessage.metadata.contractType}</span>
                      </div>
                    )}
                    {selectedMessage.metadata.diamondNumber && (
                      <div>
                        <span className="text-gray-500">Diamond:</span>
                        <span className="ml-2 font-medium">#{String(selectedMessage.metadata.diamondNumber).padStart(3, '0')}</span>
                      </div>
                    )}
                    {selectedMessage.metadata.price && (
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-2 font-medium">${selectedMessage.metadata.price.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedMessage.metadata.duration && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">{selectedMessage.metadata.duration} days</span>
                      </div>
                    )}
                    {selectedMessage.metadata.expirationDate && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Expires:</span>
                        <span className="ml-2 font-medium">{formatDetailedDate(selectedMessage.metadata.expirationDate)}</span>
                      </div>
                    )}
                    {selectedMessage.metadata.terms && selectedMessage.metadata.terms.trim() !== '' && selectedMessage.metadata.terms !== 'Standard terms apply.' && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Terms:</span>
                        <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{selectedMessage.metadata.terms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QR Code Button */}
              {selectedMessage.contractId && (
                <div className="flex justify-center pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => showQrCode(selectedMessage)}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    View Contract QR Code
                  </Button>
                </div>
              )}

              {selectedMessage.isActionRequired && selectedMessage.actionType === 'approve_contract' && selectedMessage.contractId && getContractStatus(selectedMessage) === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApproveContract(selectedMessage._id, selectedMessage.contractId._id || selectedMessage.contractId)}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Contract
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleRejectContract(selectedMessage._id, selectedMessage.contractId._id || selectedMessage.contractId)}
                    className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject Contract
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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