import React, { useState } from 'react';
import { Mail, User } from 'lucide-react';
import { useUserStore } from '../../services/auth/userStore';

export function EmailSetup() {
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a basic user profile
    setUser({
      id: '1',
      email,
      name,
      createdAt: new Date()
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Set Up Your Workspace
        </h2>
        
        <p className="text-gray-600 mb-6">
          Enter your information to get started with the application.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                required
              />
              <User className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                required
              />
              <Mail className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}