export const Diamond = {
    list: async () => {
      const response = await fetch('/api/diamonds');
      if (!response.ok) throw new Error("Failed to fetch diamonds");
      return response.json();
    },
    create: async (data) => {
      const response = await fetch('/api/diamonds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create diamond");
      return response.json();
    },
    update: async (id, data) => {
      const response = await fetch(`/api/diamonds/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update diamond");
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`/api/diamonds/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Failed to delete diamond");
    }
  };
  
  export const Contract = {
    list: async () => {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    create: async (data) => {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create contract");
      return response.json();
    }
  };
  
  export const User = {
    login: async (credentials) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error("Login failed");
      return response.json();
    },
    logout: async () => {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (!response.ok) throw new Error("Logout failed");
    },
    me: async () => {
      const response = await fetch('/api/me');
      if (!response.ok) throw new Error("Failed to get user data");
      return response.json();
    }
  };
  