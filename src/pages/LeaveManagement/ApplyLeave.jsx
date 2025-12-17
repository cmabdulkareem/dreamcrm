import React, { useState, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../../components/common/ComponentCard';
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
                employeeId: user.employeeCode || 'N/A', // Fallback to N/A instead of internal ID
                leaveType: formData.leaveType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                reason: formData.reason.trim()
            };

            const response = await axios.post(`${API}/leaves/create`, leaveData, {
                timeout: 10000
            });

            if (response.data && response.data.message) {
                toast.success(response.data.message || 'Leave request submitted successfully!');
            } else {
                toast.success('Leave request submitted successfully!');
            }

            resetForm();
        } catch (error) {
            console.error('Error submitting leave request:', error);

            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message ||
                    (error.response.data?.errors ? error.response.data.errors.join(', ') : 'Failed to submit leave request');
                toast.error(errorMessage);
            } else if (error.request) {
                // Request was made but no response received
                toast.error('Network error. Please check your connection.');
            } else {
                // Something else happened
                toast.error('Failed to submit leave request. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta title="Apply for Leave - CRM" />
            <div className="max-w-3xl mx-auto">
                <ComponentCard title="Apply for Leave">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Fill out the form below to submit a new leave request.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">

                            {/* Employee Details (Auto-filled) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Employee Name</Label>
                                    <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                                        {user?.fullName || 'Loading...'}
                                    </div>
                                </div>
                                <div>
                                    <Label>Employee ID</Label>
                                    <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">
                                        {user?.employeeCode || 'Not Assigned'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="leaveType">Leave Type *</Label>
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
                                <div></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <InputField
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="endDate">End Date *</Label>
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

                            <div>
                                <Label htmlFor="reason">Reason for Leave *</Label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800 rounded-lg shadow-theme-xs"
                                    required
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="reset"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                >
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Want to check your leave usage?{' '}
                            <Link
                                to="/leave-management/my-leaves"
                                className="text-brand-500 dark:text-brand-400 hover:underline"
                            >
                                View My Leaves
                            </Link>
                        </p>
                    </div>
                </ComponentCard>
            </div>
            <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
        </>
    );
};

export default ApplyLeave;
