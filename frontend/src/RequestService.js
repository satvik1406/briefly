import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/user/create`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user';
  }
};

export const verifyUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/user/verify`, userData);
    return response.data;
  } catch (error) {
    console.error('Error verifying user:', error.response?.data || error.message);
    throw error.response?.data || 'Error verifying user';
  }
};

export const getUserSummaries = async (userId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/summaries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying user:', error.response?.data || error.message);
    throw error.response?.data || 'Error verifying user';
  }
};

export const createUserSummary = async (userData) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    const response = await axios.post(
      `${API_BASE_URL}/user/create/summary`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};
