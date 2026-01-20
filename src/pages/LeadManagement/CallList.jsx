import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import RangeDatePicker from '../../components/form/RangeDatePicker';
import API from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import { isOwner, isManager } from '../../utils/roleHelpers';
import Select from '../../components/form/Select';
import { CloseIcon, DownloadIcon, FileIcon, ChevronDownIcon, ChevronUpIcon } from '../../icons';
import { countries, callListStatusOptions } from '../../data/DataSets';

const SearchIcon = ({ className }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
    </svg>
);

export default function CallList() {
    // Get initial date range (current month)
    const getInitialMonthRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return [firstDay, lastDay];
    };

    const { user, selectedBrand } = useContext(AuthContext);
    const [callLists, setCallLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { isOpen: isAddOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
    const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
    const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();
    const [showFilters, setShowFilters] = useState(false);

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
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [bulkAssignedTo, setBulkAssignedTo] = useState('');
    const [bulkSource, setBulkSource] = useState('');
    const [bulkPurpose, setBulkPurpose] = useState('');

    // Pagination & Filtering states
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

    const [dateRange, setDateRange] = useState(getInitialMonthRange());
    const [stats, setStats] = useState([]);
    const [creatorFilter, setCreatorFilter] = useState('');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Derived stats for summary
    const { summaryData, completionRate } = useMemo(() => {
        const result = {};
        // Initialize all defined statuses with 0
        callListStatusOptions.forEach(opt => {
            result[opt.value.toLowerCase()] = { count: 0, color: opt.color, label: opt.label };
        });

        let total = 0;
        let pending = 0;

        // Add counts from backend
        stats.forEach(stat => {
            const statusKey = (stat._id || 'neutral').toLowerCase();
            total += stat.count;
            if (statusKey === 'neutral') pending = stat.count;

            if (result[statusKey]) {
                result[statusKey].count = stat.count;
            } else {
                result[statusKey] = {
                    count: stat.count,
                    color: '#A3A3A3',
                    label: stat._id || 'Neutral'
                };
            }
        });

        const rate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;
        return { summaryData: Object.values(result), completionRate: rate };
    }, [stats]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);



    const canDelete = isOwner(user) || isManager(user);

    useEffect(() => {
        fetchCallLists();
        if (isOwner(user) || isManager(user)) {
            fetchUsers();
        }
    }, [user, page, itemsPerPage, debouncedSearch, dateRange, creatorFilter, assigneeFilter, statusFilter, sortBy, sortOrder]);

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedBrand) {
                params.append('brandId', selectedBrand._id);
            }
            const response = await axios.get(`${API}/users/dropdown?${params.toString()}`, { withCredentials: true });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchCallLists = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page,
                limit: itemsPerPage,
                sortBy,
                sortOrder
            });
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('status', statusFilter);
            if (dateRange && dateRange.length > 0) {
                if (dateRange[0]) {
                    const start = new Date(dateRange[0]);
                    start.setHours(0, 0, 0, 0);
                    params.append('startDate', start.toISOString());

                    if (!dateRange[1]) {
                        const end = new Date(dateRange[0]);
                        end.setHours(23, 59, 59, 999);
                        params.append('endDate', end.toISOString());
                    }
                }
                if (dateRange[1]) {
                    const end = new Date(dateRange[1]);
                    end.setHours(23, 59, 59, 999);
                    params.append('endDate', end.toISOString());
                }
            }
            if (creatorFilter) params.append('creator', creatorFilter);
            if (assigneeFilter) params.append('assignedTo', assigneeFilter);

            const response = await axios.get(`${API}/call-lists?${params.toString()}`, { withCredentials: true });
            setCallLists(response.data.callLists);
            setPagination(response.data.pagination);
            setStats(response.data.stats || []);
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
            fetchCallLists();
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
            fetchCallLists();
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
            fetchCallLists();
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

    const toggleSelect = (id, index, event) => {
        if (event?.shiftKey && lastSelectedIndex !== null && index !== undefined) {
            // Shift-click range selection
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const rangeIds = filteredData.slice(start, end + 1).map(item => item._id);

            // Add all items in range to selection
            const newSelectedIds = [...new Set([...selectedIds, ...rangeIds])];
            setSelectedIds(newSelectedIds);
        } else {
            // Normal toggle
            if (selectedIds.includes(id)) {
                setSelectedIds(selectedIds.filter(i => i !== id));
            } else {
                setSelectedIds([...selectedIds, id]);
            }
        }

        // Update last selected index
        if (index !== undefined) {
            setLastSelectedIndex(index);
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

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.error("Please select entries to delete.");
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} entries? This action cannot be undone.`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            await axios.post(
                `${API}/call-lists/bulk-delete`,
                { ids: selectedIds },
                { withCredentials: true }
            );

            toast.success("Bulk delete successful!");
            setSelectedIds([]); // Clear selection
            fetchCallLists();
        } catch (error) {
            console.error("Error in bulk delete:", error);
            toast.error(error.response?.data?.message || "Failed to perform bulk delete.");
        } finally {
            setIsSubmitting(false);
        }
    };


    const filteredData = callLists; // Search and filtering now handled by server

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const renderActions = (entry) => (
        <div className="flex items-center gap-1.5">
            <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(entry)}
                className="h-8 px-2.5 text-xs border-gray-200 dark:border-gray-700 hover:text-brand-500"
            >
                Edit
            </Button>
            {canDelete && (
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-red-500 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={() => handleDeleteClick(entry)}
                >
                    <CloseIcon className="size-4" />
                </Button>
            )}
        </div>
    );

    const renderStatus = (entry) => {
        const currentStatus = callListStatusOptions.find(opt => opt.value === entry.status) || callListStatusOptions[0];

        return (
            <div className="flex flex-col gap-1.5 min-w-[130px]">
                <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider w-fit text-white shadow-sm"
                    style={{ backgroundColor: currentStatus.color || '#A3A3A3' }}
                >
                    {currentStatus.label}
                </span>
                <div className="relative group">
                    <select
                        className="w-full text-[11px] font-medium bg-gray-50/50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 outline-none focus:border-brand-500 appearance-none cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800"
                        value={entry.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(entry._id, e.target.value)}
                    >
                        {callListStatusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDownIcon className="size-3" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="">
            <PageMeta
                title="Cold Call list | DreamCRM"
                description="Manage customer contact information"
            />
            <PageBreadcrumb pageTitle="Manage Your Cold Call Lists Here" />

            <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="mb-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cold Call List</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-400">
                                    Total: {pagination.totalItems} records
                                </p>
                                {selectedIds.length > 0 && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-700 font-light">|</span>
                                        <p className="text-xs text-brand-500 font-medium">
                                            {selectedIds.length} selected
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <div className="w-full sm:w-52 group">
                                <RangeDatePicker
                                    value={dateRange}
                                    onChange={(dates) => {
                                        setDateRange(dates);
                                        setPage(1);
                                    }}
                                    placeholder="Filter dates"
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-brand-500 text-gray-600 dark:text-gray-400"
                                startIcon={showFilters ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                            >
                                {showFilters ? "Filters" : "Filters"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={openImportModal}
                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-brand-500 text-gray-600 dark:text-gray-400"
                                startIcon={<FileIcon className="size-4" />}
                            >
                                Import
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={openAddModal}
                                className="h-[34px] px-4 font-bold tracking-tight shadow-md hover:shadow-lg transition-all"
                            >
                                Add New Entry
                            </Button>
                        </div>
                    </div>

                    {/* Integrated Efficiency Stats - Premium Style */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            Efficiency:
                        </span>
                        {summaryData.map((stat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 group transition-all">
                                <span
                                    className="size-1.5 rounded-full shadow-sm group-hover:scale-125 transition-transform"
                                    style={{ backgroundColor: stat.color || '#A3A3A3' }}
                                />
                                <span className="text-[11px] font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors uppercase tracking-tight">{stat.label}:</span>
                                <span className="text-xs font-bold text-gray-800 dark:text-white">{stat.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {showFilters && (
                    <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 mb-6">
                        <div className="relative">
                            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 ml-0.5">Quick Search</Label>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Name, phone, source..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 focus:border-brand-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 ml-0.5">Assignee</Label>
                            <Select
                                options={[
                                    { value: "", label: "All Assignees" },
                                    { value: "unassigned", label: "Unassigned" },
                                    ...users.map(u => ({ value: u._id, label: u.fullName }))
                                ]}
                                value={assigneeFilter}
                                onChange={(val) => {
                                    setAssigneeFilter(val);
                                    setPage(1);
                                }}
                                placeholder="Filter by assignee"
                            />
                        </div>

                        <div>
                            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 ml-0.5">Status</Label>
                            <Select
                                options={[
                                    { value: "", label: "All Statuses" },
                                    ...callListStatusOptions.map(opt => ({ value: opt.value, label: opt.label }))
                                ]}
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(val);
                                    setPage(1);
                                }}
                                placeholder="Filter by status"
                            />
                        </div>

                        <div className="flex items-end pb-0.5">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDateRange(getInitialMonthRange());
                                    setCreatorFilter('');
                                    setAssigneeFilter('');
                                    setStatusFilter('');
                                    setSearch('');
                                    setPage(1);
                                }}
                                className="w-full h-10 border-gray-200 hover:bg-white dark:border-gray-700 dark:hover:bg-gray-800 rounded-lg text-xs font-medium text-gray-500"
                                startIcon={<CloseIcon className="size-4" />}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Bulk Action Bar integrated inside the same card */}
                    {selectedIds.length > 0 && (
                        <div className="p-4 bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-8 bg-brand-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-brand-500/20">
                                    {selectedIds.length}
                                </div>
                                <div className="text-left">
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
                                        className="w-full sm:w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Purpose</label>
                                    <input
                                        type="text"
                                        value={bulkPurpose}
                                        onChange={(e) => setBulkPurpose(e.target.value)}
                                        placeholder="e.g. Sales"
                                        className="w-full sm:w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Assign To</label>
                                    <div className="relative sm:min-w-[150px]">
                                        <select
                                            value={bulkAssignedTo}
                                            onChange={(e) => setBulkAssignedTo(e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 outline-none shadow-sm transition-all"
                                        >
                                            <option value="">Select User</option>
                                            <option value="unassign">Unassign</option>
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
                                    className="whitespace-nowrap shadow-lg shadow-brand-500/20 h-[34px] px-4 text-xs"
                                >
                                    Update
                                </Button>
                                {canDelete && (
                                    <Button
                                        variant="outline"
                                        loading={isSubmitting}
                                        onClick={handleBulkDelete}
                                        className="whitespace-nowrap h-[34px] px-4 text-xs text-red-500 border-red-200 hover:bg-red-50"
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

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
                                                        className="size-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                                                        checked={selectedIds.includes(entry._id)}
                                                        onChange={(e) => toggleSelect(entry._id, index, e)}
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

                            <div className="hidden md:block overflow-x-auto">
                                <Table className="min-w-[1100px]">
                                    <TableHeader className="border-gray-200 dark:border-gray-700 border-y bg-gray-50/50 dark:bg-gray-800/20">
                                        <TableRow>
                                            {(isOwner(user) || isManager(user)) && (
                                                <TableCell isHeader className="py-3 px-4">
                                                    <input
                                                        type="checkbox"
                                                        className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer transition-all"
                                                        checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest w-16">#</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[220px]">Contact Details</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[120px]">Assigned To</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[140px]">Source / Purpose</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[200px]">Remarks</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[140px]">Status</TableCell>
                                            <TableCell isHeader className="py-3 px-4 font-bold text-gray-700 text-start text-[11px] dark:text-gray-300 uppercase tracking-widest min-w-[100px]">Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredData.map((entry, index) => (
                                            <TableRow key={entry._id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] even:bg-gray-50/40 even:dark:bg-white/[0.01]">
                                                {(isOwner(user) || isManager(user)) && (
                                                    <TableCell className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer transition-all"
                                                            checked={selectedIds.includes(entry._id)}
                                                            onChange={(e) => toggleSelect(entry._id, index, e)}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="py-3 px-4 text-gray-400 text-xs font-bold leading-none">
                                                    {(page - 1) * itemsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{formatDate(entry.createdAt)}</div>
                                                        <div className="text-gray-900 text-sm font-bold dark:text-white leading-tight">{entry.name || 'Unnamed'}</div>
                                                        {entry.phoneNumber && (
                                                            <a href={`tel:${entry.phoneNumber}`} className="text-brand-600 hover:text-brand-700 hover:underline font-semibold text-xs flex items-center gap-1.5 mt-0.5">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                                {entry.phoneNumber}
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs font-medium">{entry.assignedTo?.fullName || 'Unassigned'}</TableCell>
                                                <TableCell className="py-3 px-4 text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        {entry.source && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Src:</span>
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium">{entry.source}</span>
                                                            </div>
                                                        )}
                                                        {entry.purpose && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Purp:</span>
                                                                <span className="text-gray-700 dark:text-gray-300 font-medium">{entry.purpose}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-xs text-gray-600 dark:text-gray-400 italic">
                                                    <div className="max-w-[200px] truncate" title={entry.remarks}>
                                                        {entry.remarks || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    {renderStatus(entry)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    {renderActions(entry)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {
                                pagination.totalPages > 1 && (
                                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                                        <p className="text-sm text-gray-500">
                                            Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span> results
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setPage(1);
                                                }}
                                                className="h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 focus:border-brand-500 focus:ring focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 outline-none transition-all"
                                            >
                                                <option value={50}>50 per page</option>
                                                <option value={100}>100 per page</option>
                                                <option value={500}>500 per page</option>
                                            </select>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={page === 1}
                                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(pagination.totalPages)].map((_, i) => {
                                                        const pageNum = i + 1;
                                                        // Show only first, last, and pages around current page
                                                        if (
                                                            pageNum === 1 ||
                                                            pageNum === pagination.totalPages ||
                                                            (pageNum >= page - 1 && pageNum <= page + 1)
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    onClick={() => setPage(pageNum)}
                                                                    className={`size-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                                        ? 'bg-brand-500 text-white'
                                                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                                                        }`}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        } else if (
                                                            pageNum === page - 2 ||
                                                            pageNum === page + 2
                                                        ) {
                                                            return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={page === pagination.totalPages}
                                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        </div >
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No call list entries found.</p>
                            <Button variant="outline" onClick={openAddModal}>
                                Add your first entry
                            </Button>
                        </div>
                    )
                    }
                </div>
            </div>

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
