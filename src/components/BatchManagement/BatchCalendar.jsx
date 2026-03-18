import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Edit2, Info, Search,
    FileText, Share2, X, LayoutGrid, CalendarDays, Columns as ColumnsIcon, Plus, Minus, MoreVertical,
    Clock, CheckCircle2, AlertCircle, Hash, Box, Trash2
} from 'lucide-react';
import {
    format, addDays, isSameDay, isWithinInterval, startOfDay,
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
    isSameMonth, addMonths, subMonths, isToday, subWeeks, addWeeks
} from 'date-fns';
import CreateBatchModal from './CreateBatchModal';
import MobileDailySchedule from './MobileDailySchedule';
import AttendanceModal from './AttendanceModal';
import MonthlyAttendanceModal from './MonthlyAttendanceModal';
import BatchStudentList from './BatchStudentList';
import { Modal } from '../ui/modal';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, isOwner, isManager, isAcademicCoordinator, hasRole } from '../../utils/roleHelpers';

export default function BatchCalendar({ currentDate, setCurrentDate, view, setView }) {
    const { user, selectedBrand } = useAuth();
    const [instructors, setInstructors] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
    const [isStudentListOpen, setIsStudentListOpen] = useState(false);
    const [viewStudentId, setViewStudentId] = useState(null);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const batchIdParam = urlParams.get('batchId');
        const viewStudentIdParam = urlParams.get('viewStudentId');
        const dateParam = urlParams.get('date');

        if (batchIdParam && batches.length > 0) {
            const targetBatch = batches.find(b => b._id === batchIdParam);
            if (targetBatch) {
                setSelectedBatch(targetBatch);
                
                if (viewStudentIdParam) {
                    setViewStudentId(viewStudentIdParam);
                    if (dateParam) setSelectedDate(new Date(dateParam));
                    setIsMonthlyReportOpen(true);
                } else {
                    setIsAttendanceModalOpen(true);
                }

                // Clear params after handling to prevent repetitive pops
                const url = new URL(window.location.href);
                url.searchParams.delete('batchId');
                url.searchParams.delete('viewStudentId');
                url.searchParams.delete('date');
                window.history.replaceState({}, '', url.pathname + url.search);
            }
        }
    }, [batches]);

    const fetchData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        const brandId = selectedBrand?._id || selectedBrand?.id;
        if (!brandId) {
            setLoading(false);
            return;
        }

        try {
            const [instructorsRes, batchesRes] = await Promise.all([
                axios.get(`${API}/users/dropdown?roles=Instructor&brandId=${brandId}`, { withCredentials: true }),
                axios.get(`${API}/batches`, { withCredentials: true })
            ]);

            const filteredInstructors = instructorsRes.data.users.filter(user =>
                user.roles && user.roles.includes('Instructor')
            );

            setInstructors(filteredInstructors);
            setBatches(batchesRes.data.batches);
        } catch (error) {
            console.error("Error fetching calendar data:", error);
            toast.error("Failed to load calendar data");
        } finally {
            setLoading(false);
        }
    };

    const weekDays = useMemo(() => {
        return eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
        });
    }, [currentDate]);

    const instructorTracksMap = useMemo(() => {
        const map = new Map();
        if (!instructors.length) return map;

        instructors.forEach(instructor => {
            const slotsUsed = new Set();
            const instructorId = instructor._id;
            const instructorName = instructor.fullName;

            batches.forEach(b => {
                if (b.instructor === instructorId || b.instructorName === instructorName) {
                    slotsUsed.add(b.slot);
                }
            });

            const indices = Array.from(slotsUsed).sort((a, b) => a - b);
            if (indices.length === 0) {
                map.set(instructorId, [0]);
            } else {
                const maxIndex = Math.max(...indices);
                const finalRange = [];
                for (let i = 0; i <= maxIndex; i++) finalRange.push(i);
                map.set(instructorId, finalRange);
            }
        });
        return map;
    }, [instructors, batches]);

    const getSlotTracksForInstructor = (instructorId) => {
        return instructorTracksMap.get(instructorId) || [0];
    };

    const handleAddPermanentSlot = async (instructor) => {
        try {
            const currentTracks = getSlotTracksForInstructor(instructor._id);
            // If currentTracks is [0] because it was empty, the next index should be 1.
            // But we need to check if there is an ACTUAL batch/slot at 0.
            const hasActualRecords = batches.some(b =>
                (b.instructor === instructor._id || b.instructorName === instructor.fullName)
            );

            const nextSlotIndex = hasActualRecords ? Math.max(...currentTracks) + 1 : 0;

            await axios.post(`${API}/batches`, {
                instructor: instructor._id,
                instructorName: instructor.fullName,
                slot: nextSlotIndex,
                isSlot: true,
                batchName: '',
                brand: instructor.brand || user.brand
            }, { withCredentials: true });

            toast.success(`Track ${nextSlotIndex + 1} established`);
            fetchData(true);
        } catch (error) {
            console.error("Slot creation failed:", error);
            toast.error("Failed to establish track");
        }
    };

    const handleRemovePermanentSlot = async (instructor, slotIndex) => {
        try {
            // Find the slot record for this instructor and index
            const slotRecord = batches.find(b =>
                (b.instructor === instructor._id || b.instructorName === instructor.fullName) &&
                b.slot === slotIndex &&
                b.isSlot
            );

            if (!slotRecord) {
                // If it's not a "slot" record, it might be an actual batch. 
                // We should only allow removing "vacant" slots via this quick action.
                toast.error("Cannot remove active batch tracks here");
                return;
            }

            window.confirm(`Are you sure you want to remove Slot ${slotIndex + 1}?`) &&
                await axios.delete(`${API}/batches/${slotRecord._id}`, { withCredentials: true });
            toast.success(`Track ${slotIndex + 1} removed`);
            fetchData(true);
        } catch (error) {
            console.error("Slot removal failed:", error);
            toast.error("Failed to remove track");
        }
    };

    const handleSlotCellClick = (instructor, date, slotIndex) => {
        setSelectedSlot({ instructor, slotIndex, date });
        setIsCreateModalOpen(true);
    };

    const handleBatchClick = (batch) => {
        setSelectedBatch(batch);
        setIsEditModalOpen(true);
    };

    const batchMap = useMemo(() => {
        const map = new Map();
        if (!batches.length || !weekDays.length) return map;

        batches.forEach(b => {
            if (b.isSlot) {
                // Store slots directly by instructor and slot index
                const key = `${b.instructor || b.instructorName}_${b.slot}`;
                map.set(key, b);
                return;
            }

            // For actual batches, map them across their entire duration (clamped to week)
            try {
                const start = startOfDay(new Date(b.startDate));
                const end = startOfDay(new Date(b.expectedEndDate));

                weekDays.forEach(date => {
                    const current = startOfDay(date);
                    if (isWithinInterval(current, { start, end })) {
                        const instructorKey = b.instructor || b.instructorName;
                        const key = `${instructorKey}_${b.slot}_${format(date, 'yyyy-MM-dd')}`;
                        map.set(key, b);
                    }
                });
            } catch (err) {
                console.error("Date mapping error:", err);
            }
        });
        return map;
    }, [batches, weekDays]);

    const getBatchForInstructorSlotOnDate = (instructorId, slotIndex, date) => {
        const instructor = instructors.find(i => i._id === instructorId);
        const dateKey = format(date, 'yyyy-MM-dd');

        // Try instructor ID first, then name
        let batch = batchMap.get(`${instructorId}_${slotIndex}_${dateKey}`);
        if (!batch && instructor) {
            batch = batchMap.get(`${instructor.fullName}_${slotIndex}_${dateKey}`);
        }

        if (batch) return batch;

        // If no batch, check for a "vacant track" (isSlot record)
        let slot = batchMap.get(`${instructorId}_${slotIndex}`);
        if (!slot && instructor) {
            slot = batchMap.get(`${instructor.fullName}_${slotIndex}`);
        }
        return slot;
    };

    const handleDeleteBatch = async (batchId) => {
        if (!window.confirm("Delete record?")) return;
        try {
            await axios.delete(`${API}/batches/${batchId}`, { withCredentials: true });
            fetchData(true);
            setIsViewModalOpen(false);
            toast.success("Removed.");
        } catch (error) {
            toast.error("Failed.");
        }
    };


    if (loading && instructors.length === 0) return <LoadingSpinner />;

    return (
        <div className="w-full">
            {/* ── Mobile Daily Schedule (< lg) ── */}
            <div className="block lg:hidden min-h-[85vh] flex flex-col">
                <MobileDailySchedule
                    instructors={instructors}
                    getBatchForInstructorSlotOnDate={getBatchForInstructorSlotOnDate}
                    getSlotTracksForInstructor={getSlotTracksForInstructor}
                    onBatchClick={(batch) => { setSelectedBatch(batch); setIsAttendanceModalOpen(true); }}
                    onSlotCellClick={handleSlotCellClick}
                />
            </div>

            {/* ── Desktop Weekly Matrix (>= lg) ── */}
            <div className="hidden lg:block">
                {/* spreadsheet-Style Grid View (Requested Layout) */}
                <div className="overflow-x-auto overflow-y-auto max-h-[75vh] custom-scrollbar border border-gray-100 dark:border-gray-800">
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/80 sticky top-0 z-50">
                                <th className="w-40 border border-gray-100 dark:border-gray-800 p-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-left">
                                    Instructor
                                </th>
                                <th className="w-32 border border-gray-100 dark:border-gray-800 p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">
                                    Slot
                                </th>
                                {weekDays.map((date, idx) => (
                                    <th
                                        key={idx}
                                        className={`border border-gray-100 dark:border-gray-800 p-4 text-center transition-colors ${isToday(date) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                                    >
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className={`text-[11px] font-medium uppercase tracking-tight ${isToday(date) ? 'text-blue-950 dark:text-blue-400' : 'text-gray-500'}`}>
                                                {format(date, 'EEE')}
                                            </span>
                                            <span className={`text-[11px] font-medium uppercase tracking-tight ${isToday(date) ? 'text-blue-900 dark:text-blue-500' : 'text-gray-400'}`}>
                                                {format(date, 'dd MMM')}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.filter(i => i.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(instructor => {
                                const tracks = getSlotTracksForInstructor(instructor._id);
                                return (
                                    <React.Fragment key={instructor._id}>
                                        {tracks.map((slotIndex, tIdx) => (
                                            <tr key={slotIndex} className="group/row bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                                {/* Instructor Spanning Column */}
                                                {tIdx === 0 && (
                                                    <td
                                                        rowSpan={tracks.length}
                                                        className="border border-gray-100 dark:border-gray-800 p-4 align-top z-10 sticky left-0 bg-white dark:bg-gray-900"
                                                    >
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-gray-900 dark:text-white text-[11px] tracking-tight truncate uppercase">{instructor.fullName}</h4>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Slot Header Column */}
                                                <td className="border border-gray-100 dark:border-gray-800 p-2 text-center bg-gray-50/20 dark:bg-gray-800/20 h-20 relative group/slot overflow-hidden">
                                                    <span className="text-[10px] font-black text-yellow-600 uppercase tracking-tight group-hover/slot:translate-y-[-24px] transition-all block duration-200">Slot {slotIndex + 1}</span>
                                                    <div className="absolute inset-0 flex translate-y-[100%] group-hover/slot:translate-y-0 transition-all duration-200">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRemovePermanentSlot(instructor, slotIndex); }}
                                                            className="flex-1 flex items-center justify-center bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                                                            title="Remove Slot"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAddPermanentSlot(instructor); }}
                                                            className="flex-1 flex items-center justify-center bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                                                            title="Add Slot"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Daily Grid Cells (Optimized for Spanning Cards) */}
                                                {(() => {
                                                    const cells = [];
                                                    for (let i = 0; i < weekDays.length; i++) {
                                                        const date = weekDays[i];
                                                        const batch = getBatchForInstructorSlotOnDate(instructor._id, slotIndex, date);
                                                        const hasBatch = !!batch && !batch.isSlot;

                                                        if (hasBatch) {
                                                            // Calculate colSpan for this week's view
                                                            let colSpan = 1;
                                                            const effectiveEndDate = startOfDay(new Date(batch.expectedEndDate));

                                                            while (i + colSpan < weekDays.length) {
                                                                const nextDate = startOfDay(weekDays[i + colSpan]);
                                                                if (nextDate <= effectiveEndDate) {
                                                                    colSpan++;
                                                                } else {
                                                                    break;
                                                                }
                                                            }

                                                            cells.push(
                                                                <td
                                                                    key={date.toString()}
                                                                    colSpan={colSpan}
                                                                    onClick={() => handleBatchClick(batch)}
                                                                    className="border border-gray-100 dark:border-gray-800 p-1.5 h-20 cursor-pointer transition-all relative z-10"
                                                                >
                                                                    <div className="h-full bg-white dark:bg-gray-800 p-3 border shadow-sm border-l-4 flex flex-col justify-center gap-1.5 group/card hover:shadow-xl hover:translate-y-[-1px] transition-all overflow-hidden relative border-blue-100 dark:border-gray-800 border-l-blue-950">
                                                                        <div className="flex flex-col gap-1 overflow-hidden">
                                                                            <span className="text-[10px] font-bold text-blue-950 dark:text-blue-400 uppercase tracking-tight whitespace-nowrap">
                                                                                {batch.batchTime?.from || '--:--'} - {batch.batchTime?.to || '--:--'}
                                                                            </span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-[11px] font-black uppercase tracking-tight truncate border border-gray-200 dark:border-gray-600">
                                                                                    {batch.subject}
                                                                                </span>
                                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
                                                                                    <Users size={10} className="text-blue-600 dark:text-blue-400" />
                                                                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                                                                                        {batch.studentCount || 0}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Icons Overlay */}
                                                                        <div className="absolute top-1 right-1 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setSelectedBatch(batch); setIsEditModalOpen(true); }}
                                                                                className="p-2 bg-white/90 dark:bg-gray-800/90 text-blue-950 dark:text-blue-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 shadow-sm border border-blue-50 dark:border-gray-700 transition-all"
                                                                                title="Edit Batch"
                                                                            >
                                                                                <Edit2 size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch._id); }}
                                                                                className="p-2 bg-white/90 dark:bg-gray-800/90 text-red-500 dark:text-red-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-500 shadow-sm border border-red-50 dark:border-gray-700 transition-all"
                                                                                title="Delete Batch"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setSelectedBatch(batch); setIsStudentListOpen(true); }}
                                                                                className="p-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
                                                                                title="Manage Students"
                                                                            >
                                                                                <Users size={16} />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setSelectedBatch(batch); setIsAttendanceModalOpen(true); }}
                                                                                className="p-2 bg-white/90 dark:bg-gray-800/90 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 shadow-sm border border-emerald-50 dark:border-gray-700 transition-all"
                                                                                title="Mark Attendance"
                                                                            >
                                                                                <CheckCircle2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            );
                                                            i += (colSpan - 1);
                                                        } else {
                                                            // Regular Slot/Empty Cell
                                                            cells.push(
                                                                <td
                                                                    key={date.toString()}
                                                                    onClick={() => handleSlotCellClick(instructor, date, slotIndex)}
                                                                    className={`border border-gray-100 dark:border-gray-800 p-1.5 h-20 cursor-pointer transition-all ${isToday(date) ? 'bg-blue-50/5' : ''} hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 group/cell`}
                                                                >
                                                                    <div className="h-full border border-dashed border-gray-50 dark:border-gray-800/30 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-all">
                                                                        <Plus size={10} className="text-gray-300" />
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                    }
                                                    return cells;
                                                })()}
                                            </tr>
                                        ))}

                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>{/* end desktop block */}

            {/* Modals Bridge */}
            {isCreateModalOpen && (
                <CreateBatchModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => { fetchData(); setIsCreateModalOpen(false); }}
                    initialData={selectedSlot ? {
                        instructor: selectedSlot.instructor._id,
                        instructorName: selectedSlot.instructor.fullName,
                        startDate: format(selectedSlot.date, 'yyyy-MM-dd'),
                        slot: selectedSlot.slotIndex
                    } : null}
                />
            )}

            {isEditModalOpen && selectedBatch && (
                <CreateBatchModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdated={() => { fetchData(); setIsEditModalOpen(false); setIsViewModalOpen(false); }}
                    batch={selectedBatch}
                />
            )}

            {isViewModalOpen && selectedBatch && (
                <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} className="max-w-xl p-0 overflow-hidden shadow-2xl">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                    Batch Details
                                </span>
                                <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                                    <Hash size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Track {selectedBatch.slot + 1}</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{selectedBatch.batchName}</h3>
                        </div>
                        <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-900">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setIsAttendanceModalOpen(true)}
                                className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest"
                            >
                                <CheckCircle2 size={24} className="text-emerald-500" />
                                Mark Attendance
                            </button>
                            <button
                                onClick={() => setIsStudentListOpen(true)}
                                className="flex flex-col items-center justify-center gap-2 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest"
                            >
                                <Users size={24} className="text-blue-500" />
                                Student Roster
                            </button>
                        </div>

                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                Edit Configurations
                            </button>
                            <button
                                onClick={() => handleDeleteBatch(selectedBatch._id)}
                                className="text-[11px] font-bold uppercase tracking-widest text-red-500 dark:text-rose-400 hover:underline"
                            >
                                Delete Batch
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isAttendanceModalOpen && selectedBatch && (
                <AttendanceModal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} batch={selectedBatch} />
            )}
            {isMonthlyReportOpen && selectedBatch && (
                <MonthlyAttendanceModal 
                    isOpen={isMonthlyReportOpen} 
                    onClose={() => {
                        setIsMonthlyReportOpen(false);
                        setViewStudentId(null);
                    }} 
                    batch={selectedBatch} 
                    viewStudentId={viewStudentId}
                    initialDate={selectedDate}
                />
            )}
            {isStudentListOpen && selectedBatch && (
                <Modal
                    isOpen={isStudentListOpen}
                    onClose={() => setIsStudentListOpen(false)}
                    className="max-w-6xl p-0 overflow-hidden shadow-2xl"
                >
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                    Student Roster
                                </span>
                                <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                                    <Hash size={12} className="text-gray-400" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedBatch.batchName}</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{selectedBatch.subject} • Faculty: {selectedBatch.instructorName}</h3>
                        </div>
                        <button onClick={() => setIsStudentListOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        <BatchStudentList
                            batchId={selectedBatch._id}
                            batchSubject={selectedBatch.subject}
                            batchStartDate={selectedBatch.startDate}
                            batchEndDate={selectedBatch.expectedEndDate}
                            brandName={selectedBatch.brand?.name}
                            batchModuleId={selectedBatch.moduleId}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
