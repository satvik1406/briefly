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

export const shareSummary = async (summaryId, recipient) => {
  try {
    const token = localStorage.getItem('auth_token'); // Get auth token
    console.log("Request body:", {
      summary_id: summaryId,
      recipient: recipient,
    });
    const response = await axios.post(
      `${API_BASE_URL}/summary/share`, // Adjust the API endpoint as per your backend
      {
        summary_id: summaryId, // Match the backend key "summary_id"
        recipient: recipient,  // Match the backend key "recipient"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Include authorization token
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error sharing summary:', error.response?.data || error.message);
    throw error.response?.data || 'Error sharing summary';
  }
};


export const getUserSharedSummaries = async (userId) => {
  try {
    const token = localStorage.getItem('auth_token'); // Ensure auth token is available
    const response = await axios.get(`${API_BASE_URL}/user/${userId}/shared-summaries`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log("Shared Summaries fetched from API:", response.data); // Debug API response
    return response.data; // Return the fetched data
  } catch (error) {
    console.error('Error fetching shared summaries:', error.response?.data || error.message);
    throw error.response?.data || 'Error fetching shared summaries';
  }
};
