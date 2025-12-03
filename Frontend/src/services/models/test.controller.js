import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

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