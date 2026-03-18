import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import ComponentCard from '../../components/common/ComponentCard';
import Input from '../../components/form/input/InputField';
import { useDrag, useDrop, useDragLayer } from 'react-dnd';
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    User,
    BookOpen,
    Calendar,
    MoveRight,
    Search,
    Filter,
    MoreVertical,
    Eye,
    History,
    XCircle,
    UserCircle,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Plus,
    CheckCircle2,
    Clock,
    ChevronDown
} from 'lucide-react';
import { Modal } from '../../components/ui/modal';

const ItemTypes = {
    STUDENT: 'student'
};

// --- STUDENT HISTORY MODAL ---
const StudentHistoryModal = ({ student, isOpen, onClose }) => {
    const navigate = useNavigate();
    if (!student) return null;

    const history = [...(student.history || [])].reverse();

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl !p-0">
            <div className="flex flex-col h-[85vh] max-h-[800px] bg-white dark:bg-gray-900 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                    Progress History
                                </span>
                                <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                        ID: {student.studentId}
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {student.fullName}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <Calendar className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-blue-950/50 before:via-gray-100 dark:before:via-gray-800 before:to-transparent">
                        {history.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <Clock className="size-12 mx-auto mb-3" />
                                <p className="text-sm font-bold uppercase tracking-widest">No progress tracked yet</p>
                            </div>
                        ) : (
                            history.map((log, idx) => {
                                const isLatest = idx === 0;
                                const isCompleted = log.status === 'Completed';
                                return (
                                    <div key={idx} className={`relative pl-12 transition-all duration-500 ${isLatest ? 'opacity-100' : 'opacity-80'}`}>
                                        <div className={`absolute left-0 top-1.5 size-9 rounded-full border-4 border-white dark:border-gray-950 flex items-center justify-center z-10 shadow-md transition-all ${log.status === 'Completed' ? 'bg-emerald-500 text-white' :
                                            log.status === 'Partially Completed' ? 'bg-amber-500 text-white' :
                                                log.status === 'Pending' ? 'bg-rose-500 text-white' :
                                                    'bg-blue-500 text-white'
                                            } ${isLatest ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-gray-950 ' + (
                                                log.status === 'Completed' ? 'ring-emerald-500/30' :
                                                    log.status === 'Partially Completed' ? 'ring-amber-500/30' :
                                                        log.status === 'Pending' ? 'ring-rose-500/30' :
                                                            'ring-blue-500/30'
                                            ) : ''}`}>
                                            {log.status === 'Completed' ? (
                                                <CheckCircle2 className="size-3.5 font-bold" />
                                            ) : log.status === 'Partially Completed' ? (
                                                <Clock className="size-3.5 font-bold" />
                                            ) : log.status === 'Pending' ? (
                                                <XCircle className="size-3.5 font-bold" />
                                            ) : (
                                                <Plus className="size-3.5 font-bold" />
                                            )}
                                        </div>

                                        <div className={`bg-white dark:bg-white/[0.02] border p-4 shadow-sm hover:shadow-theme-md transition-all duration-300 group ${isLatest ? (
                                            log.status === 'Completed' ? 'border-emerald-500/30' :
                                                log.status === 'Partially Completed' ? 'border-amber-500/30' :
                                                    log.status === 'Pending' ? 'border-rose-500/30' :
                                                        'border-blue-500/30'
                                        ) : 'border-gray-100 dark:border-gray-800'
                                            }`}>
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-gray-50 dark:border-gray-800/50">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 shadow-sm ${log.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        log.status === 'Partially Completed' ? 'bg-amber-50 text-blue-950 border border-amber-100' :
                                                            log.status === 'Pending' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                                                'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1">
                                                        <Calendar className="size-3" />
                                                        {new Date(log.updatedOn).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1">
                                                        <Clock className="size-3" />
                                                        {new Date(log.updatedOn).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {log.moduleName && (
                                                <p 
                                                    className={`text-[10px] font-black uppercase tracking-widest mb-1 leading-none ${log.metadata?.batchId ? 'text-blue-600 cursor-pointer hover:underline' : 'text-blue-950/40'}`}
                                                    onClick={() => {
                                                        if (log.metadata?.batchId) {
                                                            onClose();
                                                            navigate(`/batch-management?batchId=${log.metadata.batchId}&viewStudentId=${student._id}&date=${log.updatedOn}`);
                                                        }
                                                    }}
                                                >
                                                    {log.status.includes('Batch') ? 'Batch' : 'Module'}: {log.moduleName}
                                                </p>
                                            )}
                                            <p className="text-[13px] text-gray-600 dark:text-gray-300 font-medium mb-3 leading-relaxed">
                                                {log.remark}
                                            </p>

                                            <div className="flex items-center gap-2.5 pt-2 border-t border-gray-50 dark:border-gray-800/50">
                                                <div className="size-7 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 dark:border-gray-700">
                                                    {log.updatedBy?.fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Logged By</span>
                                                    <span className="text-[11px] text-gray-700 dark:text-gray-200 font-bold">
                                                        {log.updatedBy?.fullName || 'System Automated'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end shrink-0 bg-gray-50/30 dark:bg-gray-900/50">
                    <Button 
                        variant="outline" 
                        onClick={onClose} 
                        className="px-8 font-bold uppercase text-[10px] tracking-widest"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// --- DROP CONFIRMATION MODAL ---
const DropConfirmationModal = ({ isOpen, onClose, onConfirm, student, targetModuleId, allModules }) => {
    const [status, setStatus] = useState('Completed');
    const [remark, setRemark] = useState('');

    const isRescheduling = student?.completedModules?.includes(targetModuleId);
    const targetModule = allModules?.find(m => m._id === targetModuleId || m.id === targetModuleId);
    const isMovingAway = student?.currentModule && student.currentModule !== targetModuleId;

    useEffect(() => {
        if (isRescheduling) setStatus('Rescheduled');
    }, [isRescheduling]);

    if (!student) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ status, remark });
        setRemark('');
        setStatus('Completed');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md !p-0">
            <div className="bg-gray-50/80 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">
                                Status Update
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            {isRescheduling ? 'Module Rescheduling' : 'Progress Movement'}
                        </h3>
                        <p className="text-xs text-blue-950 font-black uppercase tracking-widest opacity-60 mt-0.5">
                            {isRescheduling
                                ? `Re-starting ${targetModule?.name || 'module'}`
                                : 'Moving away from current module'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <Plus className="size-6 rotate-45" />
                    </button>
                </div>
            </div>

            <div className="p-8">

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Only show status selector if moving *away* from something active and NOT just rescheduling into the same slot */}
                    {isMovingAway && !isRescheduling && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                                Previous Stage Status
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Completed', 'Partially Completed', 'Pending'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={`px-3 py-2 text-[10px] font-black uppercase tracking-tight transition-all border ${status === s
                                            ? 'bg-amber-500 text-white border-blue-950 shadow-md'
                                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            {isRescheduling ? 'Rescheduling Reason' : 'Remark'} {(status !== 'Completed' || isRescheduling) && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-sm font-medium focus:ring-2 focus:ring-blue-950/20 outline-none transition-all placeholder:text-gray-300 min-h-[100px]"
                            placeholder={isRescheduling ? "Why is this student re-taking this stage?" : "Enter detailed progress remark..."}
                            required={status !== 'Completed' || isRescheduling}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-amber-500 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-500 shadow-lg shadow-blue-950/20 transition-all"
                        >
                            Confirm Move
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- AUTO SCROLL CONTAINER ---
const AutoScrollContainer = ({ children }) => {
    const scrollRef = useRef(null);
    const requestRef = useRef();

    const { isDragging, currentOffset } = useDragLayer((monitor) => ({
        isDragging: monitor.isDragging(),
        currentOffset: monitor.getClientOffset(),
    }));

    const scrollEdge = useCallback(() => {
        if (!isDragging || !currentOffset || !scrollRef.current) {
            cancelAnimationFrame(requestRef.current);
            return;
        }

        const { x } = currentOffset;
        const containerRect = scrollRef.current.getBoundingClientRect();
        const scrollSpeed = 15;
        const edgeThreshold = 100; // Pixels from edge to start scrolling

        // Check distance from left and right edges
        const distToLeft = x - containerRect.left;
        const distToRight = containerRect.right - x;

        let scrolled = false;

        if (distToLeft < edgeThreshold && distToLeft > 0) {
            // Scroll Left
            scrollRef.current.scrollLeft -= scrollSpeed;
            scrolled = true;
        } else if (distToRight < edgeThreshold && distToRight > 0) {
            // Scroll Right
            scrollRef.current.scrollLeft += scrollSpeed;
            scrolled = true;
        }

        if (scrolled) {
            requestRef.current = requestAnimationFrame(scrollEdge);
        } else {
            // Check again next frame even if we didn't scroll this frame, 
            // incase the user moves the mouse back into the threshold
            requestRef.current = requestAnimationFrame(scrollEdge);
        }
    }, [isDragging, currentOffset]);

    useEffect(() => {
        if (isDragging) {
            requestRef.current = requestAnimationFrame(scrollEdge);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isDragging, scrollEdge]);

    return (
        <div
            ref={scrollRef}
            className="absolute inset-0 overflow-x-auto overflow-y-hidden custom-scrollbar"
        >
            {children}
        </div>
    );
};

// --- DRAGGABLE STUDENT CARD ---
const DraggableStudentCard = ({ student, allModules, onDrop, onOpenDetails, onOpenHistory }) => {
    // Normalize courseDetails to an array for easy access
    const courseDetailsArray = Array.isArray(student.courseDetails)
        ? student.courseDetails
        : (student.courseDetails ? [student.courseDetails] : []);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.STUDENT,
        item: {
            id: student._id,
            currentModule: student.currentModule,
            courseDetails: courseDetailsArray
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [student]);

    const enrollmentDate = new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    const courseName = courseDetailsArray[0]?.courseName || 'No Course Assigned';

    // Extract assigned module IDs from all course details
    const assignedModuleIds = courseDetailsArray.flatMap(course => course.modules || []);

    // Deduplicate and resolve to module names using allModules
    const currentModuleId = student.currentModule || 'pending';
    const completedModules = student.completedModules || []; // Array of completed module IDs

    const assignedModules = [...new Set(assignedModuleIds)]
        .map(id => allModules.find(m => m._id === id || m.id === id))
        .filter(m => m) // Remove undefined/null
        .map(m => {
            let status = 'pending';
            const mId = m._id || m.id;

            if (completedModules.includes(mId)) {
                status = 'completed';
            } else if (currentModuleId === mId) {
                status = 'active';
            } else {
                // Find the LATEST history entry for this specific module name
                const moduleEntries = (student.history || [])
                    .filter(h => h.remark?.includes(m.name))
                    .sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn));

                if (moduleEntries.length > 0) {
                    const latest = moduleEntries[0];
                    if (latest.status === 'Partially Completed') {
                        status = 'partially_completed';
                    } else if (latest.status === 'Completed') {
                        status = 'completed';
                    } else if (latest.status === 'Started' || latest.status === 'Active') {
                        // If it was started but is no longer current and not marked completed/partial, 
                        // it's effectively partially completed unless explicitly reset
                        status = 'partially_completed';
                    }
                    // If latest status is 'Pending', it stays 'pending' (grey)
                }
            }

            return { name: m.name, status };
        });

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            ref={drag}
            className={`
                group/card relative flex flex-col bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 
                shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
            `}>
            {/* ── COLLAPSED CARD (always visible) ── */}
            <div
                className="flex items-start gap-2 px-3 py-2.5 select-none"
                onClick={() => setIsExpanded(prev => !prev)}
            >
                {/* Left: stacked name / course / date+badge */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Line 1 – Name */}
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate group-hover/card:text-blue-950 transition-colors">
                        {student.fullName}
                    </p>

                    {/* Line 2 – Course badge(s) */}
                    <div className="flex flex-wrap gap-1">
                        {courseDetailsArray.length > 0 ? (
                            courseDetailsArray.map((course, idx) => (
                                <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-md text-[9px] font-bold uppercase tracking-tight"
                                >
                                    {course.courseName}
                                </span>
                            ))
                        ) : (
                            <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-100 dark:border-gray-700 rounded-md text-[9px] font-bold uppercase tracking-tight">
                                {courseName}
                            </span>
                        )}
                    </div>

                    {/* Line 3 – Date + Batch status */}
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-blue-950 uppercase tracking-tight">
                            <Calendar className="size-2.5 opacity-40" />
                            {enrollmentDate}
                        </span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-black tracking-widest border ${student.batchScheduled
                            ? 'rounded-full bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                            : 'rounded-full bg-yellow-300 text-black-950 border-black-200 dark:bg-blue-500/10 dark:border-blue-950/20'
                            }`}>
                            {student.batchScheduled ? 'BATCHED' : 'PENDING'}
                        </span>
                    </div>
                </div>

                {/* Right: Chevron */}
                <ChevronDown className={`size-3.5 text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
            </div>

            {/* ── EXPANDED BODY ── */}
            {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-0 border-t border-gray-50 dark:border-gray-700/50">
                    <div className="space-y-2 mt-2.5">

                        {/* Assigned Module Badges */}
                        <div className="flex flex-wrap gap-1">
                            {assignedModules.length > 0 ? (
                                assignedModules.map((mod, idx) => {
                                    let colorClasses = "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
                                    if (mod.status === 'active') colorClasses = "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
                                    else if (mod.status === 'completed') colorClasses = "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
                                    else if (mod.status === 'partially_completed') colorClasses = "bg-amber-50 text-blue-950 dark:bg-blue-500/10 dark:text-amber-400 border-blue-200 dark:border-blue-950/20";
                                    return (
                                        <span key={idx} className={`px-1.5 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-tight ${colorClasses}`}>
                                            {mod.name}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 border border-gray-100 dark:border-gray-800 rounded-md text-[9px] font-bold uppercase tracking-tight">
                                    No Modules
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-gray-50 dark:border-gray-700/50">
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenDetails(student); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                        >
                            <Eye className="size-3.5" strokeWidth={2} /> Profile
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenHistory(student); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all duration-200"
                        >
                            <History className="size-3.5" strokeWidth={2} /> History
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toast.warn("Deletion restricted from board"); }}
                            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
                        >
                            <XCircle className="size-3.5" strokeWidth={2} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- DROPPABLE STAGE COLUMN ---
const DroppableStageColumn = ({ stage, allModules, students, onDrop, onOpenDetails, onOpenHistory }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.STUDENT,
        drop: (item) => onDrop(item.id, stage._id),
        canDrop: (item) => {
            if (item.currentModule === stage._id) return false;

            // Allow dropping into 'pending' or placeholder stages
            if (stage._id === 'pending' || stage.isPlaceholder) return true;

            // NEW: Allow dropping into standard stages regardless of module assignment
            const standardStages = ["Project Stage", "Project Review", "Certificate Process", "Graduation"];
            if (standardStages.some(s => s.toLowerCase() === stage.name.toLowerCase())) {
                return true;
            }

            // Check if the target stage is in the student's assigned modules
            const assignedModuleIds = item.courseDetails?.flatMap(course => course.modules || []) || [];
            if (!assignedModuleIds.includes(stage._id) && !assignedModuleIds.includes(stage.id)) {
                return false;
            }
            return true;
        },
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [stage._id, onDrop]);

    return (
        <div
            ref={drop}
            className={`flex flex-col h-full min-w-[300px] w-[300px] transition-colors duration-200 ${isOver ? (canDrop ? 'bg-blue-50/30 dark:bg-blue-500/5' : 'bg-red-50/30 dark:bg-red-500/5') : ''
                }`}
        >
            {/* Column Header (Matching CandidateList Header) */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-[11px] font-black tracking-[0.1em] uppercase text-blue-950 dark:text-blue-950">
                    {stage.name}
                </span>
                <span className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-500 dark:border-amber-500/30 px-2.5 py-0.5 text-xs font-bold scale-90">
                    {students.length}
                </span>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                {students.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center opacity-10 filter grayscale">
                        <UserCircle className="size-8" />
                    </div>
                ) : (
                    students.map((student) => (
                        <DraggableStudentCard
                            key={student._id}
                            student={student}
                            allModules={allModules}
                            onDrop={onDrop}
                            onOpenDetails={onOpenDetails}
                            onOpenHistory={onOpenHistory}
                        />
                    ))
                )}

                {isOver && canDrop && (
                    <div className="border-2 border-dashed border-blue-200 dark:border-blue-950/20 h-24 flex items-center justify-center bg-blue-50/20 dark:bg-blue-500/5 animate-pulse">
                        <span className="text-[10px] font-black text-blue-950 uppercase tracking-widest">Drop Here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function StudentProgress() {
    const { selectedBrand } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [historyModal, setHistoryModal] = useState({ open: false, student: null });
    const [confirmationModal, setConfirmationModal] = useState({ open: false, data: null });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const brandId = selectedBrand?._id || selectedBrand?.id;

            const [modulesRes, studentsRes] = await Promise.all([
                axios.get(`${API}/modules/all`, { headers: { 'x-brand-id': brandId } }),
                axios.get(`${API}/students/all`, { headers: { 'x-brand-id': brandId } })
            ]);

            const standardStages = [
                "Project Stage",
                "Project Review",
                "Certificate Process",
                "Graduation"
            ];

            const dbModules = modulesRes.data.modules.filter(m => m.isActive);

            // 1. Start with Admission Taken
            const stageList = [
                { _id: 'pending', name: 'Admission Taken' }
            ];

            // 2. Add modules that are NOT standard stages (in their own order)
            const standardLower = standardStages.map(s => s.toLowerCase());
            const courseModules = dbModules.filter(m => !standardLower.includes(m.name.toLowerCase()));
            stageList.push(...courseModules);

            // 3. Add standard stages (either from DB or as placeholders) at the end
            standardStages.forEach(stageName => {
                const dbMatch = dbModules.find(m => m.name.toLowerCase() === stageName.toLowerCase());
                if (dbMatch) {
                    stageList.push(dbMatch);
                } else {
                    stageList.push({
                        _id: `stage_${stageName.replace(/\s+/g, '_').toLowerCase()}`,
                        name: stageName,
                        isPlaceholder: true
                    });
                }
            });

            setModules(stageList);
            setStudents(studentsRes.data.students);
        } catch (error) {
            console.error('Error fetching Kanban data:', error);
            toast.error('Failed to load progress board');
        } finally {
            setLoading(false);
        }
    }, [selectedBrand]);

    useEffect(() => {
        if (selectedBrand) {
            fetchData();
        }
    }, [selectedBrand, fetchData]);

    const handleDrop = async (studentId, moduleId, forcedData = null) => {
        try {
            const student = students.find(s => s._id === studentId);

            // CHECK FOR RESCHEDULING OR MOVE-AWAY
            const isMovingAway = student?.currentModule && student.currentModule !== moduleId;
            const isRescheduling = student?.completedModules?.includes(moduleId);

            if ((isMovingAway || isRescheduling) && !forcedData) {
                setConfirmationModal({
                    open: true,
                    data: { studentId, moduleId }
                });
                return;
            }

            // Optimistic local update
            const updatedStudents = students.map(s =>
                s._id === studentId ? { ...s, currentModule: moduleId === 'pending' ? null : moduleId } : s
            );
            setStudents(updatedStudents);

            const response = await axios.post(`${API}/students/${studentId}/update-module`, {
                moduleId: moduleId === 'pending' ? null : moduleId,
                previousModuleStatus: forcedData?.status,
                remark: forcedData?.remark
            });

            // If we dropped into a placeholder, the backend might have created a real module.
            // We update our local state to match the server's state without a full fetchData() to preserve scroll.
            if (response.data.student) {
                const s = response.data.student;
                const newModuleId = s.currentModule;

                // If it was a placeholder drop, the backend returns the converted module in response.data.newModule
                if (moduleId && moduleId.startsWith('stage_') && response.data.newModule) {
                    const newMod = response.data.newModule;
                    setModules(prev => prev.map(m => m._id === moduleId ? newMod : m));
                }

                setStudents(prev => prev.map(p => p._id === studentId ? { ...p, ...s } : p));
            }

            toast.success('Progress updated', { autoClose: 1000, hideProgressBar: true });
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to move student');
            fetchData();
        }
    };

    const handleOpenDetails = (student) => {
        // Find if the student management page has a way to directly deep link to profile or just use navigate
        // For now, toast or navigate if we have a specific profile route
        toast.info(`Viewing ${student.fullName}'s profile...`);
    };

    const filteredStudents = students.filter(s =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!selectedBrand) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="text-center max-w-sm">
                    <div className="size-16 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center mx-auto mb-6">
                        <Filter className="size-8 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-black dark:text-white mb-3 tracking-tight">Select a Brand</h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">Choose a brand from the top navigation to initialize the progress board.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full min-w-0 overflow-hidden">
            <PageMeta title="Student Pipeline | CRM" />

            <PageBreadcrumb
                pageTitle="Student Pipeline"
                items={[
                    { name: 'Student Management', path: '/manage-students' },
                    { name: 'Student Pipeline' }
                ]}
            />

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto flex-grow max-w-5xl">
                        <div className="relative w-64">
                            <Input
                                type="text"
                                placeholder="Search by name, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Efficiency Stats - Pill-Style Grouped Layout */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 h-10 shadow-sm">
                                <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">
                                    Total Students:
                                </span>
                                <span className="font-black text-gray-800 dark:text-white text-[15px] tabular-nums leading-none">
                                    {students.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-5 px-5 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500 shadow-sm" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[9px]">
                                            Batched:
                                        </span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-[14px] tabular-nums leading-none">
                                            {students.filter(s => s.batchScheduled).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500 shadow-sm" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[9px]">
                                            Pending:
                                        </span>
                                        <span className="font-black text-blue-950 dark:text-amber-400 text-[14px] tabular-nums leading-none">
                                            {students.filter(s => !s.batchScheduled).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Isolated Kanban Area with Auto-Scroll */}
                <div className="flex-1 relative w-full min-h-0 bg-gray-50/10 dark:bg-black/10 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <AutoScrollContainer>
                            <div className="inline-flex h-full items-stretch p-4 gap-4 min-w-max">
                                {modules.map((stage) => (
                                    <div key={stage._id} className="w-[300px] flex-shrink-0 h-full flex flex-col">
                                        <div className="bg-white dark:bg-white/[0.02] border border-gray-400 dark:border-gray-800 shadow-sm h-full flex flex-col overflow-hidden hover:border-blue-950/20 transition-all duration-300">
                                            <DroppableStageColumn
                                                stage={stage}
                                                allModules={modules}
                                                students={filteredStudents.filter(s =>
                                                    (stage._id === 'pending' && (!s.currentModule || s.currentModule === 'pending')) ||
                                                    (s.currentModule === stage._id)
                                                )}
                                                onDrop={handleDrop}
                                                onOpenDetails={handleOpenDetails}
                                                onOpenHistory={(s) => setHistoryModal({ open: true, student: s })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AutoScrollContainer>
                    )}
                </div>
            </div>

            <StudentHistoryModal
                isOpen={historyModal.open}
                student={historyModal.student}
                onClose={() => setHistoryModal({ open: false, student: null })}
            />

            <DropConfirmationModal
                isOpen={confirmationModal.open}
                onClose={() => setConfirmationModal({ open: false, data: null })}
                student={students.find(s => s._id === confirmationModal.data?.studentId)}
                targetModuleId={confirmationModal.data?.moduleId}
                allModules={modules}
                onConfirm={({ status, remark }) => {
                    const { studentId, moduleId } = confirmationModal.data;
                    handleDrop(studentId, moduleId, { status, remark });
                    setConfirmationModal({ open: false, data: null });
                }}
            />


            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                    display: block !important;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1; /* slate-300 */
                    border-radius: 0px;
                    border: 3px solid transparent;
                    background-clip: content-box;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155; /* slate-700 */
                    background-clip: content-box;
                    border: 3px solid transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8; /* slate-400 */
                    background-clip: content-box;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569; /* slate-600 */
                    background-clip: content-box;
                }
            `}} />
        </div>
    );
}
