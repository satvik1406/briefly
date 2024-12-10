import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { createUser, verifyUser, getUserSummaries } from './RequestService';
import AuthForms from './AuthForms';
import Dashboard from './Dashboard';
import { jwtDecode } from 'jwt-decode';
import { CircularProgress, Box } from '@mui/material';

// Create Auth Context to manage authentication globally
const AuthContext = createContext(null);

// AuthProvider component handles global authentication state and functions
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Tracks user authentication state
  const [userData, setUserData] = useState(null);  // Stores user data after login
  const [summaries, setSummaries] = useState([]); // Stores user summaries fetched from the backend
  const [loading, setLoading] = useState(true); // Tracks loading state for async operations
  const [error, setError] = useState(null); // Tracks error messages for authentication and registration

  // Handles user login by verifying credentials with the backend
  const login = async (email, password) => {
    try {
      setLoading(true);  // Start loading indicator
      setError(null); // Clear previous errors

      // Call verifyUser API to authenticate the user
      const response = await verifyUser({ email, password });

      if (response.result.auth_token) {
        // Store token and user data in localStorage for persistence
        localStorage.setItem('auth_token', response.result.auth_token);
        localStorage.setItem('user_data', JSON.stringify(response.result.user));
        
        setUserData(response.result.user); // Update user data in state
        setIsAuthenticated(true); // Mark user as authenticated
        
        return { success: true }; // Indicate successful login
      }
      
      // Throw error if credentials are invalid
      throw new Error('Invalid credentials');
    } catch (error) {
      setError(error.message || 'Authentication failed'); // Set error message
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Handles user registration by calling the backend API
  const register = async (userData) => {
    try {
      setLoading(true); // Start loading indicator
      setError(null); // Clear previous errors

      // Call createUser API to register a new user
      const response = await createUser(userData);
      return { success: true, user: response }; // Return success response
      
    } catch (error) {
      setError(error.message || 'Registration failed'); // Set error message
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

   // Handles user logout by clearing authentication data
   const logout = () => {
    localStorage.removeItem('auth_token'); // Remove token from localStorage
    localStorage.removeItem('user_data'); // Remove user data from localStorage
    setIsAuthenticated(false); // Reset authentication state
    setUserData(null); // Clear user data
    setSummaries([]); // Clear summaries
    setError(null); // Clear errors
  };

  // Verifies the validity of the stored token and fetches user data
  const verifyToken = async () => {
    try {
      const token = localStorage.getItem('auth_token'); // Retrieve token from localStorage
      const storedUserData = localStorage.getItem('user_data'); // Retrieve user data

      if (!token || !storedUserData) {
        throw new Error('No token or user data found'); // Handle missing token or user data
      }

      // Decode token to check expiration
      const decodedToken = jwtDecode(token);
      
      if (decodedToken.exp * 1000 < Date.now()) {
        throw new Error('Token expired'); // Handle expired token
      }

      const parsedUserData = JSON.parse(storedUserData); // Parse stored user data
      setUserData(parsedUserData); // Update user data in state
      setIsAuthenticated(true); // Mark user as authenticated

      // Fetch user summaries from the backend
      try {
        console.log('Fetching summaries for user:', parsedUserData.id);
        const summariesResponse = await getUserSummaries(parsedUserData.id);
        console.log('Summaries response:', summariesResponse);
        
        if (summariesResponse && summariesResponse.status === 'OK') {
          setSummaries(summariesResponse.result || []); // Store summaries in state
        } else {
          console.error('Invalid summaries response:', summariesResponse); // Handle invalid response
        }
      } catch (error) {
        console.error('Error fetching summaries:', error);
        setSummaries([]); // Clear summaries on error
      }

    } catch (error) {
      console.error('Token verification failed:', error);
      logout(); // Log out if token verification fails
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Automatically verify token on component mount
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

// Custom hook to consume AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ProtectedRoute component restricts access to authenticated users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login', { replace: true }); // Redirect unauthenticated users to login
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    // Show loading spinner while verifying authentication
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh', // Full screen height
          width: '100vw', // Full screen width
          bgcolor: 'background.default', // Optional: Matches the app's background color
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render children if user is authenticated
  return isAuthenticated ? children : null;
};

// Main App component that defines routes and integrates AuthProvider
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