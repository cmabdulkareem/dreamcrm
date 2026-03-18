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

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            {/* Header section with light blue background */}
            <div className="bg-gray-50/80 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">
                                Manage Holidays
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Global Holiday Calendar</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Add Holiday Form */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Add New Holiday</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Select Date</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white focus:ring-2 focus:ring-blue-800/20 transition-all"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reason (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Festival, National Holiday"
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium dark:text-white focus:ring-2 focus:ring-blue-800/20 transition-all"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleAddHoliday}
                                loading={submitting}
                                className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold"
                            >
                                Mark as Holiday
                            </Button>
                        </div>
                    </div>

                    {/* Holiday List */}
                    <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Upcoming Holidays</h4>
                        <div className="flex-1 min-h-[300px] border border-gray-100 dark:border-gray-800">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <LoadingSpinner className="py-4" />
                                </div>
                            ) : holidays.length > 0 ? (
                                <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {holidays.map(holiday => (
                                        <div key={holiday._id} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                {holiday.reason && <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{holiday.reason}</div>}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteHoliday(holiday._id)}
                                                className="text-gray-300 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Holiday"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-10 px-6 text-center">
                                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-4">
                                        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Holidays Scheduled</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
