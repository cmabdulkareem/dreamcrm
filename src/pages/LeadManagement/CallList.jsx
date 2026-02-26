import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { CloseIcon, DownloadIcon, FileIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashBinIcon } from '../../icons';
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

    // Tooltip states for remark history
    const [hoveredRemarkRow, setHoveredRemarkRow] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const tooltipRef = useRef(null);

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
    const [skippedEntries, setSkippedEntries] = useState([]);
    const [importSummary, setImportSummary] = useState(null);

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

    // Derived stats for summary with grouping
    const {
        totalCalled,
        pendingCount,
        breakdown,
        completionRate
    } = useMemo(() => {
        // Define simplified categories for breakdown
        const groupedStats = {
            'interested': { count: 0, color: '#10B981', label: 'Interested' }, // Emerald
            'not-interested': { count: 0, color: '#EF4444', label: 'Not Interested' }, // Red
            'failed': { count: 0, color: '#64748B', label: 'Unreachable / Failed' }, // Slate
            'converted': { count: 0, color: '#0EA5E9', label: 'Converted to Lead' } // Sky
        };

        const statusMapping = {
            // Interested
            'interested-wants-details': 'interested',
            'very-interested': 'interested',
            'callback-requested': 'interested',

            // Not Interested
            'neutral': 'not-interested',
            'not-interested': 'not-interested',

            // Failed
            'no-answer': 'failed',
            'busy': 'failed',
            'switched-off': 'failed',
            'invalid-number': 'failed',
            'call-dropped': 'failed',

            // Converted
            'copied-to-lead': 'converted'
        };

        let total = 0;
        let pCount = 0;

        // stats is an array of { _id: 'status-string', count: number }
        stats.forEach(stat => {
            const rawStatus = (stat._id || 'pending').toLowerCase();
            const count = stat.count;
            total += count;

            if (rawStatus === 'pending') {
                pCount = count;
            } else {
                // If not pending, it's "Called"
                const groupKey = statusMapping[rawStatus];
                if (groupKey && groupedStats[groupKey]) {
                    groupedStats[groupKey].count += count;
                }
            }
        });

        const totalCalledCount = total - pCount;
        const rate = total > 0 ? Math.round((totalCalledCount / total) * 100) : 0;

        return {
            totalCalled: totalCalledCount,
            pendingCount: pCount,
            breakdown: Object.values(groupedStats),
            completionRate: rate
        };
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


    // Calculate optimal tooltip position (Ported from RecentOrders.jsx)
    const calculateTooltipPosition = (rect) => {
        const tooltipWidth = 384; // w-96 = 384px
        const padding = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const headerHeight = 85;

        // Center-align horizontally
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Adjust if tooltip would go off right edge
        if (left + tooltipWidth > viewportWidth - padding) {
            left = viewportWidth - tooltipWidth - padding;
        }

        // Adjust if tooltip would go off left edge
        if (left < padding) {
            left = padding;
        }

        // Recalculate arrowLeft relative to the tooltip's final left position
        let arrowLeft = (rect.left + rect.width / 2) - left;
        // Clamp arrow to tooltip bounds
        arrowLeft = Math.max(24, Math.min(tooltipWidth - 24, arrowLeft));

        // Calculate vertical position
        const spaceAbove = rect.top - headerHeight - padding;
        const spaceBelow = viewportHeight - rect.bottom - padding;

        const estimatedTooltipHeight = 350;

        let top = 0;
        let transform = "";
        let maxHeight = 0;

        const shouldShowAbove = spaceAbove > estimatedTooltipHeight || spaceAbove > spaceBelow;

        if (shouldShowAbove) {
            // Show ABOVE
            top = rect.top;
            transform = "translateY(-100%) translateY(-6px)";
            maxHeight = Math.min(spaceAbove, 480);
        } else {
            // Show BELOW
            top = rect.bottom;
            transform = "translateY(6px)";
            maxHeight = Math.min(spaceBelow, 480);
        }

        return { top, left, arrowLeft, transform, maxHeight, isAbove: shouldShowAbove };
    };

    // Handle tooltip hover with delay
    const handleTooltipEnter = (e, entry) => {
        if (entry.remarks && entry.remarks.length > 0) {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const position = calculateTooltipPosition(rect);

            setTooltipPosition(position);
            setHoveredRemarkRow(entry._id);

            hoverTimeoutRef.current = setTimeout(() => {
                setShowTooltip(true);
            }, 150);
        }
    };

    const handleTooltipLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredRemarkRow(null);
            setShowTooltip(false);
        }, 300); // Increased delay for ergonomics
    };

    // Handle window resize/scroll to update tooltip position
    useEffect(() => {
        if (!hoveredRemarkRow || !showTooltip) return;

        const handleUpdatePosition = (e) => {
            // Ignore scroll events originating from WITHIN the tooltip itself
            if (e && e.type === 'scroll' && tooltipRef.current && tooltipRef.current.contains(e.target)) {
                return;
            }

            // Try desktop first, then mobile
            const element = document.querySelector(`[data-tooltip-id="desktop-${hoveredRemarkRow}"]`) ||
                document.querySelector(`[data-tooltip-id="mobile-${hoveredRemarkRow}"]`);

            if (element) {
                const rect = element.getBoundingClientRect();
                const pos = calculateTooltipPosition(rect);

                // Preserve the initial direction to prevent flipping during scroll
                if (tooltipPosition) {
                    const wasAbove = tooltipPosition.transform.includes('-100%');
                    if (wasAbove) {
                        pos.top = rect.top;
                        pos.transform = "translateY(-100%) translateY(-6px)";
                        pos.maxHeight = Math.min(rect.top - 85 - 20, 480);
                    } else {
                        pos.top = rect.bottom;
                        pos.transform = "translateY(6px)";
                        pos.maxHeight = Math.min(window.innerHeight - rect.bottom - 20, 480);
                    }
                }

                setTooltipPosition(pos);
            }
        };

        window.addEventListener('resize', handleUpdatePosition);
        window.addEventListener('scroll', handleUpdatePosition, true);

        return () => {
            window.removeEventListener('resize', handleUpdatePosition);
            window.removeEventListener('scroll', handleUpdatePosition, true);
        };
    }, [hoveredRemarkRow, showTooltip]);

    const resetForm = () => {
        setName('');
        setPhoneNumber('');
        setSocialMediaId('');
        setRemarks('');
        setSource('');
        setPurpose('');
        setAssignedTo('');
        setSelectedEntry(null);
        setSkippedEntries([]);
        setImportSummary(null);
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
        setRemarks(''); // Start with empty remark for new update
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
            const response = await axios.patch(
                `${API}/call-lists/${id}/status`,
                { status: newStatus },
                { withCredentials: true }
            );

            toast.success("Status updated successfully!");
            // Use the updated data from response for immediate impact on tooltip
            setCallLists(prev => prev.map(c => c._id === id ? response.data.callList : c));
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
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const dateObj = new Date(dateString);
        return dateObj.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const getLatestRemark = (remarks) => {
        if (!remarks || remarks.length === 0) return '-';
        if (typeof remarks === 'string') return remarks;
        if (Array.isArray(remarks)) {
            const last = remarks[remarks.length - 1];
            return typeof last === 'string' ? last : (last.remark || '-');
        }
        return '-';
    };

    const renderActions = (entry) => (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            <button
                onClick={() => handleEdit(entry)}
                className="p-2 text-gray-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm hover:shadow"
                title="Edit Entry"
            >
                <PencilIcon className="size-4" />
            </button>
            {canDelete && (
                <button
                    onClick={() => handleDeleteClick(entry)}
                    className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 shadow-sm hover:shadow"
                    title="Delete Entry"
                >
                    <TrashBinIcon className="size-4" />
                </button>
            )}
        </div>
    );

    const renderStatus = (entry) => {
        const currentStatus = callListStatusOptions.find(opt => opt.value === entry.status) || callListStatusOptions[0];

        return (
            <div className="relative group/status flex items-center">
                <div className="relative flex items-center">
                    <span
                        className="px-2.5 py-1.5 rounded-full text-[12px] font-bold tracking-tight flex items-center gap-1.5 cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 dark:hover:ring-offset-gray-900 shadow-sm active:scale-95"
                        style={{
                            backgroundColor: `${currentStatus.color}15`,
                            color: currentStatus.color,
                            border: `1px solid ${currentStatus.color}40`
                        }}
                    >
                        <span className="size-1.5 rounded-full shadow-sm" style={{ backgroundColor: currentStatus.color }}></span>
                        {currentStatus.label}
                        <ChevronDownIcon className="size-2.5 opacity-60" />
                    </span>
                    <select
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        value={entry.status || 'pending'}
                        onChange={(e) => handleStatusUpdate(entry._id, e.target.value)}
                    >
                        {callListStatusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
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
                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-slate-400 text-gray-600 dark:text-gray-400"
                                startIcon={showFilters ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                            >
                                {showFilters ? "Filters" : "Filters"}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={openImportModal}
                                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-slate-400 text-gray-600 dark:text-gray-400"
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

                    {/* Integrated Efficiency Stats - Custom Grouped Layout */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 text-xs">
                        {/* Called Group */}
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-white/10 shadow-sm">
                            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">
                                Total Called:
                            </span>
                            <span className="font-black text-green-600 dark:text-brand-400 text-base tabular-nums leading-none">
                                {totalCalled}
                            </span>
                        </div>

                        {/* Breakdown inside brackets */}
                        <div className="flex items-center gap-4 px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 shadow-inner">
                            {breakdown.map((stat, idx) => (
                                <div key={idx} className="flex items-center gap-2 pr-3 last:pr-0 border-r last:border-0 border-gray-200 dark:border-gray-700/50">
                                    <span
                                        className="size-1.5 rounded-full"
                                        style={{ backgroundColor: stat.color }}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[8px]">
                                            {stat.label}
                                        </span>
                                        <span className="font-black text-gray-800 dark:text-gray-100 text-[13px] tabular-nums leading-none">
                                            {stat.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pending Group */}
                        <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                            <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">
                                Pending:
                            </span>
                            <span className="font-black text-yellow-600 dark:text-gray-300 text-base tabular-nums leading-none">
                                {pendingCount}
                            </span>
                        </div>
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
                        <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center size-8 bg-gray-800 dark:bg-gray-700 text-white text-sm font-bold rounded-lg shadow-lg">
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
                                    <div key={entry._id} className="group bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                {(isOwner(user) || isManager(user)) && (
                                                    <input
                                                        type="checkbox"
                                                        className="size-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer shadow-sm"
                                                        checked={selectedIds.includes(entry._id)}
                                                        onChange={(e) => toggleSelect(entry._id, index, e)}
                                                    />
                                                )}
                                                <div
                                                    className="cursor-default"
                                                    data-tooltip-id={`mobile-${entry._id}`}
                                                    onMouseEnter={(e) => handleTooltipEnter(e, entry)}
                                                    onMouseLeave={handleTooltipLeave}
                                                >
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Entry #{index + 1}</span>
                                                    <h3 className="font-bold text-[15px] text-gray-800 dark:text-white leading-snug tracking-tight">{entry.name || 'Unnamed'}</h3>
                                                </div>
                                            </div>
                                            {renderStatus(entry)}
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {entry.phoneNumber && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400 bg-gray-50 dark:bg-white/[0.03] p-1.5 rounded-lg">
                                                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    </span>
                                                    <a
                                                        href={`tel:${entry.phoneNumber}`}
                                                        className="text-gray-900 dark:text-white hover:text-brand-600 font-bold text-sm tracking-tight underline decoration-gray-200 underline-offset-4"
                                                    >
                                                        {entry.phoneNumber}
                                                    </a>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 border-y border-gray-50 dark:border-gray-800/50 py-3">
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Assigned To</span>
                                                    <div className="font-bold text-[13px] text-gray-700 dark:text-gray-300">{entry.assignedTo?.fullName || 'Unassigned'}</div>
                                                </div>
                                                {(entry.source || entry.purpose) && (
                                                    <div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Source / Purpose</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {entry.source && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 border border-sky-100 dark:border-sky-800/40 truncate max-w-[120px]" title={entry.source}>
                                                                    {entry.source}
                                                                </span>
                                                            )}
                                                            {entry.purpose && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40 truncate max-w-[120px]" title={entry.purpose}>
                                                                    {entry.purpose}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {getLatestRemark(entry.remarks) !== '-' && (
                                                <div className="mt-2 p-3 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                                    {(() => {
                                                        const txt = getLatestRemark(entry.remarks);
                                                        return txt.charAt(0).toUpperCase() + txt.slice(1);
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 mt-4 border-t border-gray-50 dark:border-gray-800/50">
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/10 py-1 px-2.5 rounded-lg uppercase tracking-wider">{formatDate(entry.createdAt)}</span>
                                            <div className="flex items-center gap-1.5">
                                                {renderActions(entry)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block overflow-auto max-h-[calc(100vh-320px)] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
                                <Table className="min-w-full border-collapse">
                                    <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                                        <TableRow>
                                            {(isOwner(user) || isManager(user)) && (
                                                <TableCell isHeader className="py-4 px-4 bg-inherit w-12 sticky left-0 z-30 shadow-[1px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[1px_0_4px_-2px_rgba(255,255,255,0.1)]">
                                                    <input
                                                        type="checkbox"
                                                        className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer transition-all"
                                                        checked={selectedIds.length === filteredData.length && filteredData.length > 0}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell isHeader className="py-4 px-3 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest w-12 bg-inherit sticky left-12 z-30 shadow-[1px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[1px_0_4px_-2px_rgba(255,255,255,0.1)]">#</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[220px] bg-inherit sticky left-[88px] z-30 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_6px_-2px_rgba(255,255,255,0.15)]">Contact Details</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[130px] bg-inherit border-l border-gray-100 dark:border-gray-800/50">Assigned To</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[140px] bg-inherit border-l border-gray-100 dark:border-gray-800/50">Source / Purpose</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[260px] bg-inherit border-l border-gray-100 dark:border-gray-800/50">Remarks</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[160px] bg-inherit border-l border-gray-100 dark:border-gray-800/50">Status</TableCell>
                                            <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest min-w-[100px] bg-inherit border-l border-gray-100 dark:border-gray-800/50">Actions</TableCell>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white dark:bg-transparent">
                                        {filteredData.map((entry, index) => (
                                            <TableRow key={entry._id} className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                                {(isOwner(user) || isManager(user)) && (
                                                    <TableCell className="py-4 px-4 sticky left-0 z-10 bg-inherit shadow-[1px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[1px_0_4px_-2px_rgba(255,255,255,0.1)]">
                                                        <input
                                                            type="checkbox"
                                                            className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer transition-all"
                                                            checked={selectedIds.includes(entry._id)}
                                                            onChange={(e) => toggleSelect(entry._id, index, e)}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="py-4 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-bold tabular-nums sticky left-12 z-10 bg-inherit shadow-[1px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[1px_0_4px_-2px_rgba(255,255,255,0.1)]">
                                                    {(page - 1) * itemsPerPage + index + 1}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 sticky left-[88px] z-10 bg-inherit shadow-[2px_0_6px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_6px_-2px_rgba(255,255,255,0.15)]">
                                                    <div className="flex flex-col gap-0.5">
                                                        <p
                                                            className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 leading-tight tracking-tight transition-colors cursor-default"
                                                            data-tooltip-id={`desktop-${entry._id}`}
                                                            onMouseEnter={(e) => handleTooltipEnter(e, entry)}
                                                            onMouseLeave={handleTooltipLeave}
                                                        >
                                                            {entry.name || 'Unnamed Entry'}
                                                        </p>
                                                        {entry.phoneNumber && (
                                                            <div className="flex items-center gap-1.5">
                                                                <a href={`tel:${entry.phoneNumber}`} className="text-blue-500 hover:underline text-[12px] font-medium">
                                                                    {entry.phoneNumber}
                                                                </a>
                                                                <span className="text-gray-300 dark:text-gray-600 font-light">•</span>
                                                                <span className="text-gray-400 text-xs">{formatDate(entry.createdAt)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                                                    <span className="text-gray-700 dark:text-gray-300 text-theme-sm font-medium">
                                                        {entry.assignedTo?.fullName || 'Unassigned'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                                                    <div className="flex flex-col gap-1.5">
                                                        {entry.source && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 border border-sky-100 dark:border-sky-800/40 max-w-[130px] truncate" title={entry.source}>
                                                                {entry.source}
                                                            </span>
                                                        )}
                                                        {entry.purpose && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40 max-w-[130px] truncate" title={entry.purpose}>
                                                                {entry.purpose}
                                                            </span>
                                                        )}
                                                        {!entry.source && !entry.purpose && (
                                                            <span className="text-gray-400 text-xs">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                                                    <div className="text-theme-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed max-w-[280px] break-words">
                                                        {(() => {
                                                            const txt = getLatestRemark(entry.remarks);
                                                            return txt === '-' ? '-' : (txt.charAt(0).toUpperCase() + txt.slice(1));
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                                                    {renderStatus(entry)}
                                                </TableCell>
                                                <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                                                    <div className="flex justify-center min-w-[80px]">
                                                        {renderActions(entry)}
                                                    </div>
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
                        </div>
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
                        <Label htmlFor="remarks">Add New Remark</Label>
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
                        <Label htmlFor="editRemarks">Add New Remark</Label>
                        <p className="text-[10px] text-gray-400 mb-1.5 font-medium italic">* Previous remarks are preserved in the call lifecycle history.</p>
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
                    {importSummary ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Import Summary
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-500">{importSummary.importedCount || 0}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Imported</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-orange-500">{importSummary.skippedCount || 0}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-bold">Skipped</div>
                                    </div>
                                </div>
                            </div>

                            {skippedEntries.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Skipped Entries Reasons:</h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-[10px]"
                                            onClick={() => {
                                                const headers = ["Name", "Phone Number", "Reason"];
                                                const csvContent = "data:text/csv;charset=utf-8," +
                                                    [headers, ...skippedEntries.map(s => [
                                                        s.entry?.name || "",
                                                        s.entry?.phoneNumber || "",
                                                        s.reason || "Unknown"
                                                    ])].map(e => e.join(",")).join("\n");
                                                const encodedUri = encodeURI(csvContent);
                                                const link = document.createElement("a");
                                                link.setAttribute("href", encodedUri);
                                                link.setAttribute("download", "skipped_entries_report.csv");
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            Download Skip Report
                                        </Button>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                                        {skippedEntries.map((s, idx) => (
                                            <div key={idx} className="p-3 text-xs">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <div className="font-bold text-gray-700 dark:text-gray-200">
                                                            {s.entry?.name || "Unnamed"} {s.entry?.phoneNumber ? `(${s.entry.phoneNumber})` : ""}
                                                        </div>
                                                        <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {s.reason}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button variant="primary" onClick={() => {
                                    closeImportModal();
                                    setImportSummary(null);
                                    setSkippedEntries([]);
                                }}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    ) : (
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
                                        const headers = ["Name", "Mobile Number", "Source", "Purpose", "Remarks"];
                                        const sampleData = [
                                            ["John Doe", "9876543210", "LinkedIn", "Sales", "Very interested"],
                                            ["Jane Smith", "9123456789", "Referral", "Inquiry", "Follow up next week"]
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
                                        <li>Fields: Name, Mobile number, Source, Purpose, Remarks (Name and number are optional).</li>
                                        <li>At least one identifying or data field (Name, Phone, Social Media ID, Source, or Purpose) must be present.</li>
                                        <li>Remarks can be left empty.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
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
                                const phoneKey = findKey(headers, ["Phone Number", "Phone", "Mobile Number", "Mobile", "Contact"]);
                                const socialKey = findKey(headers, ["Social Media ID", "Social Media", "Social", "Instagram", "Facebook"]);
                                const sourceKey = findKey(headers, ["Source", "Src"]);
                                const purposeKey = findKey(headers, ["Purpose", "Purp"]);
                                const remarksKey = findKey(headers, ["Remarks", "Note", "Comment"]);

                                const parsedEntries = results.data.map(row => {
                                    return {
                                        name: nameKey ? row[nameKey] : "",
                                        phoneNumber: phoneKey ? row[phoneKey] : "",
                                        socialMediaId: socialKey ? row[socialKey] : "",
                                        source: sourceKey ? row[sourceKey] : "",
                                        purpose: purposeKey ? row[purposeKey] : "",
                                        remarks: remarksKey ? row[remarksKey] : ""
                                    };
                                });

                                const validEntries = parsedEntries.filter(l => l.name || l.phoneNumber || l.socialMediaId || l.source || l.purpose);

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
                                    setImportSummary({
                                        importedCount: response.data.importedCount,
                                        skippedCount: response.data.skippedCount
                                    });
                                    setSkippedEntries(response.data.skippedEntries || []);
                                    fetchCallLists(); // Refresh table
                                    // Don't close modal immediately if there are skipped entries
                                    if (!response.data.skippedEntries || response.data.skippedEntries.length === 0) {
                                        closeImportModal();
                                    }
                                } catch (error) {
                                    console.error("Import failed:", error);
                                    if (error.response?.data?.skippedEntries) {
                                        setImportSummary({
                                            importedCount: 0,
                                            skippedCount: error.response.data.skippedCount
                                        });
                                        setSkippedEntries(error.response.data.skippedEntries);
                                        toast.warning("Some entries were skipped.");
                                    } else {
                                        toast.error(error.response?.data?.message || "Import failed. Please try again.");
                                    }
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

            {/* Lifecycle Tooltip */}
            {showTooltip && hoveredRemarkRow && createPortal(
                <div
                    ref={tooltipRef}
                    className="fixed z-[99999] w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col"
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                        transform: tooltipPosition.transform,
                        maxHeight: tooltipPosition.maxHeight
                    }}
                    onMouseEnter={() => {
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                        }
                    }}
                    onMouseLeave={handleTooltipLeave}
                >
                    {/* Arrow Pointer */}
                    <div
                        className="absolute w-3 h-3 bg-white dark:bg-gray-900 border-r border-b border-gray-100 dark:border-gray-800 z-10"
                        style={{
                            left: tooltipPosition.arrowLeft,
                            bottom: tooltipPosition.transform.includes('-100%') ? '-6px' : 'auto',
                            top: tooltipPosition.transform.includes('-100%') ? 'auto' : '-6px',
                            transform: `translateX(-50%) rotate(${tooltipPosition.transform.includes('-100%') ? '45deg' : '225deg'})`,
                        }}
                    />

                    <div className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between relative z-20">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                                <svg className="size-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Call Lifecycle</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Remark History</p>
                            </div>
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 bg-white dark:bg-white/5 px-2 py-1 rounded-md border border-gray-100 dark:border-white/5 shadow-sm">
                            {(callLists || []).find(c => c._id === hoveredRemarkRow)?.remarks?.length || 0} Events
                        </div>
                    </div>

                    <div className="p-5 overflow-y-auto custom-scrollbar flex-1 min-h-0 overscroll-contain">
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gradient-to-b before:from-brand-500/30 before:via-gray-100 dark:before:via-white/10 before:to-transparent">
                            {(() => {
                                const rawRemarks = (callLists || []).find(c => c._id === hoveredRemarkRow)?.remarks || [];
                                const normalizedRemarks = Array.isArray(rawRemarks) ? [...rawRemarks].reverse() : [{
                                    remark: rawRemarks,
                                    updatedOn: (callLists || []).find(c => c._id === hoveredRemarkRow)?.createdAt
                                }];

                                return normalizedRemarks.map((rem, idx) => {
                                    const text = rem.remark || '';
                                    const isEntryCreated = text.toLowerCase() === 'entry created';
                                    const isStatusChange = text.toLowerCase().includes('status updated to');
                                    const isAssignment = text.toLowerCase().startsWith('assigned to');

                                    let eventColor = 'text-gray-400';
                                    let dotColor = 'bg-gray-400';
                                    let bgColor = 'bg-white border-gray-100 dark:bg-white/[0.02] dark:border-white/5 text-gray-600 dark:text-gray-400';

                                    if (isEntryCreated) {
                                        eventColor = 'text-emerald-600 dark:text-emerald-400';
                                        dotColor = 'bg-emerald-500';
                                        bgColor = 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20 text-gray-700 dark:text-emerald-300';
                                    } else if (isStatusChange) {
                                        eventColor = 'text-blue-600 dark:text-blue-400';
                                        dotColor = 'bg-blue-500';
                                        bgColor = 'bg-blue-50/30 border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/20 text-gray-700 dark:text-blue-300';
                                    } else if (isAssignment) {
                                        eventColor = 'text-violet-600 dark:text-violet-400';
                                        dotColor = 'bg-violet-500';
                                        bgColor = 'bg-violet-50/30 border-violet-100 dark:bg-violet-500/5 dark:border-violet-500/20 text-gray-700 dark:text-violet-300';
                                    } else if (idx === 0) {
                                        eventColor = 'text-brand-600 dark:text-brand-400';
                                        dotColor = 'bg-brand-500';
                                        bgColor = 'bg-brand-50/40 border-brand-100 dark:bg-brand-500/10 dark:border-brand-500/20 text-gray-800 dark:text-gray-200 font-semibold';
                                    }

                                    return (
                                        <div key={rem._id || idx} className="relative pl-8">
                                            <div className={`absolute left-0 top-1.5 size-[22px] rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center z-10 shadow-sm ${idx === 0 ? 'bg-brand-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                <div className={`size-1.5 rounded-full ${idx === 0 ? 'bg-white' : dotColor}`} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${eventColor}`}>
                                                        <span className={`size-1.5 rounded-full ${dotColor}`} />
                                                        {(() => {
                                                            if (isEntryCreated) return 'Entry Created';
                                                            if (isStatusChange) return 'Status Change';
                                                            if (isAssignment) return 'Assignment';
                                                            return rem.status?.replace('-', ' ') || 'Remark Added';
                                                        })()}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 py-0.5 px-2 rounded-full border border-gray-100 dark:border-white/5">
                                                        {formatDateTime(rem.updatedOn || ((callLists || []).find(c => c._id === hoveredRemarkRow))?.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-xl border leading-relaxed text-[12px] shadow-sm ${bgColor}`}>
                                                    {typeof rem === 'string' ? rem : (rem.remark ? (rem.remark.charAt(0).toUpperCase() + rem.remark.slice(1)) : `Status updated to ${rem.status?.replace('-', ' ')}`)}
                                                </div>
                                                {rem.updatedBy && (
                                                    <div className="flex items-center gap-1.5 ml-1">
                                                        <div className="size-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                            {rem.updatedBy.fullName?.charAt(0)}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-medium">Logged by {rem.updatedBy.fullName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            })()}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ToastContainer position="top-center" autoClose={3000} className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    )
}
