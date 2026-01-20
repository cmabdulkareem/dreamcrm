import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import Button from '../../components/ui/button/Button.jsx';
import { useAuth } from '../../context/AuthContext';
import { isOwner, isManager, isDeveloper } from '../../utils/roleHelpers';
import Badge from '../../components/ui/badge/Badge.jsx';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';

const SupportDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const fetchRequests = async () => {
        try {
            const response = await axios.get(`${API}/support`, { withCredentials: true });
            setRequests(response.data);
        } catch (error) {
            console.error("Error fetching support requests:", error);
            toast.error("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(`${API}/support/${id}/status`, { status: newStatus }, { withCredentials: true });
            toast.success(`Status updated to ${newStatus}`);
            fetchRequests();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status.");
        }
    };

    const handleReply = async (id) => {
        if (!replyMessage.trim()) return;
        setSubmittingReply(true);
        try {
            await axios.post(`${API}/support/${id}/responses`, { message: replyMessage }, { withCredentials: true });
            toast.success("Response sent!");
            setReplyMessage('');
            setReplyingTo(null);
            fetchRequests();
        } catch (error) {
            console.error("Error sending response:", error);
            toast.error("Failed to send response.");
        } finally {
            setSubmittingReply(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'developing': return 'blue';
            case 'fixing': return 'orange';
            case 'done': return 'green';
            default: return 'gray';
        }
    };

    if (loading) return <div className="p-6 text-center">Loading requests...</div>;

    return (
        <div className="space-y-6">
            <PageMeta title="Feature Request & Support | DreamCRM" />
            <PageBreadcrumb pageTitle="Feature Request & Support" />

            <div className="flex justify-end">
                <Link to="/support/new">
                    <Button variant="primary" size="sm">+ New Request</Button>
                </Link>
            </div>

            <div className="space-y-6">
                {requests.length === 0 ? (
                    <ComponentCard>
                        <div className="text-center py-20 px-4">
                            <p className="text-gray-500">No requests found. Track and manage system suggestions and issues here.</p>
                        </div>
                    </ComponentCard>
                ) : (
                    requests.map((req) => (
                        <ComponentCard
                            key={req._id}
                            title={
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge color={getStatusColor(req.status)} className="uppercase text-[10px] font-bold">
                                                {req.status}
                                            </Badge>
                                            <span className="text-xs text-gray-400 font-medium">#{req._id.slice(-6).toUpperCase()}</span>
                                            <span className={`text-xs font-bold uppercase ${req.priority === 'critical' ? 'text-red-500' : 'text-gray-400'}`}>
                                                [{req.priority}]
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{req.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Submitted by <span className="font-semibold text-gray-700 dark:text-gray-200">{req.createdBy?.fullName || 'Unknown User'}</span>
                                        </p>
                                    </div>

                                    {(isOwner(user) || isManager(user) || isDeveloper(user)) && (
                                        <div className="flex gap-2">
                                            <select
                                                className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500"
                                                value={req.status}
                                                onChange={(e) => handleStatusUpdate(req._id, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="developing">Developing</option>
                                                <option value="fixing">Fixing</option>
                                                <option value="done">Done</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            }
                        >
                            <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{req.description}</p>
                            </div>

                            {/* Responses Section */}
                            <div className="space-y-4 pt-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Responses & Updates</h4>
                                {req.responses.map((resp, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="size-8 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-brand-600 uppercase">{resp.sender?.fullName?.[0]}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700 dark:text-white">{resp.sender?.fullName}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(resp.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{resp.message}</p>
                                        </div>
                                    </div>
                                ))}

                                {replyingTo === req._id ? (
                                    <div className="mt-4 space-y-3">
                                        <textarea
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                            rows={2}
                                            placeholder="Type your response..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>Cancel</Button>
                                            <Button size="sm" variant="primary" loading={submittingReply} onClick={() => handleReply(req._id)}>Send</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setReplyingTo(req._id)}
                                        className="text-xs font-bold text-brand-500 hover:text-brand-600 transition-colors uppercase tracking-widest mt-2"
                                    >
                                        + Add Response
                                    </button>
                                )}
                            </div>
                        </ComponentCard>
                    ))
                )}
            </div>
        </div>
    );
};

export default SupportDashboard;
