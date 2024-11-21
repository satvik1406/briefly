import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createUser, verifyUser, getUserSummaries } from './RequestService';
import AuthForms from './AuthForms';
import Dashboard from './Dashboard';
import { jwtDecode } from 'jwt-decode';

// Create Auth Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await verifyUser({ email, password });

      if (response.result.auth_token) {
        localStorage.setItem('auth_token', response.result.auth_token);
        localStorage.setItem('user_data', JSON.stringify(response.result.user));
        
        setUserData(response.result.user);
        setIsAuthenticated(true);
        
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUserData(null);
    setSummaries([]);
    setError(null);
  };

  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedUserData = localStorage.getItem('user_data');

      if (!token || !storedUserData) {
        throw new Error('No token or user data found');
      }

      const decodedToken = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      setIsAuthenticated(true);

      try {
        console.log('Fetching summaries for user:', parsedUserData.id);
        const summariesResponse = await getUserSummaries(parsedUserData.id);
        console.log('Summaries response:', summariesResponse);
        
        if (summariesResponse && summariesResponse.status === 'OK') {
          setSummaries(summariesResponse.result || []);
        } else {
          console.error('Invalid summaries response:', summariesResponse);
        }
      } catch (error) {
        console.error('Error fetching summaries:', error);
        setSummaries([]);
      }

    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

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

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
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