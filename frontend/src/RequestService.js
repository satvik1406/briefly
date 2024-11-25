import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/create`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user';
  }
};

export const verifyUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/verify`, userData);
    return response.data;
  } catch (error) {
    console.error('Error verifying user:', error.response?.data || error.message);
    throw error.response?.data || 'Error verifying user';
  }
};

export const getUserSummaries = async (userId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/summaries/${userId}`, {
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Summaries fetched from API:", response.data); // Debug API response
    return response.data; // Ensure it matches backend response structure
  } catch (error) {
    console.error("Error fetching summaries:", error);
    throw error;
  }
};

export const createUserSummary = async (userData) => {
  try {
    const token = localStorage.getItem('auth_token');

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const response = await axios.post(
      `${API_BASE_URL}/summary/create`,
      userData,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};

export const userSummaryUpload = async (userData) => {
  try {
    const token = localStorage.getItem('auth_token');

    const formData = new FormData();
    formData.append('userId', userData.userId);
    formData.append('type', userData.type);
    formData.append('uploadType', userData.uploadType);
    formData.append('file', userData.initialData);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = await axios.post(
      `${API_BASE_URL}/summary/upload`,
      formData,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating user summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error creating user summary';
  }
};

export const deleteUserSummary = async (summaryId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.delete(`${API_BASE_URL}/summary/${summaryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response;
  } catch (error) {
    console.error('Error deleting summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error deleting summary';
  }
};