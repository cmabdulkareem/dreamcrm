import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import { labService } from '../../services/labService';
import { labLifecycleService } from '../../services/labLifecycleService';
import { PencilIcon, TrashBinIcon, AlertIcon, UserIcon } from '../../icons';
import { XMarkIcon, CheckIcon, PlusIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
    History,
    Clock,
    Plus,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    ArrowRightLeft,
    Power
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { isManager, isAnyManager, isAdmin as checkAdmin, hasRole } from '../../utils/roleHelpers';
import { useNotifications } from '../../context/NotificationContext';
import axios from 'axios';
import API from '../../config/api';

const ItemTypes = {
    PC: 'pc'
};

const STATUS_CONFIG = {
    available: { label: 'Available', color: 'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400', dot: 'bg-gray-300', iconColor: 'text-gray-300' },
    'in-use': { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', iconColor: 'text-green-500' },
    assigned: { label: 'Assigned', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400', dot: 'bg-yellow-500', iconColor: 'text-yellow-500' },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', dot: 'bg-red-500', iconColor: 'text-red-500' },
    maintenance: { label: 'Maintenance', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/10 dark:text-orange-400', dot: 'bg-orange-500', iconColor: 'text-orange-500' },
    offline: { label: 'Offline', color: 'bg-red-100 text-red-700 dark:bg-red-900/10 dark:text-red-400', dot: 'bg-red-500', iconColor: 'text-red-500' },
};

const MonitorIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="5" y="6" width="14" height="8" rx="1" fill="currentColor" fillOpacity="0.1" />
    </svg>
);

const emptyPC = { pcNumber: '', label: '', status: 'available', specs: '', location: '', row: 'A', position: 0, notes: '', softwares: [], brands: [] };
const emptySchedule = { studentName: '', date: '', timeSlot: 'Early AM', purpose: '', notes: '' };

const TIME_SLOTS = ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"];
const emptyComplaintForm = { pcId: '', title: '', description: '', priority: 'medium' };

const QUEUE_STATUS_CONFIG = {
    waiting: { label: 'In Queue', bg: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
    assigned: { label: 'Assigned', bg: 'bg-brand-100 text-brand-700', icon: '🔵' },
    active: { label: 'Active', bg: 'bg-green-100 text-green-700', icon: '🟢' },
    completed: { label: 'Completed', bg: 'bg-gray-100 text-gray-700', icon: '⚫' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100 text-red-700', icon: '🔴' },
    overdue: { label: 'Overdue', bg: 'bg-red-200 text-red-800', icon: '🚨' }
};

// [startHour, startMin, endHour, endMin]
const SLOT_TIMES = {
    "Early AM": [9, 0, 10, 30],
    "Late AM": [10, 30, 12, 0],
    "Midday": [12, 0, 13, 30],
    "Early PM": [14, 0, 15, 30],
    "Late PM": [15, 30, 17, 0],
};

const getEffectiveStatus = (pc, todaySlots, activeSessions = []) => {
    // Priority 1: Active/Assigned Sessions from Lifecycle
    const session = activeSessions.find(s => s.pcId === pc._id && (s.status === 'active' || s.status === 'assigned'));
    if (session) return session.status === 'active' ? 'in-use' : 'assigned';

    // Priority 2: Traditional Slot Bookings
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const bookedNow = todaySlots.some(s => {
        const range = SLOT_TIMES[s.timeSlot];
        if (!range) return false;
        const [sh, sm, eh, em] = range;
        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        return nowMins >= start && nowMins < end;
    });
    if (bookedNow) return 'assigned';

    // Priority 3: Stored PC status (maintenance/offline)
    const storedStatus = pc.status || 'available';
    return storedStatus === 'in-use' ? 'available' : storedStatus;
};

const PCSeat = ({ pc, cfg, todaySlots, activeSessions = [], inUse, onAssign, onEdit, onDelete, onMovePC, onComplaint, isExpanded, onToggleExpand, hoveredPCId, setHoveredPCId }) => {
    const [showMobileActions, setShowMobileActions] = useState(false);
    const actionRef = useRef(null);
    const popoverRef = useRef(null);
    const isHovered = hoveredPCId === pc._id;

    // Close mobile actions and popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionRef.current && !actionRef.current.contains(event.target)) {
                setShowMobileActions(false);
            }
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                if (isExpanded) onToggleExpand(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isExpanded, onToggleExpand]);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.PC,
        item: { id: pc._id, row: pc.row, position: pc.position },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [pc]);

    const hoverTimeout = useRef(null);

    const handleMouseEnter = () => {
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
        setHoveredPCId(pc._id);
    };

    const handleMouseLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => {
            setHoveredPCId(current => current === pc._id ? null : current);
            hoverTimeout.current = null;
        }, 200);
    };

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.PC,
        drop: (item) => {
            if (item.id !== pc._id) {
                onMovePC(item.id, pc.row, pc.position);
            }
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
        }),
    }), [pc, onMovePC]);

    const seatId = `${pc.row}${pc.position + 1}`;
    const primaryLabel = pc.pcNumber || seatId;

    return (
        <div
            ref={(node) => drag(drop(node))}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`group relative flex flex-col items-center cursor-move transition-all duration-300 
                    ${isDragging ? 'opacity-30 scale-90 grayscale' : 'opacity-100'}
                    ${isHovered || showMobileActions || isExpanded ? 'z-[1000]' : 'z-10'}
                    ${isOver ? 'scale-110 rotate-1' : ''}
                `}
            onClick={(e) => {
                e.stopPropagation();
                if (window.matchMedia("(max-width: 768px)").matches && !showMobileActions) {
                    setShowMobileActions(true);
                } else {
                    onAssign(pc);
                }
            }}
        >
            <div
                className={`w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2.5 shadow-sm transition-all duration-200
                        ${todaySlots.length < 3 ? 'bg-green-50/50 border-green-400 dark:bg-green-900/30 dark:border-green-800' : inUse ? 'bg-blue-50/50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                        ${isOver ? 'border-blue-950 shadow-blue-200 dark:shadow-blue-900/20 ring-4 ring-blue-950/10' : ''}
                        ${isExpanded || isHovered ? 'ring-2 ring-blue-950 border-blue-950 shadow-lg shadow-blue-950/10' : ''}
                        hover:shadow-lg hover:scale-105 cursor-pointer relative 
                    `}
            >
                {/* Status Badge on Card */}
                <div className="absolute -top-2 -right-2 z-10 scale-75 origin-top-right">
                    {todaySlots.length >= 5 ? (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-lg border border-red-600">Full</span>
                    ) : todaySlots.length >= 3 ? (
                        <span className="bg-yellow-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest shadow-lg border border-yellow-600">Limited</span>
                    ) : null}
                </div>

                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight truncate max-w-full px-1">{primaryLabel}</span>
                <div className={`relative ${cfg.iconColor}`}>
                    <MonitorIcon className="w-10 h-10" />
                </div>
                <div className="flex gap-1 items-center">
                    {TIME_SLOTS.map(slot => {
                        const match = todaySlots.find(s => s.timeSlot === slot);
                        const booked = !!match;
                        return (
                            <div
                                key={slot}
                                className={`w-2 h-2 rounded-full border-2 transition-colors ${booked
                                    ? cfg.dot
                                    : 'bg-transparent border-gray-200 dark:border-gray-700'
                                    }`}
                            />
                        );
                    })}
                </div>

                {/* Premium SaaS Tooltip / Popover - Forced to top-full (below unit) to prevent clipping */}
                {(isHovered || isExpanded) && (
                    <div
                        ref={popoverRef}
                        className={`absolute top-full mt-3 w-72 bg-[#1E1E2F] backdrop-blur-xl text-white p-0 rounded-xl shadow-2xl z-[510] border border-white/10 overflow-hidden ring-1 ring-white/5 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200
                            ${pc.position === 0 ? 'left-[-1.5rem] translate-x-0' : 'left-1/2 -translate-x-1/2'}
                        `}
                        onMouseEnter={handleMouseEnter}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 space-y-4">
                            <div>
                                <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                                    {primaryLabel}
                                    <span className={`w-2 h-2 rounded-full ${pc.status === 'available' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                                </h4>
                                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">Standard Specification</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                    <span>Today's Roster</span>
                                    <span>{todaySlots.length} / 5</span>
                                </div>


                                <div className="max-h-40 overflow-y-auto no-scrollbar space-y-2">
                                    {todaySlots.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <span className="text-blue-400 font-bold text-[10px]">{s.timeSlot}</span>
                                            <span className="text-white font-medium text-xs">{s.studentName}</span>
                                        </div>
                                    ))}
                                    {todaySlots.length === 0 && (
                                        <div className="text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-500 text-[10px] font-bold uppercase">No records today</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(pc); onToggleExpand(null); }} className="p-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-all flex items-center justify-center">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(pc._id, pc.row, pc.position); onToggleExpand(null); }} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center">
                                    <TrashBinIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Arrow Pointer - Forced to top pointing up */}
                        <div className={`absolute bottom-full -mb-1 rotate-180 border-8 border-transparent border-b-[#1E1E2F] 
                            ${pc.position === 0 ? 'left-10' : 'left-1/2 -translate-x-1/2'}
                        `} />
                    </div>
                )
                }
            </div >

            {showMobileActions && (
                <div
                    ref={actionRef}
                    className="absolute -bottom-10 md:-bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 md:gap-1.5 bg-white dark:bg-gray-800 shadow-2xl md:shadow-xl border border-gray-100 dark:border-gray-700 p-2 md:p-1.5 rounded-2xl md:rounded-xl z-[520] transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={(e) => { e.stopPropagation(); onComplaint(pc); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500 rounded-xl md:rounded-lg transition-colors" title="Raise Complaint">
                        <AlertIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(pc); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl md:rounded-lg text-gray-600 dark:text-gray-300 transition-colors" title="Edit PC">
                        <PencilIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(pc._id, pc.row, pc.position); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 rounded-xl md:rounded-lg transition-colors" title="Delete PC">
                        <TrashBinIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                </div>
            )}
        </div >
    );
};

// ─── Queue Panel ─────────────────────────────
const QueuePanel = ({
    queue,
    onAdd,
    onRemove,
    onAssign,
    onStudentClick,
    loading,
    filters,
    setFilters,
    show,
    onToggle,
    viewMode,
    setViewMode,
    historyData,
    historyLoading
}) => {
    if (!show) return (
        <button
            onClick={onToggle}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-white dark:bg-gray-800 shadow-lg border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-xl p-2 hover:bg-blue-50 transition-colors"
        >
            <PlusIcon className="w-5 h-5 text-blue-950 rotate-45" />
        </button>
    );

    const activeCount = viewMode === 'active' ? queue.length : historyData.length;
    const isLoading = viewMode === 'active' ? loading : historyLoading;
    const displayData = viewMode === 'active' ? queue : historyData;

    return (
        <div className="w-full lg:w-80 shrink-0 border-b lg:border-r lg:border-b-0 border-gray-100 dark:border-gray-800 h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/10">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="p-1.5 bg-blue-950 text-white rounded-lg text-xs">
                        {activeCount}
                    </span>
                    {viewMode === 'active' ? 'Student Queue' : 'Queue History'}
                </h3>
                <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 p-1">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50">
                <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800/50 rounded-xl gap-1">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'active'
                            ? 'bg-white dark:bg-gray-700 text-blue-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Waitlist
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'history'
                            ? 'bg-white dark:bg-gray-700 text-blue-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            <div className={`p-4 space-y-3 ${viewMode === 'history' ? 'hidden' : ''}`}>
                <div className="flex gap-2">
                    <Button size="sm" className="flex-1 !bg-blue-950 hover:!bg-blue-900" onClick={onAdd}>
                        <PlusIcon className="w-4 h-4 mr-1.5" /> Add Student
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-950"
                        value={filters?.software || ""}
                        onChange={(e) => setFilters(f => ({ ...f, software: e.target.value }))}
                    >
                        <option value="">All Software</option>
                        <option value="Photoshop">Photoshop</option>
                        <option value="Illustrator">Illustrator</option>
                        <option value="Premiere">Premiere</option>
                    </select>
                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-950"
                        value={filters?.slot || ""}
                        onChange={(e) => setFilters(f => ({ ...f, slot: e.target.value }))}
                    >
                        <option value="">All Slots</option>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-3 custom-scrollbar">
                {isLoading ? (
                    <div className="py-10 text-center text-gray-400 text-xs animate-pulse">Syncing data...</div>
                ) : displayData.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-gray-400 text-xs">{viewMode === 'active' ? 'Queue is empty' : 'No history found'}</p>
                    </div>
                ) : (
                    displayData.map((item, idx) => (
                        <div
                            key={item._id}
                            onClick={() => onStudentClick && onStudentClick(item)}
                            className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-theme-xs hover:border-blue-950/30 transition-all group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-0">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight truncate px-1 rounded hover:bg-blue-50 transition-colors">
                                        {item.studentId?.fullName || item.studentName || "Anonymous"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {viewMode === 'active' ? (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRemove(item._id); }}
                                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remove from queue"
                                            >
                                                <TrashBinIcon className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAssign(item); }}
                                                className="p-1 text-gray-300 hover:text-blue-950 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Complete/Quick Assign"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {item.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${viewMode === 'active' ? 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                    {item.preferredSlot}
                                </span>
                                {viewMode === 'history' && (
                                    <span className="text-[9px] font-bold text-gray-400">
                                        {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const EmptySlotPlaceholder = ({ slot, onInitialize, onRemove, onMovePC }) => {
    const seatId = `${slot.row}${slot.position + 1}`;

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.PC,
        drop: (item) => {
            onMovePC(item.id, slot.row, slot.position);
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver({ shallow: true }),
        }),
    }), [slot, onMovePC]);

    return (
        <div ref={drop} className="group relative flex flex-col items-center">
            <button
                onClick={() => onInitialize(slot)}
                className={`w-20 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95
                    ${isOver ? 'border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg' : 'border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-300 hover:text-blue-950 hover:border-blue-950'}
                `}
            >
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <span className="text-[11px] font-black opacity-80 group-hover:opacity-100 transition-opacity text-gray-900 dark:text-gray-100">{seatId}</span>
                    <PlusIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-gray-700 dark:text-gray-200" />
                    <span className="text-[9px] font-black uppercase tracking-tight opacity-80 group-hover:opacity-100 text-gray-800 dark:text-gray-200">Add Unit</span>
                </div>
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(slot._id); }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all text-xs font-bold shadow-md z-20"
            >
                ×
            </button>
        </div>
    );
};

const RowContainer = ({ row, pcsInRow, emptySlotsInRow, onMovePC, onQuickAdd, onEditRow, onDeleteRow, renderPC, renderSlot, hasActiveTooltip, expandedPCId }) => {
    const rowName = row.name;

    const pcPositions = new Set(pcsInRow.map(p => p.position));
    const filteredSlots = emptySlotsInRow.filter(s => !pcPositions.has(s.position));

    const allItems = [
        ...pcsInRow.map(p => ({ ...p, type: 'pc' })),
        ...filteredSlots.map(s => ({ ...s, type: 'slot' }))
    ].sort((a, b) => a.position - b.position);

    return (
        <div
            className={`relative flex items-center gap-2 pl-0 pr-1 py-1 transition-all duration-300 min-h-[110px] 
            ${pcsInRow.some(p => p._id === expandedPCId) ? 'z-[980]' : hasActiveTooltip ? 'z-[950]' : 'hover:z-[900]'} 
            group/row`}
        >
            <div className="sticky left-0 w-14 shrink-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50 py-3 -ml-0 pl-0 group/rowheader">
                <span className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{rowName}</span>
                <div className="w-8 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2" />

                <div className="flex gap-1 mt-3 opacity-0 group-hover/rowheader:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEditRow(row)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-950 transition-colors"
                    >
                        <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                        onClick={() => onDeleteRow(row._id)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-red-400 hover:text-red-500 transition-colors"
                    >
                        <TrashBinIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-11 gap-x-2 gap-y-10 min-w-max pr-1">
                    {allItems.map(item => (
                        item.type === 'pc' ? renderPC(item) : renderSlot(item)
                    ))}

                    <button
                        onClick={() => onQuickAdd(rowName)}
                        className="w-20 h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900 transition-all group shrink-0"
                        title={`Add Slot to Section ${rowName}`}
                    >
                        <PlusIcon className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                </div>
            </div>
        </div>
    );
};

function ArrangementContent() {
    const { user, selectedBrand } = useAuth();
    const { socket } = useNotifications();
    const canManageLab = isAnyManager(user) || hasRole(user, 'IT Support');
    const brandId = selectedBrand?._id || selectedBrand?.id;
    const canManageWorkstations = isManager(user, brandId) || hasRole(user, 'IT Support', brandId);

    const [pcs, setPCs] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showPCModal, setShowPCModal] = useState(false);
    const [pcForm, setPCForm] = useState(emptyPC);
    const [editingPC, setEditingPC] = useState(null);
    const [selectedPC, setSelectedPC] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleForm, setScheduleForm] = useState(emptySchedule);
    const [isQuickAdd, setIsQuickAdd] = useState(false);
    const [hoveredPCId, setHoveredPCId] = useState(null);
    const [expandedPCId, setExpandedPCId] = useState(null);

    const [showRowModal, setShowRowModal] = useState(false);
    const [rowForm, setRowForm] = useState({ name: '', brands: [] });
    const [editingRow, setEditingRow] = useState(null);

    const [emptySlots, setEmptySlots] = useState([]);
    const [rows, setRows] = useState([]);
    const [slotForms, setSlotForms] = useState({});

    // New Lab-specific state
    const [labs, setLabs] = useState([]);
    const [selectedLabId, setSelectedLabId] = useState(null);
    const [showLabModal, setShowLabModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingPC, setIsSubmittingPC] = useState(false);
    const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
    const [labForm, setLabForm] = useState({ name: '', description: '', location: '', brands: [] });
    const [editingLab, setEditingLab] = useState(null);
    const [labLoading, setLabLoading] = useState(false);

    // Lab Lifecycle State
    const [queue, setQueue] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [showQueuePanel, setShowQueuePanel] = useState(true);
    const [isQueueLoading, setIsQueueLoading] = useState(false);
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [queueFilters, setQueueFilters] = useState({ software: '', slot: '' });
    const [queueViewMode, setQueueViewMode] = useState('active'); // 'active' or 'history'
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [queueForm, setQueueForm] = useState({ studentId: '', preferredSoftware: '', preferredSlot: 'Early AM' });
    const [activeWaitlistSearch, setActiveWaitlistSearch] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showQueueHistoryModal, setShowQueueHistoryModal] = useState(false);
    const [queueHistory, setQueueHistory] = useState([]);
    const [isQueueHistoryLoading, setIsQueueHistoryLoading] = useState(false);
    const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [complaintForm, setComplaintForm] = useState(emptyComplaintForm);
    const [savingComplaint, setSavingComplaint] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchLabs(true);
    }, []);

    useEffect(() => {
        if (selectedLabId) {
            fetchAll(true);
        } else {
            setPCs([]);
            setRows([]);
            setEmptySlots([]);
        }
    }, [selectedLabId, today]);

    useEffect(() => {
        if (showHistoryModal && selectedLabId) {
            fetchHistory();
        }
    }, [showHistoryModal, selectedLabId, selectedStudentForHistory]);

    // Real-time Updates
    useEffect(() => {
        if (!socket || !selectedLabId) return;

        const handleLabUpdate = (payload) => {
            if (payload.labId === selectedLabId) {
                console.log("Real-time update received:", payload.type);
                fetchAll();
                if (showHistoryModal) fetchHistory();
                if (queueViewMode === 'history') fetchQueueHistory();
            }
        };

        socket.on('lab:update', handleLabUpdate);
        return () => socket.off('lab:update', handleLabUpdate);
    }, [socket, selectedLabId, showHistoryModal]);

    const fetchLabs = async (isInitial = false) => {
        if (isInitial) setLabLoading(true);
        try {
            const data = await labService.getLabs();
            setLabs(data);
            if (data.length > 0 && !selectedLabId) {
                setSelectedLabId(data[0]._id);
            }
        } finally {
            setLabLoading(false);
        }
    };

    const fetchQueueHistory = async () => {
        if (!selectedLabId) return;
        setIsQueueHistoryLoading(true);
        try {
            const data = await labLifecycleService.getQueue({
                labId: selectedLabId,
                status: "completed,cancelled"
            });
            setQueueHistory(data || []);
        } catch (e) {
            toast.error("Failed to load finished students");
        } finally {
            setIsQueueHistoryLoading(false);
        }
    };

    const normalizeRow = (r) => r?.replace(/Row\s+/i, '').trim().toUpperCase() || 'A';

    const fetchAll = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const [pcData, schedData, rowData, queueData, sessionData] = await Promise.all([
                labService.getPCs(selectedLabId),
                labService.getSchedules({ date: today, labId: selectedLabId }),
                labService.getRows(selectedLabId),
                labLifecycleService.getQueue({ labId: selectedLabId }),
                labLifecycleService.getActiveSessions(selectedLabId)
            ]);
            setPCs(pcData.map(p => ({ ...p, row: normalizeRow(p.row) })));
            setSchedules(schedData);
            setRows(rowData);
            setQueue(queueData || []);
            setActiveSessions(sessionData || []);

            // Inflate emptySlots from rows for rendering
            const inflatedSlots = [];
            rowData.forEach(row => {
                row.emptySlots.forEach(pos => {
                    inflatedSlots.push({
                        _id: `${row._id}_${pos}`,
                        row: row.name,
                        position: pos
                    });
                });
            });
            setEmptySlots(inflatedSlots);

            // Auto fetch history if in history mode
            if (queueViewMode === 'history') {
                fetchQueueHistory();
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isInitial) setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
            const params = { labId: selectedLabId };
            if (selectedStudentForHistory) {
                if (selectedStudentForHistory.studentId?._id || selectedStudentForHistory.studentId) {
                    params.studentId = selectedStudentForHistory.studentId?._id || selectedStudentForHistory.studentId;
                } else {
                    params.studentName = selectedStudentForHistory.studentName;
                }
            }
            const logs = await labLifecycleService.getHistory(params);
            setHistoryLogs(logs || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setIsHistoryLoading(false);
        }
    };


    useEffect(() => {
        if (queueViewMode === 'history') {
            fetchQueueHistory();
        }
    }, [queueViewMode, selectedLabId]);

    // Student search for Queue Modal
    const [studentSearch, setStudentSearch] = useState("");
    const [studentResults, setStudentResults] = useState([]);
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (studentSearch.length < 2) {
                setStudentResults([]);
                return;
            }

            const currentLab = labs.find(l => l._id === selectedLabId);
            const labBrands = currentLab?.brands || [];

            setIsSearchingStudents(true);
            try {
                const response = await axios.get(`${API}/students/all`, {
                    params: {
                        search: studentSearch,
                        brands: labBrands.join(',')
                    },
                    withCredentials: true
                });
                setStudentResults((response.data.students || []).slice(0, 10));
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearchingStudents(false);
            }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [studentSearch, selectedLabId, labs]);

    const handleSavePC = async (e) => {
        e.preventDefault();
        setIsSubmittingPC(true);
        const normalizedRow = normalizeRow(pcForm.row);

        // Split software string into array before saving
        const softwareArray = typeof pcForm.softwares === 'string'
            ? pcForm.softwares.split(',').map(s => s.trim()).filter(Boolean)
            : pcForm.softwares;

        const finalForm = { ...pcForm, row: normalizedRow, softwares: softwareArray, labId: selectedLabId };
        try {
            if (editingPC) {
                await labService.updatePC(editingPC._id, finalForm);
            } else {
                await labService.addPC(finalForm);
            }
            setShowPCModal(false);
            fetchAll();
        } catch (e) {
            toast.error(e.message || "Action failed");
        } finally {
            setIsSubmittingPC(false);
        }
    };

    const handleDeletePC = async (id, row, position) => {
        if (!window.confirm('Remove this workstation?')) return;
        try {
            await labService.deletePC(id);
            const exists = emptySlots.find(s => s.row === row && s.position === position);
            if (!exists) {
                await labService.addSlot({ row, position });
            }
            fetchAll();
        } catch (e) {
            toast.error("Failed to delete PC");
        }
    };

    const handleMovePC = async (sourceId, targetRow, targetPos = null) => {
        const normalizedTarget = normalizeRow(targetRow);
        const sourcePC = pcs.find(p => p._id === sourceId);
        if (!sourcePC) return;

        try {
            const slotAtOldPos = emptySlots.find(s => s.row === sourcePC.row && s.position === sourcePC.position);
            if (!slotAtOldPos) {
                await labService.addSlot({ row: sourcePC.row, position: sourcePC.position });
            }

            if (targetPos !== null) {
                const targetPC = pcs.find(p => p.row === normalizedTarget && p.position === targetPos);

                if (targetPC) {
                    const oldSourceCoords = { row: sourcePC.row, position: sourcePC.position };
                    const newSourceCoords = { row: targetPC.row, position: targetPC.position };

                    setPCs(prev => prev.map(p => {
                        if (p._id === sourceId) return { ...p, ...newSourceCoords };
                        if (p._id === targetPC._id) return { ...p, ...oldSourceCoords };
                        return p;
                    }));

                    // Sequential to avoid race condition on Laboratory document
                    await labService.updatePC(sourceId, newSourceCoords);
                    await labService.updatePC(targetPC._id, oldSourceCoords);
                } else {
                    const newCoords = { row: normalizedTarget, position: targetPos };
                    setPCs(prev => prev.map(p => p._id === sourceId ? { ...p, ...newCoords } : p));
                    await labService.updatePC(sourceId, newCoords);
                }
            }
            fetchAll();
        } catch (e) {
            console.error(e);
            toast.error("Failed to complete move");
            fetchAll();
        }
    };

    const handleSaveSchedule = async (e) => {
        e.preventDefault();
        try {
            await labService.addSchedule({ ...scheduleForm, pc: selectedPC._id });
            setScheduleForm(emptySchedule);
            fetchAll();
        } catch (e) { }
    };

    const handleDeleteSchedule = async (id) => {
        try {
            await labService.deleteSchedule(id);
            fetchAll();
        } catch (e) { }
    };

    const handleOpenComplaint = (pc) => {
        setComplaintForm({ ...emptyComplaintForm, pcId: pc._id });
        setShowComplaintModal(true);
    };

    const handleSaveComplaint = async (e) => {
        e.preventDefault();
        if (!complaintForm.pcId || !complaintForm.title?.trim()) return;
        setSavingComplaint(true);
        try {
            await labService.addComplaint(complaintForm);
            toast.success("Complaint filed successfully");
            setShowComplaintModal(false);
            setComplaintForm(emptyComplaintForm);
        } catch (err) {
            toast.error(err.message || "Failed to file complaint");
        } finally {
            setSavingComplaint(false);
        }
    };

    const openManageModal = (pc) => {
        // Build slotForms from existing bookings for this PC today
        const existing = pcSchedules(pc._id);
        const forms = {};
        TIME_SLOTS.forEach(slot => {
            // Find in traditional schedules or active lifecycle sessions
            const match = existing.find(s => s.timeSlot === slot);
            const sessionMatch = activeSessions.find(s =>
                s.pcId === pc._id &&
                s.slot === slot &&
                (s.status === 'active' || s.status === 'assigned')
            );

            const effectiveMatch = match || sessionMatch;

            forms[slot] = {
                studentName: effectiveMatch?.studentName || effectiveMatch?.studentId?.fullName || '',
                studentId: effectiveMatch?.studentId?._id || effectiveMatch?.studentId || effectiveMatch?.student || null,
                purpose: effectiveMatch?.purpose || effectiveMatch?.software || '',
                existingId: match?._id || null, // Only traditional schedules have existingId for update/delete
                sessionId: sessionMatch?._id || null, // Track lifecycle session if present
                queueId: match?.queueItem || match?.queueId || sessionMatch?.queueId || null,
                toDelete: false,
            };
        });
        setSlotForms(forms);
        setSelectedPC(pc);
        setShowScheduleModal(true);
    };

    const handleUpdateSlots = async (e) => {
        e.preventDefault();
        setIsSubmittingSchedule(true);
        try {
            // Sequential execution to avoid race conditions on the Laboratory document
            for (const slot of TIME_SLOTS) {
                const f = slotForms[slot];
                if (!f) continue;

                if (f.toDelete) {
                    if (f.existingId) {
                        await labService.deleteSchedule(f.existingId);
                    } else if (f.sessionId) {
                        // For lifecycle sessions (like manual entries from queue), we need a way to delete them and re-queue.
                        // I'll assume labLifecycleService has or needs a way to handle this.
                        // But wait, the backend deleteSchedule handles re-queuing! 
                        // If it's a session but NO schedule, we might need a separate endpoint or just handle it here.
                        // However, manually entered students FROM QUEUE usually get a Schedule when assigned.
                        // If they ONLY have a sessionId, it means they might have been assigned differently.
                        // Let's check how they were assigned.

                        // If they were assigned from waitlist using our search, it adds a schedule.
                        // So they should have an existingId.
                        // If they don't, it might be an 'active' session without a persistent schedule object?
                        // Let's add support for session deletion if no schedule exists.
                        await labLifecycleService.endSession(f.sessionId, { status: 'cancelled', reQueue: true });
                    }
                } else if (!f.toDelete && f.studentName.trim()) {
                    if (!f.existingId) {
                        // New booking - assignment (from queue or direct handled by backend)
                        await labService.addSchedule({
                            pc: selectedPC._id,
                            student: f.studentId,
                            studentName: f.studentName.trim(),
                            purpose: f.purpose,
                            date: today,
                            timeSlot: slot,
                            queueId: f.queueId // Pass queueId to backend if assigning from waitlist
                        });
                    } else {
                        // Update existing booking
                        await labService.updateSchedule(f.existingId, {
                            student: f.studentId, // Included studentId
                            studentName: f.studentName.trim(),
                            purpose: f.purpose
                        });
                    }
                }
            }

            setShowScheduleModal(false);
            fetchAll();
        } catch (e) {
            toast.error(e.message || 'Failed to update slots');
        } finally {
            setIsSubmittingSchedule(false);
        }
    };

    const getNextRowName = () => {
        const existingRows = new Set([
            ...pcs.map(p => normalizeRow(p.row)),
            ...emptySlots.map(s => normalizeRow(s.row)),
            ...rows.map(r => normalizeRow(r.name))
        ]);

        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(65 + i);
            if (!existingRows.has(char)) return char;
        }
        return 'Z';
    };

    const handleQuickAddSlot = async (rowName) => {
        const normalizedRowName = normalizeRow(rowName);
        const rowObj = rows.find(r => normalizeRow(r.name) === normalizedRowName);
        if (!rowObj) {
            toast.error("Section not found");
            return;
        }

        const rowPCs = pcs.filter(p => p.row === normalizedRowName);
        const rowSlots = emptySlots.filter(s => s.row === normalizedRowName);
        const allPositions = new Set([...rowPCs.map(p => p.position), ...rowSlots.map(s => s.position)]);

        let firstHole = 0;
        while (allPositions.has(firstHole)) firstHole++;

        try {
            await labService.addEmptySlot({ rowId: rowObj._id, position: firstHole });
            fetchAll();
        } catch (e) {
            toast.error("Failed to add persistent slot");
        }
    };

    const handleRemoveSlot = async (id) => {
        try {
            await labService.removeEmptySlot(id);
            fetchAll();
        } catch (e) {
            toast.error("Failed to remove slot");
        }
    }

    const handleInitializeSlot = (slot) => {
        const seatId = `${slot.row}${slot.position + 1}`;
        setPCForm({ ...emptyPC, pcNumber: seatId, row: slot.row, position: slot.position });
        setEditingPC(null);
        setIsQuickAdd(true);
        setShowPCModal(true);
    };

    const handleSaveRow = async (e) => {
        e.preventDefault();
        try {
            if (editingRow) {
                await labService.updateRow(editingRow._id, rowForm);
            } else {
                await labService.addRow({ ...rowForm, labId: selectedLabId });
            }
            setShowRowModal(false);
            fetchAll();
        } catch (e) {
            toast.error(e.message || "Failed to save section");
        }
    };


    const handleSaveLab = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingLab) {
                await labService.updateLab(editingLab._id, labForm);
            } else {
                const newLab = await labService.addLab(labForm);
                if (newLab?._id) {
                    setSelectedLabId(newLab._id);
                }
            }
            setShowLabModal(false);
            fetchLabs();
        } catch (e) {
            toast.error(e.message || "Failed to save laboratory");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onEditLab = (lab) => {
        setLabForm({
            name: lab.name,
            description: lab.description || '',
            location: lab.location || '',
            brands: (lab.brands || []).map(b => (b._id || b).toString())
        });
        setEditingLab(lab);
        setShowLabModal(true);
    };

    const handleDeleteLab = async (id) => {
        if (!window.confirm("Delete this entire laboratory? This will permanently remove all associated units and schedules.")) return;
        try {
            await labService.deleteLab(id);
            if (selectedLabId === id) setSelectedLabId(null);
            fetchLabs();
        } catch (e) {
            toast.error("Failed to delete laboratory");
        }
    };

    const handleAddNewRowButtonClick = () => {
        const nextRow = getNextRowName();
        setRowForm({ name: nextRow });
        setEditingRow(null);
        setShowRowModal(true);
    };

    const onEditRow = (row) => {
        setRowForm({ name: row.name });
        setEditingRow(row);
        setShowRowModal(true);
    };

    const handleDeleteRow = async (id) => {
        if (!window.confirm("Delete this section and all associated units?")) return;
        try {
            await labService.deleteRow(id);
            fetchAll();
        } catch (e) {
            toast.error("Failed to delete section");
        }
    };

    const handleAddLabButtonClick = () => {
        setLabForm({
            name: '',
            description: '',
            location: '',
            brands: selectedBrand ? [selectedBrand._id || selectedBrand.id] : []
        });
        setEditingLab(null);
        setShowLabModal(true);
    };


    const handleAddToQueue = async (e) => {
        e.preventDefault();
        if (!queueForm.studentId && !studentSearch.trim()) return;
        setIsQueueLoading(true);
        try {
            await labLifecycleService.addToQueue({
                ...queueForm,
                studentName: studentSearch.trim(),
                labId: selectedLabId
            });
            setShowQueueModal(false);
            setStudentSearch("");
            setStudentResults([]);
            setQueueForm({ studentId: '', preferredSoftware: '', preferredSlot: 'Early AM' });
            fetchAll();
        } catch (e) {
            toast.error(e.message || "Failed to add to queue");
        } finally {
            setIsQueueLoading(false);
        }
    };

    const handleOpenSessionModal = (pc) => {
        openManageModal(pc);
    };

    const handleSessionAction = async (action, data = {}) => {
        setIsSessionsLoading(true);
        try {
            // Minimal shell for compatibility or later use
            console.log(`Action ${action} triggered with data:`, data);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setIsSessionsLoading(false);
        }
    };

    const processQueueAssignment = async (queueItem, pcId, slot) => {
        setIsSessionsLoading(true);
        try {
            await labLifecycleService.assignSession({
                studentId: queueItem.studentId._id,
                labId: selectedLabId,
                pcId,
                slot,
                software: queueItem.preferredSoftware,
                queueId: queueItem._id
            });
            fetchAll();
        } catch (e) {
            toast.error(e.message || "Failed to assign student");
        } finally {
            setIsSessionsLoading(true);
        }
    };

    const handleRemoveFromQueue = async (id) => {
        if (!window.confirm("Remove student from queue?")) return;
        try {
            await labLifecycleService.removeFromQueue(id);
            fetchAll();
        } catch (e) {
            toast.error("Failed to remove from queue");
        }
    };

    const handleCompleteQueueEntry = async (item) => {
        console.log("Completing Queue Entry:", { item, activeSessions });
        // Find if this student has an active or assigned session
        const studentId = (item.studentId?._id || item.studentId)?.toString();
        const studentName = item.studentName || item.studentId?.fullName;

        const activeSession = activeSessions.find(s => {
            const sStudentId = (s.studentId?._id || s.studentId)?.toString();
            const sStudentName = s.studentName || s.studentId?.fullName;

            if (studentId && sStudentId) {
                return sStudentId === studentId && (s.status === 'active' || s.status === 'assigned');
            }

            // Fallback to name matching if IDs are missing (for anonymous/External users)
            if (!studentId && !sStudentId && studentName && sStudentName) {
                return sStudentName.toLowerCase() === studentName.toLowerCase() && (s.status === 'active' || s.status === 'assigned');
            }

            return false;
        });

        if (activeSession) {
            if (window.confirm(`Student ${studentName} has an active session on Station ${activeSession.pcNumber || '?'}. End that session?`)) {
                try {
                    await labLifecycleService.endSession(activeSession._id, { status: 'completed' });
                    toast.success("Active session ended");
                    await fetchAll();
                } catch (e) {
                    toast.error("Failed to end active session");
                    return; // Don't proceed to completion if ending failed
                }
            } else {
                return; // User cancelled
            }
        }

        // Mark the queue entry as completed
        if (window.confirm(`Mark ${studentName} as Completed? This student will be moved to history.`)) {
            try {
                await labLifecycleService.removeFromQueue(item._id, { status: 'completed' });
                toast.success("Student marked as completed");
                fetchAll();
            } catch (e) {
                toast.error("Failed to complete queue entry");
            }
        }
    };

    const rowsMap = pcs.reduce((acc, pc) => {
        const r = normalizeRow(pc.row);
        if (!acc[r]) acc[r] = [];
        acc[r].push(pc);
        return acc;
    }, {});

    const slotsMap = emptySlots.reduce((acc, slot) => {
        const r = normalizeRow(slot.row);
        if (!acc[r]) acc[r] = [];
        acc[r].push(slot);
        return acc;
    }, {});

    const visibleRowNames = [
        ...new Set([
            ...Object.keys(rowsMap),
            ...rows.map(r => normalizeRow(r.name)),
            ...Object.keys(slotsMap)
        ])
    ].sort();

    const pcSchedules = (pcId) => schedules.filter(s => s.pc?._id === pcId || s.pc === pcId);

    return (
        <div className="">
            <PageMeta title="Lab Scheduler | CDC Insights" />
            <PageBreadcrumb
                pageTitle="Lab Arrangement"
                items={[
                    { name: 'Home', path: '/' },
                    { name: 'Compute Lab', path: '/compute-lab' },
                    { name: 'Arrangement' }
                ]}
            />

            <div className="space-y-6 relative z-20">
                <ComponentCard
                    bodyClassName="p-0"
                    title={
                        <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl overflow-x-auto no-scrollbar max-w-full border border-gray-200/50 dark:border-gray-800/50">
                            {labs.map(lab => (
                                <div
                                    key={lab._id}
                                    className={`group relative flex items-center transition-all duration-300 rounded-xl px-5 py-2.5 min-w-[140px] border-2 cursor-pointer
                                        ${selectedLabId === lab._id
                                            ? 'bg-white dark:bg-gray-800 text-blue-950 shadow-theme-md border-blue-950/50 dark:border-blue-950/50'
                                            : 'bg-transparent text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-700'}`}
                                    onClick={() => setSelectedLabId(lab._id)}
                                >
                                    <button
                                        className="text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap flex-1 text-left leading-none"
                                    >
                                        {lab.name}
                                    </button>

                                    <div className={`flex items-center gap-2 ml-3 transition-all duration-300 ${selectedLabId === lab._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {canManageLab && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEditLab(lab); }}
                                                    className="p-1 hover:text-blue-900 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                                    title="Edit Environment"
                                                >
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLab(lab._id); }}
                                                    className="p-1 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                                    title="Delete Environment"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center gap-2 ml-auto pr-2">
                                {canManageLab && (
                                    <button
                                        onClick={handleAddLabButtonClick}
                                        className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-950 hover:text-blue-950 dark:hover:border-blue-950 transition-all shadow-sm"
                                        title="Add New Lab Environment"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    }
                >
                    <div className="flex flex-col lg:flex-row bg-white dark:bg-gray-800 rounded-3xl lg:overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 min-h-[600px]">
                        <QueuePanel
                            show={showQueuePanel}
                            onToggle={() => setShowQueuePanel(!showQueuePanel)}
                            queue={queue}
                            loading={isQueueLoading}
                            filters={queueFilters}
                            setFilters={setQueueFilters}
                            onAdd={() => setShowQueueModal(true)}
                            onRemove={handleRemoveFromQueue}
                            onAssign={handleCompleteQueueEntry}
                            onStudentClick={(student) => {
                                setSelectedStudentForHistory(student);
                                setShowHistoryModal(true);
                            }}
                            viewMode={queueViewMode}
                            setViewMode={setQueueViewMode}
                            historyData={queueHistory}
                            historyLoading={isQueueHistoryLoading}
                        />

                        <div className="flex-1 relative z-10 p-4 md:p-8 pt-6 min-w-0">
                            {/* Lab Arrangement Grid */}
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                    <div className="size-12 border-4 border-blue-950/20 border-t-blue-950 rounded-full animate-spin" />
                                    <p className="text-gray-400 font-medium animate-pulse">Syncing environment arrangement...</p>
                                </div>
                            ) : (visibleRowNames.length === 0) ? (
                                <div className="text-center py-24">
                                    <MonitorIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-6" />
                                    <p className="text-gray-700 dark:text-gray-200 font-semibold mb-2">No workstations mapped yet</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Start by creating your first section.</p>
                                    <Button className="!bg-blue-950 hover:!bg-blue-900" size="sm" onClick={handleAddNewRowButtonClick} disabled={!selectedLabId}>
                                        Create Section A
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto no-scrollbar -mx-2 px-2 pb-32 relative touch-pan-x">
                                    {refreshing && (
                                        <div className="absolute inset-0 z-50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[1px] flex items-start justify-center pt-20">
                                            <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-full px-4 py-2 flex items-center gap-2 animate-bounce">
                                                <div className="size-2 bg-brand-500 rounded-full animate-ping" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Refreshing...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-0 min-w-max pt-4">
                                        {visibleRowNames.map((rowName, idx) => {
                                            const pcsInRow = rowsMap[rowName] || [];
                                            const hasActiveTooltip = pcsInRow.some(p => p._id === expandedPCId || p._id === hoveredPCId);
                                            return (
                                                <RowContainer
                                                    key={rowName}
                                                    row={rows.find(r => normalizeRow(r.name) === rowName) || { name: rowName }}
                                                    pcsInRow={pcsInRow}
                                                    emptySlotsInRow={slotsMap[rowName] || []}
                                                    hasActiveTooltip={hasActiveTooltip}
                                                    expandedPCId={expandedPCId}
                                                    onMovePC={handleMovePC}
                                                    onQuickAdd={handleQuickAddSlot}
                                                    onEditRow={(row) => {
                                                        setRowForm({ name: row.name });
                                                        setEditingRow(row);
                                                        setShowRowModal(true);
                                                    }}
                                                    onDeleteRow={handleDeleteRow}
                                                    renderPC={(pc) => {
                                                        const todaySlots = pcSchedules(pc._id);
                                                        const effectiveStatus = getEffectiveStatus(pc, todaySlots, activeSessions);
                                                        const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.available;
                                                        const inUse = effectiveStatus === 'in-use';
                                                        return (
                                                            <PCSeat
                                                                key={pc._id}
                                                                pc={pc}
                                                                cfg={cfg}
                                                                todaySlots={todaySlots}
                                                                activeSessions={activeSessions}
                                                                inUse={inUse}
                                                                isExpanded={expandedPCId === pc._id}
                                                                onToggleExpand={setExpandedPCId}
                                                                hoveredPCId={hoveredPCId}
                                                                setHoveredPCId={setHoveredPCId}
                                                                onAssign={() => handleOpenSessionModal(pc)}
                                                                onEdit={(pc) => {
                                                                    setPCForm({
                                                                        ...pc,
                                                                        softwares: Array.isArray(pc.softwares) ? pc.softwares.join(', ') : (pc.softwares || '')
                                                                    });
                                                                    setEditingPC(pc);
                                                                    setIsQuickAdd(false);
                                                                    setShowPCModal(true);
                                                                }}
                                                                onDelete={handleDeletePC}
                                                                onMovePC={handleMovePC}
                                                                onComplaint={(pc) => {
                                                                    setComplaintForm({ ...emptyComplaintForm, pcId: pc._id });
                                                                    setShowComplaintModal(true);
                                                                }}
                                                            />
                                                        )
                                                    }}
                                                    renderSlot={(slot) => (
                                                        <EmptySlotPlaceholder
                                                            key={slot._id}
                                                            slot={slot}
                                                            onInitialize={handleInitializeSlot}
                                                            onRemove={handleRemoveSlot}
                                                            onMovePC={handleMovePC}
                                                        />
                                                    )}
                                                />
                                            );
                                        })}

                                        {canManageWorkstations && (
                                            <div className="pt-12 flex justify-center">
                                                <button
                                                    onClick={handleAddNewRowButtonClick}
                                                    className="flex items-center gap-2.5 px-8 py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-black text-gray-700 dark:text-gray-200 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/1 transition-all uppercase tracking-widest group shadow-sm hover:shadow-md"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    Add Section {getNextRowName()}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 flex flex-wrap justify-center gap-8">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <div key={key} className="flex items-center gap-2.5">
                                        <span className={`w-2.5 h-2.5 rounded-sm ${cfg.dot} shadow-sm`} />
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{cfg.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ComponentCard>
            </div>

            <Modal isOpen={showPCModal} onClose={() => setShowPCModal(false)} className="max-w-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                    {editingPC ? 'Edit Workstation' : 'New Workstation'}
                </h2>
                {isQuickAdd && (
                    <p className="text-xs font-bold text-blue-950 mb-6 uppercase tracking-widest">Initializing: Seat {pcForm.row}{pcForm.position + 1}</p>
                )}

                <form onSubmit={handleSavePC} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pcNumber">Workstation Name</Label>
                            <Input
                                id="pcNumber"
                                required
                                value={pcForm.pcNumber}
                                onChange={e => setPCForm({ ...pcForm, pcNumber: e.target.value.toUpperCase() })}
                                placeholder="e.g. cc-01"
                            />
                        </div>
                        <div>
                            <Label htmlFor="pcStatus">Status</Label>
                            <select
                                id="pcStatus"
                                value={pcForm.status}
                                onChange={e => setPCForm({ ...pcForm, status: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none h-[42px]"
                            >
                                <option value="available">Working</option>
                                <option value="maintenance">Repairing</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="softwares">Installed Softwares</Label>
                        <textarea
                            id="softwares"
                            value={pcForm.softwares || ''}
                            onChange={e => setPCForm({ ...pcForm, softwares: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none h-20 resize-none font-medium"
                            placeholder="e.g. AutoCAD, Photoshop, MATLAB"
                        />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 ml-1 font-medium">Separate software names with commas</p>
                    </div>
                    <div>
                        <Label htmlFor="specs">Hardware Specification</Label>
                        <textarea
                            id="specs"
                            value={pcForm.specs}
                            onChange={e => setPCForm({ ...pcForm, specs: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs outline-none h-20 resize-none font-medium"
                            placeholder="e.g. 16GB RAM, RTX 3060, 512GB SSD"
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                        <Button variant="outline" onClick={() => setShowPCModal(false)}>Cancel</Button>
                        <Button type="submit" className="!bg-blue-950 hover:!bg-blue-900" loading={isSubmittingPC}>
                            {editingPC ? 'Save Changes' : 'Create Workstation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showScheduleModal && !!selectedPC} onClose={() => setShowScheduleModal(false)} className="max-w-2xl p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Manage Users</h2>
                    <p className="text-xs font-bold text-blue-950 mt-1 uppercase tracking-widest">
                        {selectedPC?.pcNumber || `${selectedPC?.row}${selectedPC?.position + 1}`}
                        {selectedPC?.label ? ` — ${selectedPC.label}` : ''}
                    </p>
                </div>

                <div className="grid grid-cols-[120px_1fr_1fr_42px] gap-3 mb-2 px-1">
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Time Slot</span>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Software</span>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Student Name</span>
                    <span />
                </div>

                <form onSubmit={handleUpdateSlots} className="space-y-2">
                    {TIME_SLOTS.map(slot => {
                        const f = slotForms[slot] || {};
                        const isBooked = !!f.existingId && !f.toDelete;
                        const isDeleting = f.toDelete;
                        return (
                            <div
                                key={slot}
                                className={`grid grid-cols-[120px_1fr_1fr_42px] gap-3 items-center p-2 rounded-xl transition-all duration-200 ${isDeleting
                                    ? 'bg-red-50/50 dark:bg-red-900/10 opacity-50'
                                    : isBooked
                                        ? 'bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20'
                                        : 'bg-gray-50/50 dark:bg-gray-900/30 border border-transparent'
                                    }`}
                            >
                                <span className={`text-sm font-semibold pl-1 ${isBooked ? 'text-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                                    }`}>{slot}</span>

                                <select
                                    value={f.purpose || ''}
                                    onChange={e => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], purpose: e.target.value } }))}
                                    disabled={isDeleting}
                                    className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 h-[42px] text-xs font-medium outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 transition-all disabled:opacity-50"
                                >
                                    <option value="">— Software —</option>
                                    {(selectedPC?.softwares || []).map(sw => (
                                        <option key={sw} value={sw}>{sw}</option>
                                    ))}
                                    <option value="General">General</option>
                                </select>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Student name"
                                        value={f.studentName || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setSlotForms(prev => ({
                                                ...prev,
                                                [slot]: { ...prev[slot], studentName: val, studentId: null, queueId: null }
                                            }));
                                            setActiveWaitlistSearch(slot);
                                        }}
                                        onFocus={() => setActiveWaitlistSearch(slot)}
                                        disabled={isDeleting}
                                        className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 h-[42px] text-xs font-bold outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 transition-all disabled:opacity-50"
                                    />
                                    {activeWaitlistSearch === slot && f.studentName.length > 0 && !f.studentId && (
                                        <div className="absolute z-[110] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-40 overflow-y-auto no-scrollbar">
                                            {queue
                                                .filter(item => {
                                                    const name = item.studentId?.fullName || item.studentName || "";
                                                    const id = item.studentId?.studentId || "";
                                                    const search = f.studentName.toLowerCase();
                                                    return name.toLowerCase().includes(search) || id.toLowerCase().includes(search);
                                                })
                                                .filter(item => {
                                                    // Filter out students already assigned to this slot anywhere in the lab
                                                    const isAssigned = activeSessions.some(s => {
                                                        const sId = s.studentId?._id || s.studentId;
                                                        const iId = item.studentId?._id || item.studentId;
                                                        // If we have an ID, compare IDs. If not (manual entry), this check is harder, 
                                                        // but usually manual entries aren't cross-referenced as strictly.
                                                        // For now, if we have IDs, we prevent double booking.
                                                        if (sId && iId) return sId.toString() === iId.toString() && s.slot === slot && (s.status === 'active' || s.status === 'assigned');
                                                        return false;
                                                    });
                                                    return !isAssigned;
                                                })
                                                .map(item => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSlotForms(prev => ({
                                                                ...prev,
                                                                [slot]: {
                                                                    ...prev[slot],
                                                                    studentName: item.studentId?.fullName || item.studentName,
                                                                    studentId: item.studentId?._id || item.studentId || null,
                                                                    queueId: item._id,
                                                                    purpose: prev[slot].purpose || item.preferredSoftware
                                                                }
                                                            }));
                                                            setActiveWaitlistSearch(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                                    >
                                                        <p className="text-[11px] font-bold text-gray-800 dark:text-white/90">
                                                            {item.studentId?.fullName || item.studentName}
                                                        </p>
                                                        <p className="text-[9px] text-gray-500 font-medium">Waitlist: {item.preferredSlot} • {item.preferredSoftware}</p>
                                                    </button>
                                                ))
                                            }
                                            {queue.filter(item => {
                                                const name = item.studentId?.fullName || item.studentName || "";
                                                return name.toLowerCase().includes(f.studentName.toLowerCase());
                                            }).length === 0 && (
                                                    <div className="px-4 py-3 text-[10px] text-gray-400 italic">No matches in waitlist</div>
                                                )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-center gap-1">
                                    {f.existingId ? (
                                        <button
                                            type="button"
                                            onClick={() => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], toDelete: !prev[slot].toDelete } }))}
                                            className={`p-2 rounded-lg transition-colors ${isDeleting
                                                ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                                                : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20'
                                                }`}
                                            title={isDeleting ? "Restore Slot" : "Delete Booking & Re-queue"}
                                        >
                                            {isDeleting ? '↩' : <TrashBinIcon className="w-4 h-4" />}
                                        </button>
                                    ) : (
                                        <div className="w-8" />
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex gap-3 justify-end mt-8">
                        <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
                        <Button type="submit" className="!bg-blue-950 hover:!bg-blue-900" loading={isSubmittingSchedule}>
                            Update Changes
                        </Button>
                    </div>
                </form>
            </Modal>


            <Modal isOpen={showRowModal} onClose={() => setShowRowModal(false)} className="max-w-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                    {editingRow ? 'Edit Section' : 'New Section'}
                </h2>

                <form onSubmit={handleSaveRow} className="space-y-4">
                    <div>
                        <Label htmlFor="rowName">Section Name (Letter)</Label>
                        <Input
                            id="rowName"
                            required
                            value={rowForm.name}
                            onChange={e => setRowForm({ ...rowForm, name: e.target.value.toUpperCase() })}
                            placeholder="e.g. A"
                            maxLength={2}
                        />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 ml-1 font-medium">Use A, B, C for standard naming</p>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button variant="outline" onClick={() => setShowRowModal(false)}>Cancel</Button>
                        <Button type="submit" className="!bg-blue-950 hover:!bg-blue-900">
                            {editingRow ? 'Save Changes' : 'Create Section'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showLabModal} onClose={() => setShowLabModal(false)} className="max-w-xl p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                    {editingLab ? 'Edit Environment' : 'New Environment'}
                </h2>

                <form onSubmit={handleSaveLab} className="space-y-4">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="labName">Laboratory Name</Label>
                            <Input
                                id="labName"
                                required
                                value={labForm.name}
                                onChange={e => setLabForm({ ...labForm, name: e.target.value })}
                                placeholder="e.g. Computing Lab 1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="location">Location details</Label>
                            <Input
                                id="location"
                                value={labForm.location}
                                onChange={e => setLabForm({ ...labForm, location: e.target.value })}
                                placeholder="e.g. 3rd Floor, West Wing"
                            />
                        </div>

                        <div>
                            <Label>Permitted Brands</Label>
                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar pr-1 mt-2">
                                {(user?.brands || []).map(b => {
                                    const bId = (b.brand?._id || b.brand || b).toString();
                                    const bName = b.brand?.name || "Unknown Brand";
                                    const isSelected = labForm.brands?.includes(bId);
                                    return (
                                        <label key={bId} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 group
                                            ${isSelected
                                                ? 'border-blue-950/50 bg-blue-950/5 dark:bg-blue-950/10'
                                                : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50'}`}>
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300
                                                ${isSelected ? 'bg-blue-950 border-blue-950' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:border-blue-300'}`}>
                                                {isSelected && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>
                                                {bName}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    const newBrands = e.target.checked
                                                        ? [...(labForm.brands || []), bId]
                                                        : (labForm.brands || []).filter(id => id !== bId);
                                                    setLabForm({ ...labForm, brands: newBrands });
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button variant="outline" onClick={() => setShowLabModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="!bg-blue-950 hover:!bg-blue-900" loading={isSubmitting}>
                            {editingLab ? 'Update Environment' : 'Create Environment'}
                        </Button>
                    </div>
                </form>
            </Modal>


            <Modal isOpen={showQueueModal} onClose={() => setShowQueueModal(false)} className="max-w-md p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Add to Waiting List</h2>
                    <p className="text-xs font-bold text-blue-950 mt-1 uppercase tracking-widest">Register Student for Lab Session</p>
                </div>

                <form onSubmit={handleAddToQueue} className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="studentSearch">Student Name</Label>
                        <Input
                            id="studentSearch"
                            placeholder="Type student name or ID..."
                            value={studentSearch}
                            onChange={(e) => {
                                setStudentSearch(e.target.value);
                                if (queueForm.studentId) setQueueForm({ ...queueForm, studentId: '' });
                            }}
                            className="pr-10"
                        />
                        {isSearchingStudents && (
                            <div className="absolute right-3 bottom-3">
                                <div className="size-4 border-2 border-blue-950/20 border-t-blue-950 rounded-full animate-spin" />
                            </div>
                        )}

                        {studentResults.length > 0 && (
                            <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden no-scrollbar">
                                {studentResults.map(s => (
                                    <button
                                        key={s._id}
                                        type="button"
                                        onClick={() => {
                                            setQueueForm({ ...queueForm, studentId: s._id });
                                            setStudentSearch(s.fullName);
                                            setStudentResults([]);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 
                                            ${queueForm.studentId === s._id ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                                    >
                                        <p className="text-sm font-bold text-gray-800 dark:text-white/90">{s.fullName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{s.studentId} • {s.coursePreference}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="prefSlot">Preferred Slot</Label>
                            <select
                                id="prefSlot"
                                value={queueForm.preferredSlot}
                                onChange={e => setQueueForm({ ...queueForm, preferredSlot: e.target.value })}
                                className="w-full h-[42px] rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium focus:border-blue-950 focus:ring-2 focus:ring-blue-950/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 outline-none"
                            >
                                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="prefSW">Software/Purpose</Label>
                            <Input
                                id="prefSW"
                                placeholder="e.g. Photoshop"
                                value={queueForm.preferredSoftware}
                                onChange={e => setQueueForm({ ...queueForm, preferredSoftware: e.target.value })}
                                className="!focus:border-blue-950 !focus:ring-blue-950/10"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-8">
                        <Button variant="outline" onClick={() => setShowQueueModal(false)}>Cancel</Button>
                        <Button type="submit" className="!bg-blue-950 hover:!bg-blue-900" loading={isQueueLoading} disabled={!queueForm.studentId && !studentSearch.trim()}>
                            Add to Queue
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Raise Complaint Modal */}
            {
                showComplaintModal && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 italic uppercase tracking-tighter flex items-center gap-3">
                                <AlertIcon className="w-6 h-6 text-yellow-500" />
                                Issue Reporting
                            </h3>
                            <form onSubmit={handleSaveComplaint} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Workstation</label>
                                    <div className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-bold text-gray-500">
                                        {pcs.find(p => p._id === complaintForm.pcId)?.pcNumber || 'Selected Workstation'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Issue Headline *</label>
                                    <input required value={complaintForm.title} onChange={e => setComplaintForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Hardware Malfunction" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-blue-950 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-3 ml-1">Priority Matrix</label>
                                    <div className="flex gap-2">
                                        {['low', 'medium', 'high'].map(p => (
                                            <button key={p} type="button" onClick={() => setComplaintForm(f => ({ ...f, priority: p }))}
                                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 ${complaintForm.priority === p
                                                    ? 'border-blue-950 bg-blue-950 text-white shadow-lg shadow-blue-950/20 scale-105'
                                                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2 ml-1">Detailed Log</label>
                                    <textarea value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                                        rows={3} placeholder="Describe the technical issue in detail..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-medium text-gray-800 dark:text-white outline-none focus:border-blue-950 resize-none transition-all leading-relaxed" />
                                </div>

                                <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowComplaintModal(false)} disabled={savingComplaint}>Abort</Button>
                                    <Button type="submit" className="flex-1 !bg-blue-950 hover:!bg-blue-900" disabled={savingComplaint || !complaintForm.title.trim()}>
                                        {savingComplaint ? 'Committing...' : 'Commit Log'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Activity History Modal */}
            <Modal
                isOpen={showHistoryModal}
                onClose={() => {
                    setShowHistoryModal(false);
                    setSelectedStudentForHistory(null);
                }}
                className="max-w-2xl !p-0"
            >
                <div className="flex flex-col h-[70vh] max-h-[700px]">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-blue-950/10 flex items-center justify-center text-blue-950 border border-blue-950/20 shadow-sm">
                                    <History className="size-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                                        {selectedStudentForHistory ? (
                                            <>{selectedStudentForHistory.studentId?.fullName || selectedStudentForHistory.studentName}</>
                                        ) : (
                                            "Lab Activity"
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Operations Log</span>
                                        <span className="size-1 bg-gray-300 rounded-full" />
                                        <span className="text-[10px] text-blue-950 font-black uppercase tracking-widest">Real-time History</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchHistory}
                                    disabled={isHistoryLoading}
                                    className="p-2 text-gray-400 hover:text-blue-950 transition-colors disabled:opacity-50"
                                    title="Refresh Logs"
                                >
                                    <RefreshCw className={`size-5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={() => {
                                        setShowHistoryModal(false);
                                        setSelectedStudentForHistory(null);
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <Plus className="size-6 rotate-45" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Timeline */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {isHistoryLoading && historyLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="size-10 border-4 border-blue-950/20 border-t-blue-950 rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing logs...</p>
                            </div>
                        ) : historyLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-20 opacity-30">
                                <Clock className="size-12" />
                                <p className="text-sm font-bold uppercase tracking-widest">No activity recorded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-950/50 before:via-gray-100 dark:before:via-gray-800 before:to-transparent">
                                {historyLogs.map((log, idx) => {
                                    const isLatest = idx === 0;
                                    const date = new Date(log.createdAt);

                                    const getLogConfig = (action) => {
                                        if (action === 'LAB_QUEUE_ADD') return { color: 'rose', icon: Plus };
                                        if (action === 'LAB_QUEUE_REMOVE' || action === 'LAB_SCHEDULE_REQUEUE') return { color: 'amber', icon: AlertTriangle };
                                        if (action.includes('ASSIGN') || action.includes('START')) return { color: 'blue', icon: ShieldCheck };
                                        if (action === 'LAB_SESSION_END') return { color: 'emerald', icon: Power };
                                        if (action.includes('TRANSFER')) return { color: 'indigo', icon: ArrowRightLeft };
                                        return { color: 'gray', icon: History };
                                    };

                                    const config = getLogConfig(log.action);
                                    const colorMap = {
                                        rose: 'bg-rose-500 text-rose-500',
                                        amber: 'bg-amber-500 text-amber-500',
                                        blue: 'bg-blue-600 text-blue-600',
                                        emerald: 'bg-emerald-500 text-emerald-500',
                                        indigo: 'bg-indigo-500 text-indigo-500',
                                        gray: 'bg-gray-500 text-gray-500'
                                    };

                                    const Icon = config.icon;

                                    return (
                                        <div key={log._id} className={`relative pl-12 transition-all duration-300 ${isLatest ? 'opacity-100' : 'opacity-80 group'}`}>
                                            {/* Dot on line */}
                                            <div className={`absolute left-0 top-1.5 size-9 rounded-full border-4 border-white dark:border-gray-950 flex items-center justify-center z-10 shadow-sm transition-all ${isLatest
                                                ? `${colorMap[config.color].split(' ')[0]} scale-110 shadow-lg shadow-${config.color}-500/20`
                                                : 'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                <Icon className={`size-3.5 ${isLatest ? 'text-white font-bold' : 'text-gray-400'}`} />
                                            </div>

                                            <div className={`bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 transition-all hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:shadow-theme-sm ${isLatest ? 'ring-1 ring-blue-950/5' : ''}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${colorMap[config.color].split(' ')[1]} bg-${config.color}-500/10`}>
                                                            {log.action.split('_').slice(2).join(' ')}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                            {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-snug">
                                                    {log.description}
                                                </p>
                                                <div className="mt-3 pt-3 border-t border-gray-100/50 dark:border-gray-800/50 flex items-center gap-2">
                                                    <div className="size-5 rounded-full bg-blue-950/10 flex items-center justify-center text-[8px] font-black text-blue-950 uppercase">
                                                        {log.userId?.fullName?.charAt(0) || 'A'}
                                                    </div>
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        Managed By {log.userId?.fullName || 'System Admin'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

        </div >
    );
}

export default function LabScheduler() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ArrangementContent />
        </DndProvider>
    );
}
