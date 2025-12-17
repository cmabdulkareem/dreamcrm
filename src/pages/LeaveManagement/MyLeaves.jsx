import React, { useState, useEffect, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import { AuthContext } from '../../context/AuthContext';
import API from "../../config/api";
import { Link } from 'react-router-dom';

const MyLeaves = () => {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyLeaves = async () => {
            if (!user) return;

            try {
                setLoading(true);
                // Assuming GET /leaves returns all leaves, we might need a specific endpoint or filter client-side
                // Ideally: GET /leaves?employeeId=... or GET /leaves/my-leaves
                // For now, let's try GET /leaves and filter client side if needed, or hope it returns relevant ones

                // Note: The original index.jsx fetches all leaves. We probably want to reuse that API but filter.
                // If the API supports filtering by query param, that's better.
                // Let's assume we filter by employeeId on client side for now as a safe bet if API is generic.

                const response = await axios.get(`${API}/leaves`, {
                    withCredentials: true,
                    timeout: 10000
                });

                let fetchedLeaves = [];
                if (response.data && response.data.leaves) {
                    fetchedLeaves = response.data.leaves;
                } else if (response.data && Array.isArray(response.data)) {
                    fetchedLeaves = response.data;
                }

                // Filter for current user if response doesn't seem to be already filtered (simple heuristic or strict filter)
                // Adjust referencing user.id or user.employeeId based on what matches the record
                const employeeCode = user.employeeCode;
                const userId = user._id || user.id;

                const myLeaves = fetchedLeaves.filter(leave =>
                    (employeeCode && (leave.employeeCode === employeeCode || leave.employeeId === employeeCode)) ||
                    (userId && (leave.userId === userId || leave.userId?._id === userId || leave.employeeId === userId))
                );

                setLeaves(myLeaves);

            } catch (error) {
                console.error('Error fetching my leaves:', error);
                toast.error('Failed to fetch your leave history.');
            } finally {
                setLoading(false);
            }
        };

        fetchMyLeaves();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
        }
    };

    return (
        <>
            <PageMeta title="My Leaves - CRM" />
            <div className="max-w-4xl mx-auto">
                <ComponentCard title="My Leave History">

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">Loading your leaves...</p>
                        </div>
                    ) : leaves.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No leave records found.</p>
                            <Link
                                to="/leave-management/apply"
                                className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                            >
                                Apply for Leave
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Applied On</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leave Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                                    {leaves.map((leave) => (
                                        <tr key={leave._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">{new Date(leave.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">{leave.leaveType}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Ticket: {leave.ticketNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white truncate max-w-xs" title={leave.reason}>
                                                    {leave.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ComponentCard>
            </div>
            <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
        </>
    );
};

export default MyLeaves;
