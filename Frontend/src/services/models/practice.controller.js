import axios from 'axios';

// Sử dụng environment variable hoặc fallback về API Gateway URL
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api';

// Get all practices
export const getAllPractices = async () => {
    try {
        const response = await axios.get(`${API_URL}/practices`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Get practice by ID
export const getPracticeById = async (practiceSetId) => {
    try {
        const response = await axios.get(`${API_URL}/practices/${practiceSetId}`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};