import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import { Modal } from '../../components/ui/modal';
import { useModal } from '../../hooks/useModal';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import PhoneInput from '../../components/form/group-input/PhoneInput';
import API from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { isOwner, isManager } from '../../utils/roleHelpers';
import { CloseIcon, DownloadIcon, FileIcon } from '../../icons';
import { countries, callListStatusOptions } from '../../data/DataSets';

export default function CallList() {
    const { user } = useContext(AuthContext);
    const [callLists, setCallLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();

    // Form states
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [socialMediaId, setSocialMediaId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [source, setSource] = useState('');
    const [purpose, setPurpose] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [users, setUsers] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkAssignedTo, setBulkAssignedTo] = useState('');
    const [bulkSource, setBulkSource] = useState('');
    const [bulkPurpose, setBulkPurpose] = useState('');


    const canDelete = isOwner(user);

    useEffect(() => {
        fetchCallLists();
        if (isOwner(user) || isManager(user)) {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            // Use scope=global to get users from ALL brands for assignment
            const response = await axios.get(`${API}/users/dropdown?roles=Owner,Brand Manager,Counsellor,Counselor&scope=global`, { withCredentials: true });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchCallLists = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/call-lists`, { withCredentials: true });
            setCallLists(response.data.callLists);
        } catch (error) {
            console.error("Error fetching call lists:", error);
            toast.error("Failed to load call lists.");
        } finally {
            setLoading(false);
            setSelectedIds([]); // Reset selection on refresh
        }
    };

    const resetForm = () => {
        setName('');
        setPhoneNumber('');
        setSocialMediaId('');
        setRemarks('');
        setSource('');
        setPurpose('');
        setAssignedTo('');
        setSelectedEntry(null);
    };

    const handleAdd = async () => {
        // At least one field (excluding remarks) must be filled
        if (!name && !phoneNumber && !socialMediaId) {
            toast.error("Please fill at least one field (Name, Phone, or Social Media ID).");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axios.post(
                `${API}/call-lists`,
                { name, phoneNumber, socialMediaId, remarks, assignedTo },
                { withCredentials: true }
            );

            toast.success("Call list entry added successfully!");
            setCallLists([response.data.callList, ...callLists]);
            closeAddModal();
            resetForm();
        } catch (error) {
            console.error("Error adding call list:", error);
            toast.error(error.response?.data?.message || "Failed to add entry.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (entry) => {
        setSelectedEntry(entry);
        setName(entry.name || '');
        setPhoneNumber(entry.phoneNumber || '');
        setSocialMediaId(entry.socialMediaId || '');
        setRemarks(entry.remarks || '');
        setSource(entry.source || '');
        setPurpose(entry.purpose || '');
        setAssignedTo(entry.assignedTo?._id || '');
        openEditModal();
    };

    const handleUpdate = async () => {
        // At least one field (excluding remarks) must be filled
        if (!name && !phoneNumber && !socialMediaId) {
            toast.error("Please fill at least one field (Name, Phone, or Social Media ID).");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axios.put(
                `${API}/call-lists/${selectedEntry._id}`,
                {
                    name,
                    phoneNumber,
                    socialMediaId,
                    remarks,
                    source,
                    purpose,
                    assignedTo: assignedTo || null
                },
                { withCredentials: true }
            );

            toast.success("Call list entry updated successfully!");
            setCallLists(callLists.map(c => c._id === selectedEntry._id ? response.data.callList : c));
            closeEditModal();
            resetForm();
        } catch (error) {
            console.error("Error updating call list:", error);
            toast.error(error.response?.data?.message || "Failed to update entry.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (entry) => {
        setSelectedEntry(entry);
        openDeleteModal();
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API}/call-lists/${selectedEntry._id}`, { withCredentials: true });
            toast.success("Call list entry deleted successfully!");
            setCallLists(callLists.filter(c => c._id !== selectedEntry._id));
            closeDeleteModal();
            resetForm();
        } catch (error) {
            console.error("Error deleting call list:", error);
            toast.error(error.response?.data?.message || "Failed to delete entry.");
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(
                `${API}/call-lists/${id}/status`,
                { status: newStatus },
                { withCredentials: true }
            );

            toast.success("Status updated successfully!");
            setCallLists(callLists.map(entry =>
                entry._id === id ? { ...entry, status: newStatus } : entry
            ));
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(error.response?.data?.message || "Failed to update status.");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length && filteredData.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(item => item._id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.length === 0) {
            toast.error("Please select entries to update.");
            return;
        }

        // Check if at least one field is set
        if (!bulkAssignedTo && !bulkSource && !bulkPurpose) {
            toast.error("Please select a user, or enter source/purpose to update.");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axios.post(
                `${API}/call-lists/bulk-assign`, // Using existing endpoint which now supports partial updates
                {
                    ids: selectedIds,
                    assignedTo: bulkAssignedTo,
                    source: bulkSource,
                    purpose: bulkPurpose
                },
                { withCredentials: true }
            );

            toast.success(response.data.message || "Bulk update successful!");
            fetchCallLists();
            // Reset fields
            setBulkAssignedTo('');
            setBulkSource('');
            setBulkPurpose('');
        } catch (error) {
            console.error("Error in bulk update:", error);
            toast.error(error.response?.data?.message || "Failed to perform bulk update.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const filteredData = callLists.filter(item => {
        const searchLower = search.toLowerCase();
        return (
            item.name?.toLowerCase().includes(searchLower) ||
            item.phoneNumber?.includes(search) ||
            item.socialMediaId?.toLowerCase().includes(searchLower) ||
            item.remarks?.toLowerCase().includes(searchLower) ||
            item.source?.toLowerCase().includes(searchLower) ||
            item.purpose?.toLowerCase().includes(searchLower)
        );
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderActions = (entry) => (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                Edit
            </Button>
            {canDelete && (
                <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    endIcon={<CloseIcon className="size-4" />}
                    onClick={() => handleDeleteClick(entry)}
                />
            )}
        </div>
    );

    const renderStatus = (entry) => (
        <div className="flex flex-col gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium w-fit capitalize ${callListStatusOptions.find(opt => opt.value === entry.status)?.color || 'bg-gray-100 text-gray-700'
                }`}>
                {entry.status || 'pending'}
            </span>
            <select
                className="text-[10px] bg-transparent border border-gray-200 dark:border-gray-800 rounded px-1 py-0.5 outline-none focus:border-brand-500"
                value={entry.status || 'pending'}
                onChange={(e) => handleStatusUpdate(entry._id, e.target.value)}
            >
                {callListStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        Mark as {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
            <PageMeta
                title="Cold Call list | DreamCRM"
                description="Manage customer contact information"
            />
            <PageBreadcrumb pageTitle="Cold Call list" />

            {selectedIds.length > 0 && (
                <div className="mb-6 p-4 bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-8 bg-brand-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-500/20">
                            {selectedIds.length}
                        </div>
                        <div>
                            <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                                {selectedIds.length} Entries Selected
                            </span>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full md:w-auto">
                        <div>
                            <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Source</label>
                            <input
                                type="text"
                                value={bulkSource}
                                onChange={(e) => setBulkSource(e.target.value)}
                                placeholder="e.g. LinkedIn"
                                className="w-full sm:w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Purpose</label>
                            <input
                                type="text"
                                value={bulkPurpose}
                                onChange={(e) => setBulkPurpose(e.target.value)}
                                placeholder="e.g. Sales"
                                className="w-full sm:w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Assign To</label>
                            <div className="relative sm:min-w-[200px]">
                                <select
                                    value={bulkAssignedTo}
                                    onChange={(e) => setBulkAssignedTo(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                                >
                                    <option value="">Select User (No Change)</option>
                                    <option value="unassign">Unassign (None)</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            loading={isSubmitting}
                            onClick={handleBulkUpdate}
                            className="whitespace-nowrap shadow-lg shadow-brand-500/20 h-[38px] mb-[1px]" // Align with inputs
                        >
                            Update Selected
                        </Button>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Cold Call list</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer contact information</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" onClick={openImportModal} className="w-full sm:w-auto" startIcon={<FileIcon className="size-5" />}>
                        Import
                    </Button>
                    <Button variant="primary" onClick={openAddModal} className="w-full sm:w-auto">
                        Add New Entry
                    </Button>
                </div>
            </div>

            <ComponentCard>
                {/* Search */}
                <div className="mb-4">
                    <Input
                        type="text"
                        placeholder="Search by name, phone, social media, or remarks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <LoadingSpinner />
                ) : filteredData.length > 0 ? (
                    <div className="space-y-4">
                        {/* Mobile view Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {filteredData.map((entry, index) => (
                                <div key={entry._id} className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {(isOwner(user) || isManager(user)) && (
                                                <input
                                                    type="checkbox"
                                                    className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                    checked={selectedIds.includes(entry._id)}
                                                    onChange={() => toggleSelect(entry._id)}
                                                />
                                            )}
                                            <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                                            <h3 className="font-semibold text-gray-800 dark:text-white">{entry.name || 'Unnamed'}</h3>
                                        </div>
                                        {renderStatus(entry)}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        {entry.phoneNumber && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                                                <a
                                                    href={`tel:${entry.phoneNumber}`}
                                                    className="text-brand-500 hover:underline font-medium"
                                                >
                                                    {entry.phoneNumber}
                                                </a>
                                            </div>
                                        )}
                                        {entry.socialMediaId && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Social:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{entry.socialMediaId}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Assigned:</span>
                                            <span className="text-gray-700 dark:text-gray-300">{entry.assignedTo?.fullName || 'Unassigned'}</span>
                                        </div>
                                        {entry.source && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Source:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{entry.source}</span>
                                            </div>
                                        )}
                                        {entry.purpose && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{entry.purpose}</span>
                                            </div>
                                        )}
                                        {entry.remarks && (
                                            <div className="mt-2 p-2 bg-gray-50 dark:bg-white/[0.02] rounded text-xs text-gray-600 dark:text-gray-400 italic">
                                                "{entry.remarks}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800">
                                        <span className="text-[10px] text-gray-400">{formatDate(entry.createdAt)}</span>
                                        {renderActions(entry)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop view Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                    <TableRow>
                                        {(isOwner(user) || isManager(user)) && (
                                            <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                    checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">#</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Phone Number</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Assigned To</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Social Media ID</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Source</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Purpose</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Remarks</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredData.map((entry, index) => (
                                        <TableRow key={entry._id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                                            {(isOwner(user) || isManager(user)) && (
                                                <TableCell className="py-3">
                                                    <input
                                                        type="checkbox"
                                                        className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                        checked={selectedIds.includes(entry._id)}
                                                        onChange={() => toggleSelect(entry._id)}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell className="py-3 text-gray-400 text-theme-xs">{index + 1}</TableCell>
                                            <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{entry.name || '-'}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {entry.phoneNumber ? (
                                                    <a href={`tel:${entry.phoneNumber}`} className="text-brand-500 hover:underline">
                                                        {entry.phoneNumber}
                                                    </a>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{entry.assignedTo?.fullName || 'Unassigned'}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{entry.socialMediaId || '-'}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{entry.source || '-'}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{entry.purpose || '-'}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                <div className="max-w-[150px] truncate" title={entry.remarks}>
                                                    {entry.remarks || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(entry.createdAt)}</TableCell>
                                            <TableCell className="py-3">
                                                {renderStatus(entry)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {renderActions(entry)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No call list entries found.</p>
                        <Button variant="outline" onClick={openAddModal}>
                            Add your first entry
                        </Button>
                    </div>
                )}
            </ComponentCard>

            {/* Add Modal */}
            <Modal isOpen={isAddOpen} onClose={closeAddModal} className="max-w-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Add Call List Entry</h2>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name (optional)"
                        />
                    </div>
                    <div>
                        <Label>Phone Number</Label>
                        <PhoneInput
                            selectPosition="end"
                            countries={countries}
                            placeholder="+91 98765 43210"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                        />
                    </div>
                    <div>
                        <Label htmlFor="socialMediaId">Social Media ID</Label>
                        <Input
                            id="socialMediaId"
                            type="text"
                            value={socialMediaId}
                            onChange={(e) => setSocialMediaId(e.target.value)}
                            placeholder="Instagram, Facebook, etc. (optional)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="source">Source</Label>
                        <Input
                            id="source"
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="e.g. LinkedIn, Referral (optional)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="purpose">Purpose</Label>
                        <Input
                            id="purpose"
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Sales, Inquiry (optional)"
                        />
                    </div>
                    {(isOwner(user) || isManager(user)) && (
                        <div>
                            <Label htmlFor="assignedTo">Assign To</Label>
                            <select
                                id="assignedTo"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none"
                            >
                                <option value="">Select User (Optional)</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="remarks">Remarks</Label>
                        <textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add any notes (optional)"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs"
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={closeAddModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleAdd} loading={isSubmitting}>Add Entry</Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={isEditOpen} onClose={closeEditModal} className="max-w-2xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">Edit Call List Entry</h2>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="editName">Name</Label>
                        <Input
                            id="editName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name (optional)"
                        />
                    </div>
                    <div>
                        <Label>Phone Number</Label>
                        <PhoneInput
                            selectPosition="end"
                            countries={countries}
                            placeholder="+91 98765 43210"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                        />
                    </div>
                    <div>
                        <Label htmlFor="editSocialMediaId">Social Media ID</Label>
                        <Input
                            id="editSocialMediaId"
                            type="text"
                            value={socialMediaId}
                            onChange={(e) => setSocialMediaId(e.target.value)}
                            placeholder="Instagram, Facebook, etc. (optional)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="editSource">Source</Label>
                        <Input
                            id="editSource"
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="e.g. LinkedIn, Referral (optional)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="editPurpose">Purpose</Label>
                        <Input
                            id="editPurpose"
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Sales, Inquiry (optional)"
                        />
                    </div>
                    {(isOwner(user) || isManager(user)) && (
                        <div>
                            <Label htmlFor="editAssignedTo">Assign To</Label>
                            <select
                                id="editAssignedTo"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none"
                            >
                                <option value="">Select User (Optional)</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.fullName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="editRemarks">Remarks</Label>
                        <textarea
                            id="editRemarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add any notes (optional)"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs"
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdate} loading={isSubmitting}>Update Entry</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} className="max-w-md p-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Confirm Delete</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete this call list entry?
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeDeleteModal}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </div>
            </Modal>

            {/* Import Modal */}
            <Modal
                isOpen={isImportOpen}
                onClose={closeImportModal}
                className="max-w-xl p-0 overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        Import Call List
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Upload a CSV file to bulk import call list entries.
                    </p>
                </div>

                <div className="p-6">
                    <div className="space-y-6">
                        {/* Step 1: Download Template */}
                        <div className="bg-brand-50/50 dark:bg-brand-500/5 p-4 rounded-xl border border-brand-100 dark:border-brand-500/20 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400">Step 1: Get the template</h4>
                                <p className="text-xs text-brand-600/80 dark:text-brand-400/60 mt-0.5">Use our CSV template to ensure correct data formatting.</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-white dark:bg-gray-900"
                                onClick={() => {
                                    const headers = ["Name", "Phone Number", "Social Media ID", "Remarks"];
                                    const sampleData = [
                                        ["John Doe", "9876543210", "john_insta", "Very interested"],
                                        ["Jane Smith", "9123456789", "jane_fb", "Follow up next week"]
                                    ];
                                    const csvContent = "data:text/csv;charset=utf-8," +
                                        [headers, ...sampleData].map(e => e.join(",")).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", "call_list_template.csv");
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                Download Sample
                            </Button>
                        </div>

                        {/* Step 2: Upload File */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Step 2: Upload your file</h4>
                            <div
                                className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-brand-300 dark:hover:border-brand-800 transition-colors cursor-pointer group"
                                onClick={() => document.getElementById('csv-upload-calllist').click()}
                            >
                                <div className="size-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors">
                                    <DownloadIcon className="size-6 text-gray-400 group-hover:text-brand-500 rotate-180" />
                                </div>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">Click to upload or drag and drop</p>
                                <p className="text-xs text-gray-400 mt-1">Only CSV files are supported</p>
                                <input
                                    type="file"
                                    id="csv-upload-calllist"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
                                                toast.error("Please upload a valid CSV file");
                                                return;
                                            }
                                            toast.info(`Selected ${file.name}`);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
                            <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] text-white font-bold">i</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Important Notes:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>At least one field (Name, Phone, or Social Media ID) is mandatory for each row.</li>
                                    <li>Remarks can be left empty.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={closeImportModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" loading={isSubmitting} onClick={() => {
                        const fileInput = document.getElementById('csv-upload-calllist');
                        if (fileInput.files.length === 0) {
                            toast.error("Please select a file first");
                            return;
                        }

                        setIsSubmitting(true);
                        const file = fileInput.files[0];

                        Papa.parse(file, {
                            header: true,
                            skipEmptyLines: true,
                            complete: async (results) => {
                                // Helper to find case-insensitive key
                                const findKey = (keys, candidates) => {
                                    if (!keys) return null;
                                    const lowerKeys = keys.map(k => k.toLowerCase().trim());
                                    for (const candidate of candidates) {
                                        const index = lowerKeys.indexOf(candidate.toLowerCase());
                                        if (index !== -1) return keys[index];
                                    }
                                    return null;
                                };

                                const headers = results.meta.fields || [];
                                console.log("CSV Headers:", headers);

                                // Map keys
                                const nameKey = findKey(headers, ["Name", "Full Name", "Lead Name"]);
                                const phoneKey = findKey(headers, ["Phone Number", "Phone", "Mobile", "Contact"]);
                                const socialKey = findKey(headers, ["Social Media ID", "Social Media", "Social", "Instagram", "Facebook"]);
                                const remarksKey = findKey(headers, ["Remarks", "Note", "Comment"]);

                                const parsedEntries = results.data.map(row => {
                                    return {
                                        name: nameKey ? row[nameKey] : "",
                                        phoneNumber: phoneKey ? row[phoneKey] : "",
                                        socialMediaId: socialKey ? row[socialKey] : "",
                                        remarks: remarksKey ? row[remarksKey] : ""
                                    };
                                });

                                const validEntries = parsedEntries.filter(l => l.name || l.phoneNumber || l.socialMediaId);

                                if (validEntries.length === 0) {
                                    toast.error("No valid entries found in file. Check Name, Phone, or Social Media ID columns.");
                                    setIsSubmitting(false);
                                    return;
                                }

                                try {
                                    const response = await axios.post(
                                        `${API}/call-lists/import`,
                                        { entries: validEntries },
                                        { withCredentials: true }
                                    );

                                    toast.success(response.data.message || "Import successful!");
                                    fetchCallLists(); // Refresh table
                                    closeImportModal();
                                } catch (error) {
                                    console.error("Import failed:", error);
                                    toast.error(error.response?.data?.message || "Import failed. Please try again.");
                                } finally {
                                    setIsSubmitting(false);
                                }
                            },
                            error: (error) => {
                                console.error("CSV Parse Error:", error);
                                toast.error("Failed to parse CSV file.");
                                setIsSubmitting(false);
                            }
                        });
                    }}>
                        Confirm Import
                    </Button>
                </div>
            </Modal>

            <ToastContainer position="top-center" autoClose={3000} className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    );
}
