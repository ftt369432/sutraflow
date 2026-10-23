/**
 * Mock authentication functions for development
 */

// Mock user data
export const mockUser = {
  id: 'mock-user-123',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff',
  },
  app_metadata: {
    provider: 'email',
    roles: ['user']
  },
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

// Handle mock login
export const mockLogin = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Check if credentials match our test account
  if (email === 'test@example.com' && password === 'password') {
    // Save user to localStorage to persist "session"
    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    
    return {
      user: mockUser,
      session: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        user: mockUser
      },
      error: null
    };
  }
  
  // Return error for invalid credentials
  return {
    user: null,
    session: null,
    error: { message: 'Invalid email or password' }
  };
};

// Handle mock register
export const mockRegister = async (email: string, password: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Always succeeds in mock mode
  const newUser = {
    ...mockUser,
    id: `mock-user-${Date.now()}`,
    email
  };
  
  localStorage.setItem('mock_auth_user', JSON.stringify(newUser));
  
  return {
    user: newUser,
    session: {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      user: newUser
    },
    error: null
  };
};

// Handle mock logout
export const mockLogout = async () => {
  // Remove user from localStorage
  localStorage.removeItem('mock_auth_user');
  
  return { error: null };
};

// Check if user is authenticated
export const mockGetUser = () => {
  const userJson = localStorage.getItem('mock_auth_user');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (err) {
    localStorage.removeItem('mock_auth_user');
    return null;
  }
};

// Get current session
export const mockGetSession = () => {
  const user = mockGetUser();
  
  if (!user) return { data: { session: null } };
  
  return {
    data: {
      session: {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        user
      }
    }
  };
}; 