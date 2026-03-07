import React, { useState, useEffect, useContext, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import PageMeta from '../../components/common/PageMeta';
import { AuthContext } from '../../context/AuthContext';
import API from "../../config/api";
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';

const MyLeaves = () => {
    const { user } = useContext(AuthContext);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyLeaves = async () => {
            if (!user) return;
            try {
                setLoading(true);
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

    // Derived stats
    const stats = useMemo(() => {
        const total = leaves.length;
        const pending = leaves.filter(l => l.status === 'pending').length;
        const approved = leaves.filter(l => l.status === 'approved').length;
        const rejected = leaves.filter(l => l.status === 'rejected').length;
        return [
            { label: 'Total Taken', count: total, color: '#64748B' },
            { label: 'Pending', count: pending, color: '#F59E0B' },
            { label: 'Approved', count: approved, color: '#10B981' },
            { label: 'Rejected', count: rejected, color: '#EF4444' },
        ];
    }, [leaves]);

    const getStatusBadge = (status) => {
        const config = {
            approved: { color: '#10B981', label: 'Approved' },
            rejected: { color: '#EF4444', label: 'Rejected' },
            pending: { color: '#F59E0B', label: 'Pending' }
        };
        const s = config[status] || config.pending;
        return (
            <span
                className="px-2.5 py-1.5 rounded-full text-[12px] font-bold tracking-tight inline-flex items-center gap-1.5 shadow-sm"
                style={{ backgroundColor: `${s.color}15`, color: s.color, border: `1px solid ${s.color}40` }}
            >
                <span className="size-1.5 rounded-full shadow-sm" style={{ backgroundColor: s.color }}></span>
                {s.label}
            </span>
        );
    };

    return (
        <>
            <PageMeta title="My Leaves - CDC International" />
            <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />

            <div className="space-y-5">
                {/* Stats Pills */}
                <div className="flex flex-wrap items-center gap-3">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-gray-200/70 dark:border-white/10 h-11 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-white/10">
                            <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">{stat.label}:</span>
                            <span className="font-black text-[15px] tabular-nums leading-none" style={{ color: stat.color }}>{stat.count}</span>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                    <div className="flex flex-col gap-1 pb-5">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">My Leave History</h3>
                        <p className="text-xs text-gray-400">Your submitted leave requests</p>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
                                <TableRow>
                                    {['Applied On', 'Leave Type', 'Dates', 'Reason', 'Status'].map((h) => (
                                        <TableCell key={h} isHeader className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="py-20 text-center text-gray-400 text-sm">Loading your leaves...</TableCell></TableRow>
                                ) : leaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <p className="text-gray-400 text-sm mb-4">No leave records found.</p>
                                            <a href="/leave-management/apply" className="px-5 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all text-sm font-semibold shadow-lg shadow-blue-950/20">
                                                Apply for Leave
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leaves.map((leave) => (
                                        <TableRow key={leave._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-gray-100/50 dark:border-gray-800/50 last:border-0">
                                            <TableCell className="px-5 py-4">
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{new Date(leave.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <div className="text-sm font-bold text-gray-800 dark:text-white/90 capitalize">{leave.leaveType}</div>
                                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">#{leave.ticketNumber}</div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-0.5 tracking-tight uppercase">
                                                    {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs" title={leave.reason}>{leave.reason}</div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4">
                                                {getStatusBadge(leave.status)}
                                                {leave.actionBy && <div className="text-[11px] text-gray-400 mt-1">By: {leave.actionBy.fullName}</div>}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MyLeaves;
