import axios from 'axios';
import API from '../config/api';

export const promotionalService = {
    getPromotionals: async (type = 'all', brandId = null) => {
        try {
            const headers = {};
            if (brandId) headers['x-brand-id'] = brandId;

            const response = await axios.get(`${API}/promotional`, {
                params: { type },
                withCredentials: true,
                headers,
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

    deletePromotional: async (id, brandId = null) => {
        try {
            const headers = {};
            if (brandId) headers['x-brand-id'] = brandId;

            const response = await axios.delete(`${API}/promotional/${id}`, {
                withCredentials: true,
                headers,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
