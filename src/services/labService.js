import axios from "axios";
import API from "../config/api";
import { toast } from "react-toastify";

export const labService = {
    // ─── PCs ──────────────────────────────────────
    getPCs: async () => {
        try {
            const res = await axios.get(`${API}/compute-lab/pcs`, { withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load PCs");
            return [];
        }
    },

    addPC: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/pcs`, data, { withCredentials: true });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to add PC");
        }
    },

    updatePC: async (id, data) => {
        try {
            const res = await axios.put(`${API}/compute-lab/pcs/${id}`, data, { withCredentials: true });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to update PC");
        }
    },

    deletePC: async (id) => {
        try {
            await axios.delete(`${API}/compute-lab/pcs/${id}`, { withCredentials: true });
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to delete PC");
        }
    },

    // ─── Schedules ────────────────────────────────
    getSchedules: async (params = {}) => {
        try {
            const res = await axios.get(`${API}/compute-lab/schedules`, { params, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load schedules");
            return [];
        }
    },

    addSchedule: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/schedules`, data, { withCredentials: true });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to assign student");
        }
    },

    updateSchedule: async (id, data) => {
        try {
            const res = await axios.put(`${API}/compute-lab/schedules/${id}`, data, { withCredentials: true });
            toast.success("Schedule updated");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to update schedule");
        }
    },

    deleteSchedule: async (id) => {
        try {
            await axios.delete(`${API}/compute-lab/schedules/${id}`, { withCredentials: true });
            toast.success("Schedule removed");
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to delete schedule");
        }
    },

    // ─── Complaints ───────────────────────────────
    getComplaints: async (params = {}) => {
        try {
            const res = await axios.get(`${API}/compute-lab/complaints`, { params, withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load complaints");
            return [];
        }
    },

    addComplaint: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/complaints`, data, { withCredentials: true });
            toast.success("Complaint raised");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to raise complaint");
        }
    },

    updateComplaint: async (id, data) => {
        try {
            const res = await axios.put(`${API}/compute-lab/complaints/${id}`, data, { withCredentials: true });
            toast.success("Complaint updated");
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to update complaint");
        }
    },

    deleteComplaint: async (id) => {
        try {
            await axios.delete(`${API}/compute-lab/complaints/${id}`, { withCredentials: true });
            toast.success("Complaint deleted");
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to delete complaint");
        }
    },

    // ─── Rows (Unified Layout) ────────────────────
    getRows: async () => {
        try {
            const res = await axios.get(`${API}/compute-lab/rows`, { withCredentials: true });
            return res.data;
        } catch (err) {
            toast.error("Failed to load lab rows");
            return [];
        }
    },

    addRow: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/rows`, data, { withCredentials: true });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to save row");
        }
    },

    deleteRow: async (id) => {
        try {
            await axios.delete(`${API}/compute-lab/rows/${id}`, { withCredentials: true });
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to remove row");
        }
    },

    addEmptySlot: async (data) => {
        try {
            const res = await axios.post(`${API}/compute-lab/rows/slots`, data, { withCredentials: true });
            return res.data;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to add slot");
        }
    },

    removeEmptySlot: async (id) => {
        try {
            await axios.delete(`${API}/compute-lab/rows/slots/${id}`, { withCredentials: true });
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to remove slot");
        }
    }
};
