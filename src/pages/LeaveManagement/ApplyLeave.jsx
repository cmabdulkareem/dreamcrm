import React, { useState, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import PageMeta from '../../components/common/PageMeta';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';
import { AuthContext } from '../../context/AuthContext';
import API from "../../config/api";
import { Link } from 'react-router-dom';

const ApplyLeave = () => {
    const { user } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle select changes
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            leaveType: 'casual',
            startDate: '',
            endDate: '',
            reason: ''
        });
    };

    // Submit leave request
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('User information not found.');
            return;
        }

        // Client-side validation
        if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Validate dates
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate > endDate) {
            toast.error('Start date cannot be after end date');
            return;
        }

        if (startDate < today) {
            toast.error('Start date cannot be in the past');
            return;
        }

        try {
            setLoading(true);
            const leaveData = {
                employeeName: user.fullName || 'Unknown',
                employeeCode: user.employeeCode || 'N/A',
                leaveType: formData.leaveType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                reason: formData.reason.trim()
            };

            const response = await axios.post(`${API}/leaves/create`, leaveData, {
                timeout: 10000
            });

            toast.success(response.data?.message || 'Leave request submitted successfully!');
            resetForm();
        } catch (error) {
            console.error('Error submitting leave request:', error);
            const msg = error.response?.data?.message || 'Failed to submit leave request';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageMeta title="Apply for Leave - CDC Insights" />
            <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />

            <div className="">
                <div className="rounded-2xl border border-gray-200/60 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl px-8 py-10 dark:border-gray-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
                    <div className="mb-10 text-left">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Apply for Leave</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            Submit your leave request below. HR will review it shortly.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <Label htmlFor="leaveType" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Leave Type *</Label>
                                <Select
                                    options={[
                                        { value: "casual", label: "Casual Leave" },
                                        { value: "sick", label: "Sick Leave" },
                                        { value: "annual", label: "Annual Leave" },
                                        { value: "maternity", label: "Maternity Leave" },
                                        { value: "paternity", label: "Paternity Leave" }
                                    ]}
                                    value={formData.leaveType}
                                    onChange={(value) => handleSelectChange('leaveType', value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2.5">
                                <Label htmlFor="startDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Start Date *</Label>
                                <InputField
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="endDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">End Date *</Label>
                                <InputField
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="reason" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Reason for Leave *</Label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleInputChange}
                                rows="5"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-800 dark:text-white/90 placeholder:text-gray-400 focus:outline-hidden focus:ring-4 focus:ring-blue-950/5 focus:border-blue-950 dark:focus:border-blue-800 transition-all resize-none shadow-theme-xs font-medium"
                                placeholder="Please provide a brief reason for your leave request..."
                                required
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="reset"
                                onClick={resetForm}
                                className="w-full sm:w-auto px-8 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-10 py-3.5 bg-blue-950 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 shadow-2xl shadow-blue-950/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        Need to review your previous requests?{' '}
                        <Link
                            to="/hr/leave-management/my-leaves"
                            className="text-blue-950 dark:text-blue-400 font-bold hover:underline underline-offset-4 ml-1"
                        >
                            Visit My History
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave;
