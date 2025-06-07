import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MessageDebug() {
  const [debugData, setDebugData] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebugData(data.debug);
        console.log('Debug data:', data.debug);
      } else {
        console.error('Debug API failed:', response.status);
      }
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testEmail) {
      alert('Please enter an email address');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/create-test-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ toUserEmail: testEmail })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Test message sent successfully!');
        fetchDebugData(); // Refresh data
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Send test message error:', error);
      alert('Failed to send test message');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Message System Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fetchDebugData} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Debug Data'}
          </Button>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter email to send test message"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <Button onClick={sendTestMessage}>Send Test Message</Button>
          </div>
        </CardContent>
      </Card>

      {debugData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Email:</strong> {debugData.currentUser.email}</p>
              <p><strong>Name:</strong> {debugData.currentUser.fullName}</p>
              <p><strong>ID:</strong> {debugData.currentUser.id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users in System</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.allUsers.map((user, index) => (
                <div key={index} className="p-2 border rounded mb-2">
                  <p><strong>{user.name}</strong> - {user.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Total Messages:</strong> {debugData.messageStats.total}</p>
              <p><strong>Unread Messages:</strong> {debugData.messageStats.unread}</p>
              <div className="mt-2">
                <strong>By Type:</strong>
                {debugData.messageStats.byType.map((stat, index) => (
                  <Badge key={index} className="ml-2">
                    {stat._id}: {stat.count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Messages ({debugData.messages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.messages.length === 0 ? (
                <p>No messages found</p>
              ) : (
                debugData.messages.map((message) => (
                  <div key={message._id} className="border p-3 rounded mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{message.title}</h4>
                      <Badge variant={message.isRead ? "outline" : "default"}>
                        {message.isRead ? "Read" : "Unread"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{message.content}</p>
                    <div className="text-xs text-gray-500">
                      <p><strong>From:</strong> {message.fromUser?.email || 'Unknown'}</p>
                      <p><strong>Type:</strong> {message.type}</p>
                      <p><strong>Created:</strong> {new Date(message.createdAt).toLocaleString()}</p>
                      {message.contractId && (
                        <p><strong>Contract:</strong> #{message.contractId.contractNumber}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Contracts ({debugData.contracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {debugData.contracts.length === 0 ? (
                <p>No contracts found</p>
              ) : (
                debugData.contracts.map((contract) => (
                  <div key={contract._id} className="border p-3 rounded mb-2">
                    <h4 className="font-medium">Contract #{contract.contractNumber}</h4>
                    <p><strong>Type:</strong> {contract.type}</p>
                    <p><strong>Status:</strong> {contract.status}</p>
                    <p><strong>Owner:</strong> {contract.ownerId?.email || 'Unknown'}</p>
                    <p><strong>Buyer Email:</strong> {contract.buyerEmail || 'N/A'}</p>
                    <p><strong>Seller Email:</strong> {contract.sellerEmail || 'N/A'}</p>
                    <p><strong>Created:</strong> {new Date(contract.createdDate).toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}