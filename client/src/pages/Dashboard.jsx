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
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function Dashboard() {
  const [diamonds, setDiamonds] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [messages, setMessages] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

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
        
        setDiamonds(diamondsData || []); // Ensure it's always an array
        setContracts(contractsData || []); // Ensure it's always an array
        setUserData(user);

        // Fetch messages separately with error handling
        try {
          const messagesResponse = await fetch('/api/messages', { headers });
          if (messagesResponse.ok) {
            const messagesResult = await messagesResponse.json();
            // Handle different response formats
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
        // Set empty arrays on error to prevent crashes
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
        // Mark message as read and update local state
        await fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Refresh data
        const [updatedContracts] = await Promise.all([
          Contract.list()
        ]);

        setContracts(updatedContracts || []);
        
        // Update message locally
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
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
        // Mark message as read and update local state
        await fetch(`/api/messages/${messageId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Refresh data
        const [updatedContracts] = await Promise.all([
          Contract.list()
        ]);

        setContracts(updatedContracts || []);
        
        // Update message locally
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      }
    } catch (error) {
      console.error('Error rejecting contract:', error);
    }
  };

  const formatMessageContent = (message) => {
    if (message.type === 'contract_request') {
      let baseContent = message.content;
      
      // Add additional details based on contract type
      if (message.metadata?.contractType === 'MemoFrom') {
        if (message.metadata?.duration) {
          baseContent += ` (${message.metadata.duration} days)`;
        }
        if (message.metadata?.terms) {
          baseContent += `. Terms: ${message.metadata.terms.substring(0, 50)}${message.metadata.terms.length > 50 ? '...' : ''}`;
        }
      } else if (message.metadata?.price) {
        baseContent += ` for $${message.metadata.price.toLocaleString()}`;
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

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true, readAt: new Date() } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
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
      case 'offer_notification':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
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
                    className={`p-4 border-l-4 rounded-lg ${getPriorityColor(message.metadata?.priority)} ${
                      !message.isRead ? 'ring-2 ring-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getMessageIcon(message.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${!message.isRead ? 'font-bold' : ''}`}>
                              {message.title}
                            </h4>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{formatMessageContent(message)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                            {message.metadata?.contractType && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {message.metadata.contractType === 'MemoFrom' ? 'Memo Request' : message.metadata.contractType}
                                </Badge>
                              </>
                            )}
                            {message.metadata?.duration && message.metadata.contractType === 'MemoFrom' && (
                              <>
                                <span>•</span>
                                <span>{message.metadata.duration} days</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {!message.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(message._id)}
                          className="ml-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {message.isActionRequired && message.actionType === 'approve_contract' && !message.isRead && message.contractId && (
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApproveContract(message._id, message.contractId._id || message.contractId)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectContract(message._id, message.contractId._id || message.contractId)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {message.isActionRequired && message.actionType === 'approve_contract' && !message.isRead && !message.contractId && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-red-600">⚠️ Contract reference missing - please contact support</p>
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
    </div>
  );
}