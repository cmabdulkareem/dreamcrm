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
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';

const SupportDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Request Detail Modal
    const detailModal = useModal();

    // Create Request Modal
    const createModal = useModal();
    const [newRequest, setNewRequest] = useState({
        title: '',
        description: '',
        type: 'issue',
        priority: 'medium'
    });
    const [creating, setCreating] = useState(false);

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

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        if (!newRequest.title.trim() || !newRequest.description.trim()) {
            toast.error("Title and description are required.");
            return;
        }

        setCreating(true);
        try {
            await axios.post(`${API}/support`, newRequest, { withCredentials: true });
            toast.success("Request submitted successfully!");
            setNewRequest({ title: '', description: '', type: 'issue', priority: 'medium' });
            createModal.closeModal();
            fetchRequests();
        } catch (error) {
            console.error("Error submitting support request:", error);
            toast.error(error.response?.data?.message || "Failed to submit request.");
        } finally {
            setCreating(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus, e) => {
        if (e) e.stopPropagation();
        try {
            await axios.patch(`${API}/support/${id}/status`, { status: newStatus }, { withCredentials: true });
            toast.success(`Status updated to ${newStatus}`);
            fetchRequests();
            if (selectedRequest?._id === id) {
                setSelectedRequest(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status.");
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim() || !selectedRequest) return;
        setSubmittingReply(true);
        try {
            const response = await axios.post(`${API}/support/${selectedRequest._id}/responses`, { message: replyMessage }, { withCredentials: true });
            toast.success("Response sent!");
            setReplyMessage('');
            setSelectedRequest(response.data.support);
            fetchRequests();
        } catch (error) {
            console.error("Error sending response:", error);
            toast.error("Failed to send response.");
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleViewRequest = (req) => {
        setSelectedRequest(req);
        detailModal.openModal();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'developing': return 'info';
            case 'fixing': return 'primary';
            case 'done': return 'success';
            default: return 'light';
        }
    };

    if (loading) return <div className="p-6 text-center">Loading requests...</div>;

    const isDev = isDeveloper(user);

    return (
        <div className="space-y-6">
            <PageMeta title="Feature Request & Support | DreamCRM" />
            <PageBreadcrumb pageTitle="Feature Request & Support" />

            <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={createModal.openModal}>
                    + New Request
                </Button>
            </div>

            <ComponentCard title="Recent Requests">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase">ID</TableCell>
                                {isDev && <TableCell isHeader className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase">Brand</TableCell>}
                                <TableCell isHeader className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase">Request</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase">Status</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-left font-semibold text-gray-500 text-xs uppercase">Priority</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-right font-semibold text-gray-500 text-xs uppercase">Action</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isDev ? 6 : 5} className="px-5 py-10 text-center text-gray-500">
                                        No requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req._id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer" onClick={() => handleViewRequest(req)}>
                                        <TableCell className="px-5 py-4 text-xs font-medium text-gray-400">
                                            #{req._id.slice(-6).toUpperCase()}
                                        </TableCell>
                                        {isDev && (
                                            <TableCell className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {req.brand?.name || 'Main'}
                                            </TableCell>
                                        )}
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-800 dark:text-white mb-0.5 line-clamp-1">{req.title}</span>
                                                <span className="text-xs text-gray-400">By {req.createdBy?.fullName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge color={getStatusColor(req.status)} className="uppercase text-[10px] font-bold">
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <span className={`text-[10px] font-bold uppercase ${req.priority === 'critical' ? 'text-red-500' : 'text-gray-400'}`}>
                                                {req.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-right">
                                            <button className="text-brand-500 hover:text-brand-600 text-xs font-bold uppercase tracking-wider">
                                                View
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ComponentCard>

            {/* Request Detail Modal */}
            {selectedRequest && (
                <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="max-w-3xl">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge color={getStatusColor(selectedRequest.status)} className="uppercase text-[10px] font-bold">
                                        {selectedRequest.status}
                                    </Badge>
                                    <span className="text-xs text-gray-400 font-medium">#{selectedRequest._id.slice(-6).toUpperCase()}</span>
                                    <span className={`text-xs font-bold uppercase ${selectedRequest.priority === 'critical' ? 'text-red-500' : 'text-gray-400'}`}>
                                        [{selectedRequest.priority}]
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedRequest.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Submitted by <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedRequest.createdBy?.fullName}</span>
                                    {isDev && selectedRequest.brand && <span className="ml-2">• Brand: <span className="font-semibold text-brand-500">{selectedRequest.brand.name}</span></span>}
                                </p>
                            </div>

                            {(isOwner(user) || isManager(user) || isDeveloper(user)) && (
                                <div className="flex gap-2">
                                    <select
                                        className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-500"
                                        value={selectedRequest.status}
                                        onChange={(e) => handleStatusUpdate(selectedRequest._id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="developing">Developing</option>
                                        <option value="fixing">Fixing</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-white/[0.02] rounded-xl p-5 mb-8">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
                        </div>

                        {/* Responses Section */}
                        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Responses & Updates</h4>

                            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {selectedRequest.responses.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No responses yet.</p>
                                ) : (
                                    selectedRequest.responses.map((resp, idx) => (
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
                                    ))
                                )}
                            </div>

                            <div className="mt-6 space-y-3">
                                <textarea
                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                                    rows={3}
                                    placeholder="Type your response..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={detailModal.closeModal}>Close</Button>
                                    <Button size="sm" variant="primary" loading={submittingReply} onClick={handleReply}>Send Response</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create Request Modal */}
            <Modal isOpen={createModal.isOpen} onClose={createModal.closeModal} className="max-w-2xl">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">New Support Request</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                        Have a suggestion or found a bug? Let us know! Your feedback helps us improve the system.
                    </p>

                    <form onSubmit={handleCreateRequest} className="space-y-5">
                        <div>
                            <Label htmlFor="title" required>Title</Label>
                            <Input
                                id="title"
                                placeholder="Brief title of your request"
                                value={newRequest.title}
                                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <select
                                    id="type"
                                    className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500"
                                    value={newRequest.type}
                                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                                >
                                    <option value="issue">Issue / Problem</option>
                                    <option value="feature-request">Feature Request</option>
                                    <option value="bug">Bug Report</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="priority">Priority</Label>
                                <select
                                    id="priority"
                                    className="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500"
                                    value={newRequest.priority}
                                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description" required>Description</Label>
                            <textarea
                                id="description"
                                rows={4}
                                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Please provide details about your request..."
                                value={newRequest.description}
                                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button variant="outline" type="button" onClick={createModal.closeModal}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={creating}>
                                Submit Request
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default SupportDashboard;
