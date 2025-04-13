import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 15000, // 15 second timeout
});

// Add retry logic
const withRetry = async (fn, retries = 3) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0 && error.code === 'ECONNABORTED') {
            console.log(`Retrying... ${retries} attempts left`);
            return withRetry(fn, retries - 1);
        }
        throw error;
    }
};

// Get all journals
export const getJournals = async (token) => {
    try {
        return await withRetry(async () => {
            const response = await axiosInstance.get('/journals', {
                headers: { 'x-auth-token': token }
            });
            return response.data;
        });
    } catch (error) {
        console.error('Error fetching journals:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch journals');
    }
};

// Create a new journal entry
export const createJournal = async (journalData, token) => {
    try {
        const response = await axiosInstance.post('/journals', journalData, {
            headers: { 'x-auth-token': token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create journal');
    }
};

// Generate AI journal entry
export const generateJournal = async (prompt, mood, token) => {
    try {
        const response = await axiosInstance.post('/journals/generate', { prompt, mood }, {
            headers: { 'x-auth-token': token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to generate journal');
    }
};

// Generate journal from chat messages
export const generateJournalFromChat = async (date, token) => {
    try {
        const response = await axiosInstance.post('/journals/generate-from-chat', { date }, {
            headers: { 'x-auth-token': token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to generate journal from chat');
    }
};

// Update a journal entry
export const updateJournal = async (id, updates, token) => {
    try {
        const response = await axiosInstance.put(`/journals/${id}`, updates, {
            headers: { 'x-auth-token': token }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update journal');
    }
};

// Delete a journal entry
export const deleteJournal = async (id, token) => {
    try {
        await axiosInstance.delete(`/journals/${id}`, {
            headers: { 'x-auth-token': token }
        });
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to delete journal');
    }
}; 