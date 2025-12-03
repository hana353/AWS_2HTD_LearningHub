import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

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