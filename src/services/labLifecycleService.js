import axios from "axios";
import API from "../config/api";
import { toast } from "react-toastify";

export const labLifecycleService = {
    // ─── Queue ─────────────────────────────────────
    getQueue: async (params = {}) => {
        try {
            const res = await axios.get(`${API}/compute-lab/queue`, { params, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load queue");
            return [];
        }
    },

    addToQueue: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/queue`, data, { withCredentials: true });
            toast.success("Student added to queue");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to add to queue");
        }
    },

    removeFromQueue: async (id, data = {}) => {
        try {
            await axios.delete(`${API}/compute-lab/queue/${id}`, { data, withCredentials: true });
            toast.success("Removed from queue");
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to remove from queue");
        }
    },

    // ─── Sessions ──────────────────────────────────
    getActiveSessions: async (labId) => {
        try {
            const res = await axios.get(`${API}/compute-lab/sessions/active`, { params: { labId }, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load active sessions");
            return [];
        }
    },

    assignSession: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/sessions/assign`, data, { withCredentials: true });
            toast.success("Student assigned successfully");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to assign student");
        }
    },

    startSession: async (id) => {
        try {
            const res = await axios.post(`${API}/compute-lab/sessions/${id}/start`, {}, { withCredentials: true });
            toast.success("Session started");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to start session");
        }
    },

    endSession: async (id, data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/sessions/${id}/end`, data, { withCredentials: true });
            toast.success("Session ended successfully");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to end session");
        }
    },

    transferSession: async (id, data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/sessions/${id}/transfer`, data, { withCredentials: true });
            toast.success("Session transferred");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to transfer session");
        }
    },

    // ─── Analytics ─────────────────────────────────
    getAnalytics: async (params = {}) => {
        try {
            const res = await axios.get(`${API}/compute-lab/analytics/usage`, { params, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load analytics");
            return null;
        }
    },

    getHistory: async (params = {}) => {
        try {
            const res = await axios.get(`${API}/compute-lab/history`, { params, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load history");
            return [];
        }
    }
};
