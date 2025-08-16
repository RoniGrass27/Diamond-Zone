// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const Diamond = {
  list: async () => {
    const response = await fetch('/api/diamonds', {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to fetch diamonds");
    }
    const data = await response.json();
    return data.map(d => ({
      ...d,
      id: d._id 
    }));
  },
  
  create: async (data) => {
    const response = await fetch('/api/diamonds', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to create diamond");
    }
    return response.json();
  },
  
  update: async (id, data) => {
    const response = await fetch(`/api/diamonds/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to update diamond");
    }
    return response.json();
  },
  
  delete: async (id) => {
    const response = await fetch(`/api/diamonds/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to delete diamond");
    }
  },

  updatePhoto: async (id, photoUrl) => {
    const response = await fetch(`/api/diamonds/${id}/photo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ photoUrl }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to update diamond photo");
    }
    return response.json();
  }
};

export const Contract = {
  list: async () => {
    const response = await fetch('/api/contracts', {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to fetch contracts");
    }
    const data = await response.json();
    return data.map(c => ({
      ...c,
      id: c._id
    }));
  },
  
  create: async (data) => {
    console.log('=== Creating Contract ===');
    console.log('Contract data being sent:', data);
    
    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      const errorData = await response.json();
      console.error('Contract creation failed:', errorData);
      throw new Error("Failed to create contract");
    }
    return response.json();
  },
  
  approve: async (id) => {
    const response = await fetch(`/api/contracts/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to approve contract");
    }
    return response.json();
  },
  
  reject: async (id) => {
    const response = await fetch(`/api/contracts/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to reject contract");
    }
    return response.json();
  }
};

export const User = {
  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }
    return response.json();
  },
  
  signup: async (userData) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }
    return response.json();
  },
  
  logout: async () => {
    const response = await fetch('/api/auth/logout', { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    // Always clear local storage, even if request fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!response.ok) {
      console.warn("Logout request failed, but local storage cleared");
    }
  },
  
  me: async () => {
    const response = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to get user data");
    }
    return response.json();
  },
  
  updateProfile: async (data) => {
    const response = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to update profile");
    }
    return response.json();
  },
  
  changePassword: async (passwordData) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwordData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to change password");
    }
    return response.json();
  },
  
  enableBlockchain: async () => {
    const response = await fetch('/api/auth/enable-blockchain', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to enable blockchain");
    }
    return response.json();
  }
};

export const Message = {
  list: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`/api/messages?${searchParams}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to fetch messages");
    }
    const data = await response.json();
    return data.messages || [];
  },
  
  markAsRead: async (messageId) => {
    const response = await fetch(`/api/messages/${messageId}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to mark message as read");
    }
    return response.json();
  },
  
  markAllAsRead: async () => {
    const response = await fetch('/api/messages/mark-all-read', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to mark all messages as read");
    }
    return response.json();
  },
  
  getUnreadCount: async () => {
    const response = await fetch('/api/messages/unread-count', {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to get unread count");
    }
    const data = await response.json();
    return data.count;
  },
  
  send: async (messageData) => {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to send message");
    }
    return response.json();
  },
  
  delete: async (messageId) => {
    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error("Failed to delete message");
    }
    return response.json();
  }
};