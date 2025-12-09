import axios from 'axios';

// Sử dụng environment variable hoặc fallback về API Gateway URL
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api';

// Get all tests
export const getAllTests = async () => {
    try {
        const response = await axios.get(`${API_URL}/tests`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Get test by ID
export const getTestById = async (testId) => {
    try {
        const response = await axios.get(`${API_URL}/tests/${testId}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};