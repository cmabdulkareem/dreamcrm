import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

export default function HolidayCalendarModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchHolidays();
        }
    }, [isOpen]);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/holidays`, { withCredentials: true });
            setHolidays(res.data.holidays);
        } catch (error) {
            console.error("Failed to fetch holidays:", error);
            // toast.error("Failed to load holidays.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddHoliday = async () => {
        if (!selectedDate) return;
        setSubmitting(true);
        try {
            await axios.post(`${API}/holidays`, { date: selectedDate, reason }, { withCredentials: true });
            toast.success("Holiday marked successfully.");
            setReason('');
            fetchHolidays();
        } catch (error) {
            console.error("Error adding holiday:", error);
            toast.error(error.response?.data?.message || "Failed to add holiday.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteHoliday = async (id) => {
        try {
            await axios.delete(`${API}/holidays/${id}`, { withCredentials: true });
            toast.success("Holiday removed.");
            fetchHolidays();
        } catch (error) {
            console.error("Error deleting holiday:", error);
            toast.error("Failed to remove holiday.");
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Global Holidays</h3>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Festival, National Holiday"
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleAddHoliday}
                        loading={submitting}
                        className="w-full"
                    >
                        Mark as Holiday
                    </Button>
                </div>

                <div className="border-t pt-6">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Upcoming/Current Holidays</h4>
                    {loading ? (
                        <LoadingSpinner className="py-4" />
                    ) : holidays.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                            {holidays.map(holiday => (
                                <div key={holiday._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                            {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        {holiday.reason && <div className="text-xs text-gray-500 dark:text-gray-400">{holiday.reason}</div>}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteHoliday(holiday._id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No holidays marked yet.</p>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}
