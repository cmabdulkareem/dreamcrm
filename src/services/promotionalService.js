import axios from 'axios';
import API from '../config/api';

export const promotionalService = {
    getPromotionals: async (type = 'all') => {
        try {
            const response = await axios.get(`${API}/promotional`, {
                params: { type },
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadPromotional: async (formData, brandId) => {
        try {
            const response = await axios.post(`${API}/promotional/upload`, formData, {
                withCredentials: true,
                headers: {
                    'x-brand-id': brandId,
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deletePromotional: async (id) => {
        try {
            const response = await axios.delete(`${API}/promotional/${id}`, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
