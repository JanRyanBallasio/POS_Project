'use client';

import { useState, useEffect } from 'react';

// Types
interface User {
  id: number;
  Name: string;
  created_at: string;
}

export default function ProductsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test backend connection
  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test');
      const data = await response.json();
      alert(`Backend Response: ${data.message}`);
    } catch (error) {
      alert(`Connection Error: ${error}`);
    }
  };

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  return (  
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Products</h1>
      
      {/* Backend Connection Test */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Backend Connection Test</h2>
        <button 
          onClick={testConnection}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
        >
          Test Backend Connection
        </button>
        <button 
          onClick={fetchUsers}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Refresh Users
        </button>
      </div>

      {/* Users Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Users from Database</h2>
        
        {loading && <p>Loading...</p>}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}
        
        {!loading && !error && users.length === 0 && (
          <p>No users found.</p>
        )}
        
        {!loading && !error && users.length > 0 && (
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white p-3 rounded border">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Name:</strong> {user.Name}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}