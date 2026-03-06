import axios from 'axios';
import API from "../../../config/api";

const marketingService = {
    fetchTasks: async (brandId) => {
        const response = await axios.get(`${API}/marketing/tasks`, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    fetchTeamMembers: async (brandId) => {
        const response = await axios.get(`${API}/users/dropdown?scope=global`, {
            headers: brandId ? { 'x-brand-id': brandId } : {}
        });
        return response.data;
    },

    createTask: async (brandId, taskData) => {
        const response = await axios.post(`${API}/marketing/tasks`, taskData, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    updateTask: async (brandId, taskId, taskData) => {
        const response = await axios.put(`${API}/marketing/tasks/${taskId}`, taskData, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    deleteTask: async (brandId, taskId) => {
        const response = await axios.delete(`${API}/marketing/tasks/${taskId}`, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    toggleSubTask: async (brandId, taskId, subTaskId) => {
        const response = await axios.patch(`${API}/marketing/tasks/${taskId}/subtasks/${subTaskId}/toggle`, {}, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    updateSubTask: async (brandId, taskId, subTaskId, updates) => {
        const response = await axios.patch(`${API}/marketing/tasks/${taskId}/subtasks/${subTaskId}`, updates, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    addSubTask: async (brandId, taskId, subTaskData) => {
        const response = await axios.post(`${API}/marketing/tasks/${taskId}/subtasks`, subTaskData, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    deleteSubTask: async (brandId, taskId, subTaskId) => {
        const response = await axios.delete(`${API}/marketing/tasks/${taskId}/subtasks/${subTaskId}`, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    },

    addRemark: async (brandId, taskId, remarkData) => {
        const response = await axios.post(`${API}/marketing/tasks/${taskId}/remarks`, remarkData, {
            headers: { 'x-brand-id': brandId }
        });
        return response.data;
    }
};

export default marketingService;
