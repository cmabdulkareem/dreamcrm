import axios from "axios";
import API from "../config/api";
import { toast } from 'react-toastify';

export const hrService = {
    // Stats & Dashboard
    getStats: async () => {
        try {
            const response = await axios.get(`${API}/hr/stats`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch HR stats", error);
            // Return zero values if fetch fails to prevent crash, or rethrow
            return {
                totalEmployees: 0,
                onLeaveToday: 0,
                openPositions: 0,
                interviewsToday: 0
            };
        }
    },

    getRecentActivity: async () => {
        try {
            const response = await axios.get(`${API}/hr/activity`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch recent activity", error);
            return [];
        }
    },

    // Employees
    getEmployees: async () => {
        try {
            const response = await axios.get(`${API}/hr/employees`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch employees", error);
            toast.error(error.response?.data?.message || "Failed to load employees");
            return [];
        }
    },

    getEmployee: async (id) => {
        try {
            const response = await axios.get(`${API}/hr/employees/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to fetch employee details");
        }
    },

    createEmployee: async (data) => {
        try {
            const response = await axios.post(`${API}/hr/employees`, data, { withCredentials: true });
            toast.success('Employee added successfully');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create employee");
        }
    },

    updateEmployee: async (id, data) => {
        try {
            const response = await axios.put(`${API}/hr/employees/${id}`, data, { withCredentials: true });
            toast.success('Employee updated successfully');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to update employee");
        }
    },

    deleteEmployee: async (id) => {
        try {
            await axios.delete(`${API}/hr/employees/${id}`, { withCredentials: true });
            toast.success('Employee deactivated');
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to deactivate employee");
        }
    },

    // Jobs
    getJobs: async () => {
        try {
            const response = await axios.get(`${API}/hr/jobs`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch jobs", error);
            toast.error(error.response?.data?.message || "Failed to load job postings");
            return [];
        }
    },

    getJob: async (id) => {
        try {
            const response = await axios.get(`${API}/hr/jobs/${id}`, { withCredentials: true });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to fetch job details");
        }
    },

    createJob: async (data) => {
        try {
            const response = await axios.post(`${API}/hr/jobs`, data, { withCredentials: true });
            toast.success('Job posted successfully');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to create job posting");
        }
    },

    updateJob: async (id, data) => {
        try {
            const response = await axios.put(`${API}/hr/jobs/${id}`, data, { withCredentials: true });
            toast.success('Job updated successfully');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to update job posting");
        }
    },

    deleteJob: async (id) => {
        try {
            await axios.delete(`${API}/hr/jobs/${id}`, { withCredentials: true });
            toast.success('Job deleted');
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || "Failed to delete job posting");
        }
    },

    // Candidates
    getCandidates: async () => {
        try {
            const response = await axios.get(`${API}/hr/candidates`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch candidates", error);
            toast.error(error.response?.data?.message || "Failed to load candidates");
            return [];
        }
    },

    // Interviews
    getInterviews: async () => {
        try {
            const response = await axios.get(`${API}/hr/interviews`, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch interviews", error);
            toast.error(error.response?.data?.message || "Failed to load interviews");
            return [];
        }
    }
};
