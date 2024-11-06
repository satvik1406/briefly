import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createUser, verifyUser, getUserSummaries } from './RequestService';
import AuthForms from './AuthForms';
import Dashboard from './Dashboard';

// Create Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await verifyUser({ email, password });
      
      if (response.token) {
        // Store token in localStorage or secure storage
        localStorage.setItem('authToken', response.token);
        
        // Set auth state
        setUserData(response.user);
        setIsAuthenticated(true);
        
        // Fetch user's summaries using the token
        try {
          const summariesResponse = await getUserSummaries(response.user_id);
          
          if (summariesResponse.ok) {
            const summariesData = await summariesResponse.result.json();
            setSummaries(summariesData);
          }
        } catch (summaryError) {
          console.error('Error fetching summaries:', summaryError);
        }
        
        return { success: true };
      }
      
      throw new Error('Invalid credentials');
      
    } catch (error) {
      setError(error.message || 'Authentication failed');
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await createUser(userData);
      return { success: true, user: response };
      
    } catch (error) {
      setError(error.message || 'Registration failed');
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUserData(null);
    setSummaries([]);
    setError(null);
  };

  // Check token on mount
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token validity with backend
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`localhost:8000/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserData(userData);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        register,
        userData,
        summaries,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthForms />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;