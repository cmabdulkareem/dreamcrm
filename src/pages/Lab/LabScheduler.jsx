import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { labService } from '../../services/labService';
import { PlusIcon, PencilIcon, TrashBinIcon, AlertIcon } from '../../icons';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { isManager, isAnyManager, isAdmin as checkAdmin, hasRole } from '../../utils/roleHelpers';

const ItemTypes = {
    PC: 'pc'
};

const STATUS_CONFIG = {
    available: { label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', iconColor: 'text-green-500' },
    'in-use': { label: 'In Use', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400', dot: 'bg-blue-500', iconColor: 'text-blue-500' },
    maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/10 dark:text-yellow-400', dot: 'bg-yellow-500', iconColor: 'text-yellow-500' },
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

// [startHour, startMin, endHour, endMin]
const SLOT_TIMES = {
    "Early AM": [9, 0, 10, 30],
    "Late AM": [10, 30, 12, 0],
    "Midday": [12, 0, 13, 30],
    "Early PM": [14, 0, 15, 30],
    "Late PM": [15, 30, 17, 0],
};

const getEffectiveStatus = (pc, todaySlots) => {
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
    if (bookedNow) return 'in-use';
    // Don't inherit 'in-use' from DB — that's set by backend when booking, but
    // real-time occupancy is determined solely by the current slot window above.
    const storedStatus = pc.status || 'available';
    return storedStatus === 'in-use' ? 'available' : storedStatus;
};

const PCSeat = ({ pc, cfg, todaySlots, inUse, onAssign, onEdit, onDelete, onMovePC, onComplaint }) => {
    const [showMobileActions, setShowMobileActions] = useState(false);
    const actionRef = useRef(null);

    // Close mobile actions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionRef.current && !actionRef.current.contains(event.target)) {
                setShowMobileActions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.PC,
        item: { id: pc._id, row: pc.row, position: pc.position },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [pc]);

    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeout = useRef(null);

    const handleMouseEnter = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setIsHovered(false);
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
                ${isHovered || showMobileActions ? 'z-[500]' : 'z-10'}
                ${isOver ? 'scale-110 rotate-1' : ''}
            `}
            onClick={() => {
                // If on mobile (no hover usually), first click shows actions
                if (window.matchMedia("(max-width: 768px)").matches && !showMobileActions) {
                    setShowMobileActions(true);
                } else {
                    onAssign(pc);
                }
            }}
        >
            <div
                className={`w-20 h-24 rounded-xl border-2 flex flex-col items-center justify-between p-2.5 shadow-sm transition-all duration-200
                    ${inUse ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'}
                    ${isOver ? 'border-brand-500 shadow-brand-200 dark:shadow-brand-900/20 ring-4 ring-brand-500/10' : ''}
                    hover:shadow-lg hover:scale-105 cursor-pointer relative 
                `}
            >
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-tight truncate max-w-full px-1">{primaryLabel}</span>
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

                {/* Smart Tooltip: Flipped to bottom for Row A, top for others */}
                {isHovered && (
                    <div
                        className={`absolute ${pc.row === 'A' ? 'top-full mt-3' : 'bottom-full mb-3'} left-1/2 -translate-x-1/2 w-80 bg-gray-900/95 dark:bg-black/95 backdrop-blur-md text-white text-xs p-5 rounded-2xl z-[510] border border-white/10 ring-1 ring-white/10 pointer-events-auto`}
                        onMouseEnter={handleMouseEnter}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-black text-brand-400 text-sm tracking-tighter uppercase">{primaryLabel}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                        </div>

                        <p className="text-gray-400 text-[10px] italic mb-4 opacity-80">"{pc.specs || 'Standard Specification'}"</p>

                        {todaySlots.length > 0 && (
                            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2.5 mb-4 pr-1">
                                {todaySlots.map((s, i) => (
                                    <div key={i} className="flex flex-col gap-1 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-3 rounded-xl transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="text-brand-500 font-extrabold uppercase text-[9px] tracking-tight">{s.timeSlot}</span>
                                            <span className="text-white font-black text-[11px]">{s.studentName}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <div className="w-1 h-3 rounded-full bg-brand-500/50" />
                                            <span className="text-gray-300 text-[10px] truncate italic">{s.purpose}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center text-[11px] font-black pt-3 border-t border-white/10 uppercase tracking-widest opacity-90">
                            <span className="text-gray-500">{cfg.label}</span>
                            <span className="text-brand-400">{todaySlots.length} / 5</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons: Flipped for Row A to prevent collision. Shown on hover (desktop) or toggle (mobile) */}
            {(isHovered || showMobileActions) && (
                <div
                    ref={actionRef}
                    className={`absolute ${pc.row === 'A' ? '-top-10 md:-top-6' : '-bottom-10 md:-bottom-6'} left-1/2 -translate-x-1/2 flex gap-2.5 md:gap-1.5 bg-white dark:bg-gray-800 shadow-2xl md:shadow-xl border border-gray-100 dark:border-gray-700 p-2 md:p-1.5 rounded-2xl md:rounded-xl z-[520] transition-all`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={(e) => { e.stopPropagation(); onComplaint(pc); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-500 rounded-xl md:rounded-lg transition-colors" title="Raise Complaint">
                        <AlertIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(pc); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl md:rounded-lg text-gray-500 transition-colors" title="Edit PC">
                        <PencilIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(pc._id, pc.row, pc.position); setShowMobileActions(false); }} className="p-3 md:p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 rounded-xl md:rounded-lg transition-colors" title="Delete PC">
                        <TrashBinIcon className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                </div>
            )}
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
                    ${isOver ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-brand-500 hover:border-brand-500'}
                `}
            >
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <span className="text-[11px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">{seatId}</span>
                    <PlusIcon className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[9px] font-bold uppercase tracking-tight opacity-40 group-hover:opacity-100">Add Unit</span>
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

const RowContainer = ({ row, pcsInRow, emptySlotsInRow, onMovePC, onQuickAdd, onEditRow, onDeleteRow, renderPC, renderSlot }) => {
    const rowName = row.name;

    const pcPositions = new Set(pcsInRow.map(p => p.position));
    const filteredSlots = emptySlotsInRow.filter(s => !pcPositions.has(s.position));

    const allItems = [
        ...pcsInRow.map(p => ({ ...p, type: 'pc' })),
        ...filteredSlots.map(s => ({ ...s, type: 'slot' }))
    ].sort((a, b) => a.position - b.position);

    return (
        <div
            className={`relative flex items-center gap-10 px-6 py-2 transition-all duration-300 min-h-[120px] hover:z-[100] group/row`}
        >
            <div className="sticky left-0 w-24 shrink-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50 py-4 -ml-6 pl-6 group/rowheader">
                <span className="text-3xl font-black text-gray-300 dark:text-gray-700 uppercase tracking-tighter leading-none">{rowName}</span>
                <div className="w-8 h-1 rounded-full bg-gray-100 dark:bg-gray-800 mt-2 opacity-50" />

                <div className="flex gap-1 mt-3 opacity-0 group-hover/rowheader:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEditRow(row)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 hover:text-brand-500 transition-colors"
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
                <div className="grid grid-cols-11 gap-x-4 gap-y-12 min-w-max pr-10">
                    {allItems.map(item => (
                        item.type === 'pc' ? renderPC(item) : renderSlot(item)
                    ))}

                    <button
                        onClick={() => onQuickAdd(rowName)}
                        className="w-20 h-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-300 hover:text-brand-400 hover:border-brand-200 dark:hover:border-brand-900 transition-all group shrink-0"
                        title={`Add Slot to Section ${rowName}`}
                    >
                        <PlusIcon className="w-5 h-5 opacity-20 group-hover:opacity-100" />
                    </button>
                </div>
            </div>
        </div>
    );
};

function ArrangementContent() {
    const { user, selectedBrand } = useAuth();
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
    const [labForm, setLabForm] = useState({ name: '', description: '', location: '', brands: [] });
    const [editingLab, setEditingLab] = useState(null);
    const [labLoading, setLabLoading] = useState(false);

    // Queue State
    const [queue, setQueue] = useState([]);
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [queueForm, setQueueForm] = useState({ studentName: '', purpose: '', batchPreference: 'Early AM' });
    const [isQueueSyncing, setIsQueueSyncing] = useState(false);
    const [showQueueHistory, setShowQueueHistory] = useState(false);
    const [activeSearchSlot, setActiveSearchSlot] = useState(null);

    // Complaint State
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

    const normalizeRow = (r) => r?.replace(/Row\s+/i, '').trim().toUpperCase() || 'A';

    const fetchAll = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const [pcData, schedData, rowData, queueData] = await Promise.all([
                labService.getPCs(selectedLabId),
                labService.getSchedules({ date: today, labId: selectedLabId }),
                labService.getRows(selectedLabId),
                labService.getQueue(selectedLabId, showQueueHistory) // Pass history toggle
            ]);
            setPCs(pcData.map(p => ({ ...p, row: normalizeRow(p.row) })));
            setSchedules(schedData);
            setRows(rowData);
            setQueue(queueData);

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
        } catch (e) {
            console.error(e);
        } finally {
            if (isInitial) setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSavePC = async (e) => {
        e.preventDefault();
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

                    await Promise.all([
                        labService.updatePC(sourceId, newSourceCoords),
                        labService.updatePC(targetPC._id, oldSourceCoords)
                    ]);
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

    const openManageModal = (pc) => {
        // Build slotForms from existing bookings for this PC today
        const existing = pcSchedules(pc._id);
        const forms = {};
        TIME_SLOTS.forEach(slot => {
            const match = existing.find(s => s.timeSlot === slot);
            forms[slot] = {
                studentName: match?.studentName || '',
                purpose: match?.purpose || '',
                existingId: match?._id || null,
                queueId: match?.queueItem || null, // Load existing link if present
                toDelete: false,
            };
        });
        setSlotForms(forms);
        setSelectedPC(pc);
        setScheduleForm({ ...emptySchedule, date: today });
        setShowScheduleModal(true);
    };

    const handleUpdateSlots = async (e) => {
        e.preventDefault();
        try {
            const promises = [];

            for (const slot of TIME_SLOTS) {
                const f = slotForms[slot];
                if (!f) continue;

                if (f.toDelete && f.existingId) {
                    promises.push(labService.deleteSchedule(f.existingId));
                } else if (!f.toDelete && f.studentName.trim()) {
                    // Fallback: If no queueId but name matches a waitlist entry exactly (case-insensitive), auto-link it
                    let finalQueueId = f.queueId;
                    if (!finalQueueId) {
                        const match = queue.find(q =>
                            q.status === 'waiting' &&
                            q.studentName.trim().toLowerCase() === f.studentName.trim().toLowerCase()
                        );
                        if (match) finalQueueId = match._id;
                    }

                    if (!f.existingId) {
                        // New booking
                        promises.push(labService.addSchedule({
                            pc: selectedPC._id,
                            studentName: f.studentName.trim(),
                            purpose: f.purpose,
                            date: today,
                            timeSlot: slot,
                            queueItem: finalQueueId || null
                        }));
                    } else {
                        // Update existing booking
                        promises.push(labService.updateSchedule(f.existingId, {
                            studentName: f.studentName.trim(),
                            purpose: f.purpose,
                            queueItem: finalQueueId || undefined
                        }));
                    }
                }
            }

            await Promise.all(promises);

            toast.success('Slots updated!');
            setShowScheduleModal(false);
            fetchAll();
        } catch (e) {
            toast.error(e.message || 'Failed to update slots');
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

    const handleAddToQueue = async (e) => {
        e.preventDefault();
        if (!selectedLabId) return;
        try {
            await labService.addToQueue({ ...queueForm, labId: selectedLabId });
            setShowQueueModal(false);
            setQueueForm({ studentName: '', purpose: '', batchPreference: 'Early AM' });
            fetchAll();
        } catch (e) {
            toast.error(e.message || "Failed to add to queue");
        }
    };

    const handleRemoveFromQueue = async (id) => {
        try {
            await labService.removeFromQueue(id);
            fetchAll();
        } catch (e) {
            toast.error("Failed to remove from queue");
        }
    };

    const handleSaveLab = async (e) => {
        e.preventDefault();
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

    const handleSaveComplaint = async (e) => {
        e.preventDefault();
        if (!complaintForm.pcId || !complaintForm.title.trim()) return;
        setSavingComplaint(true);
        try {
            await labService.addComplaint(complaintForm);
            setShowComplaintModal(false);
            setComplaintForm(emptyComplaintForm);
        } catch (e) {
            toast.error(e.message || "Failed to raise complaint");
        } finally {
            setSavingComplaint(false);
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
            <PageMeta title="Lab Scheduler | DreamCRM" />
            <PageBreadcrumb
                pageTitle="Lab Arrangement"
                items={[
                    { name: 'Home', path: '/' },
                    { name: 'Compute Lab', path: '/compute-lab' },
                    { name: 'Arrangement' }
                ]}
            />

            <div className="space-y-6 relative z-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm relative z-30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-900 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                                {labs.map(lab => (
                                    <button
                                        key={lab._id}
                                        onClick={() => setSelectedLabId(lab._id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap
                                            ${selectedLabId === lab._id
                                                ? 'bg-white dark:bg-gray-800 text-brand-500 shadow-sm border border-gray-100 dark:border-gray-700'
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {lab.name}
                                    </button>
                                ))}
                                <button
                                    onClick={handleAddLabButtonClick}
                                    className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
                                    title="Add New Laboratory"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {canManageLab && selectedLabId && labs.find(l => l._id === selectedLabId) && (
                                <div className="flex items-center gap-2 pr-4 border-r border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => onEditLab(labs.find(l => l._id === selectedLabId))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/1 rounded-xl transition-all"
                                        title="Edit Laboratory"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLab(selectedLabId)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                        title="Delete Laboratory"
                                    >
                                        <TrashBinIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            {canManageWorkstations && (
                                <Button
                                    onClick={() => {
                                        setEditingPC(null);
                                        setPCForm(emptyPC);
                                        setIsQuickAdd(false);
                                        setShowPCModal(true);
                                    }}
                                    className="rounded-xl px-5 h-[40px] shadow-lg shadow-brand-500/10 text-xs font-bold uppercase tracking-wider"
                                    disabled={!selectedLabId}
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" />
                                    New Workstation
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <ComponentCard title="" desc="">
                    <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 min-h-[400px] relative z-10">
                        {/* Lab Header & Queue */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-50 dark:border-gray-800/50">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-2 h-6 bg-brand-500 rounded-full" />
                                    {labs.find(l => l._id === selectedLabId)?.name || "Laboratory"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 pl-4 border-l-2 border-gray-100 dark:border-gray-800 ml-1">
                                    {labs.find(l => l._id === selectedLabId)?.location || "Workstation Scheduling"}
                                </p>
                            </div>

                            <div className="flex-1 max-w-2xl">
                                {(() => {
                                    const globallyAssignedQueueIds = schedules
                                        .filter(s => s.date.split('T')[0] === today)
                                        .map(s => s.queueItem)
                                        .filter(Boolean);

                                    const activeWaitlist = queue.filter(q => q.status === 'waiting' && !globallyAssignedQueueIds.includes(q._id));

                                    return (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-1.5 invite-avatars">
                                                    {activeWaitlist.slice(0, 4).map((q, i) => {
                                                        const colors = [
                                                            'bg-brand-100 text-brand-600',
                                                            'bg-purple-100 text-purple-600',
                                                            'bg-blue-100 text-blue-600',
                                                            'bg-amber-100 text-amber-600'
                                                        ];
                                                        const colorClass = colors[i % colors.length];
                                                        return (
                                                            <div
                                                                key={q._id}
                                                                className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 ${colorClass} flex items-center justify-center text-[10px] font-bold shadow-sm ring-1 ring-black/5`}
                                                                title={q.studentName}
                                                            >
                                                                {q.studentName.charAt(0)}
                                                            </div>
                                                        );
                                                    })}
                                                    {activeWaitlist.length > 4 && (
                                                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500 shadow-sm ring-1 ring-black/5">
                                                            +{activeWaitlist.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-gray-900 dark:text-gray-100 leading-tight">
                                                        {showQueueHistory ? 'Queue History' : 'Live Waitlist'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-brand-500/80 uppercase tracking-tighter">
                                                        {showQueueHistory ? queue.length : activeWaitlist.length} Students
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setShowQueueHistory(!showQueueHistory);
                                                        // Trigger fetch with new history state
                                                        setTimeout(() => fetchAll(), 0);
                                                    }}
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showQueueHistory
                                                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                                        : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {showQueueHistory ? 'Show Active' : 'History'}
                                                </button>
                                                {!showQueueHistory && (
                                                    <button
                                                        onClick={() => setShowQueueModal(true)}
                                                        className="w-8 h-8 flex items-center justify-center bg-brand-500 text-white rounded-lg hover:scale-105 transition-transform shadow-lg shadow-brand-500/20"
                                                        title="Add to Waitlist"
                                                    >
                                                        <PlusIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 px-1">
                                {(() => {
                                    const globallyAssignedQueueIds = schedules
                                        .filter(s => s.date.split('T')[0] === today)
                                        .map(s => s.queueItem)
                                        .filter(Boolean);

                                    const filteredQueue = showQueueHistory
                                        ? queue.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        : queue.filter(q => q.status === 'waiting' && !globallyAssignedQueueIds.includes(q._id));

                                    if (filteredQueue.length === 0) {
                                        return (
                                            <div className="flex items-center gap-2 px-2 py-3 bg-white/40 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 w-full justify-center">
                                                <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                                                <p className="text-[10px] text-gray-400 font-medium tracking-tight">Waitlist is empty...</p>
                                            </div>
                                        );
                                    }

                                    return filteredQueue.map(item => {
                                        const statusColors = {
                                            waiting: 'bg-brand-500',
                                            assigned: 'bg-blue-500',
                                            completed: 'bg-green-500',
                                            cancelled: 'bg-gray-400'
                                        };
                                        const statusColor = statusColors[item.status] || 'bg-brand-500';

                                        return (
                                            <div
                                                key={item._id}
                                                className="group relative bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 rounded-xl px-3.5 py-2.5 flex items-center gap-3 shrink-0 hover:border-brand-300 dark:hover:border-brand-500/30 hover:shadow-md transition-all duration-300 cursor-default"
                                            >
                                                <div className="relative">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-[11px] font-black text-gray-400 group-hover:text-brand-500 transition-colors">
                                                        {item.studentName.charAt(0)}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${statusColor} border-2 border-white dark:border-gray-800 rounded-full`} title={item.status} />
                                                </div>
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 truncate max-w-[110px] tracking-tight">{item.studentName}</p>
                                                    <div className="flex items-center gap-1.5 max-w-[110px]">
                                                        <span className="text-[9px] text-brand-500 font-black uppercase tracking-tighter shrink-0">{item.batchPreference}</span>
                                                        <span className="text-[9px] text-gray-400 truncate opacity-70 italic">{item.purpose}</span>
                                                    </div>
                                                </div>
                                                {item.status === 'waiting' && !showQueueHistory && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveFromQueue(item._id); }}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
                                                        title="Remove from Waitlist"
                                                    >
                                                        <span className="text-xs">×</span>
                                                    </button>
                                                )}
                                                {showQueueHistory && (
                                                    <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity pl-2 border-l border-gray-50 dark:border-gray-700">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase leading-none tracking-tighter">{item.status}</span>
                                                        <span className="text-[7px] text-gray-300 dark:text-gray-600 font-medium">
                                                            {new Date(item.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 'Earlier'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="size-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                                <p className="text-gray-400 font-medium animate-pulse">Syncing environment arrangement...</p>
                            </div>
                        ) : (visibleRowNames.length === 0) ? (
                            <div className="text-center py-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                                <MonitorIcon className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-800 mb-6" />
                                <p className="text-gray-500 font-semibold mb-2">No workstations mapped yet</p>
                                <p className="text-gray-400 text-sm mb-8">Start by creating your first section.</p>
                                <Button variant="primary" size="sm" onClick={handleAddNewRowButtonClick} disabled={!selectedLabId}>
                                    Create Section A
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto no-scrollbar -mx-8 px-8 pb-32 relative">
                                {refreshing && (
                                    <div className="absolute inset-0 z-50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[1px] flex items-start justify-center pt-20">
                                        <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-full px-4 py-2 flex items-center gap-2 animate-bounce">
                                            <div className="size-2 bg-brand-500 rounded-full animate-ping" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Refreshing...</span>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-0 min-w-max pt-10">
                                    {visibleRowNames.map((rowName) => (
                                        <RowContainer
                                            key={rowName}
                                            row={rows.find(r => normalizeRow(r.name) === rowName) || { name: rowName }}
                                            pcsInRow={rowsMap[rowName] || []}
                                            emptySlotsInRow={slotsMap[rowName] || []}
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
                                                const effectiveStatus = getEffectiveStatus(pc, todaySlots);
                                                const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.available;
                                                const inUse = effectiveStatus === 'in-use';
                                                return (
                                                    <PCSeat
                                                        key={pc._id}
                                                        pc={pc}
                                                        cfg={cfg}
                                                        todaySlots={todaySlots}
                                                        inUse={inUse}
                                                        onAssign={() => openManageModal(pc)}
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
                                    ))}

                                    {canManageWorkstations && (
                                        <div className="pt-12 flex justify-center">
                                            <button
                                                onClick={handleAddNewRowButtonClick}
                                                className="flex items-center gap-2.5 px-8 py-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-black text-gray-500 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/1 transition-all uppercase tracking-widest group shadow-sm hover:shadow-md"
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
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{cfg.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ComponentCard>
            </div>

            {
                showPCModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/10">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {editingPC ? 'Edit Workstation' : 'New Workstation'}
                                </h2>
                                {isQuickAdd && (
                                    <p className="text-xs font-bold text-brand-500 mt-2 uppercase tracking-widest">Initializing: Seat {pcForm.row}{pcForm.position + 1}</p>
                                )}
                            </div>

                            <form onSubmit={handleSavePC} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Workstation Name</label>
                                        <input
                                            required
                                            value={pcForm.pcNumber}
                                            onChange={e => setPCForm({ ...pcForm, pcNumber: e.target.value.toLowerCase() })}
                                            className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                            placeholder="e.g. cc-01"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                                        <select
                                            value={pcForm.status}
                                            onChange={e => setPCForm({ ...pcForm, status: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none bg-no-repeat bg-[right_1rem_center] bg-select-arrow"
                                        >
                                            <option value="available">Working</option>
                                            <option value="maintenance">Repairing</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Installed Softwares</label>
                                    <textarea
                                        value={pcForm.softwares || ''}
                                        onChange={e => setPCForm({ ...pcForm, softwares: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm outline-none h-20 resize-none font-medium"
                                        placeholder="e.g. AutoCAD, Photoshop, MATLAB"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Separate software names with commas</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Hardware Specification</label>
                                    <textarea value={pcForm.specs} onChange={e => setPCForm({ ...pcForm, specs: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm outline-none h-20 resize-none" placeholder="e.g. 16GB RAM, RTX 3060, 512GB SSD" />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 rounded-xl py-3.5" onClick={() => setShowPCModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 rounded-xl py-3.5">
                                        {editingPC ? 'Save Changes' : 'Create Workstation'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showScheduleModal && selectedPC && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/10">
                            <div className="mb-8 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Manage Users</h2>
                                    <p className="text-xs font-bold text-brand-500 mt-1.5 uppercase tracking-widest">
                                        {selectedPC.pcNumber || `${selectedPC.row}${selectedPC.position + 1}`}
                                        {selectedPC.label ? ` — ${selectedPC.label}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setShowScheduleModal(false); }}
                                    className="w-9 h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors text-gray-500 text-lg font-bold"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="grid grid-cols-[120px_1fr_1fr_32px] gap-3 mb-2 px-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Slot</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Software</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</span>
                                <span />
                            </div>

                            {(() => {
                                const currentlyAssignedQueueIds = Object.values(slotForms).map(f => f.queueId).filter(Boolean);

                                return (
                                    <form onSubmit={handleUpdateSlots} className="space-y-2.5">
                                        {TIME_SLOTS.map(slot => {
                                            const f = slotForms[slot] || {};
                                            const isBooked = !!f.existingId && !f.toDelete;
                                            const isDeleting = f.toDelete;
                                            return (
                                                <div
                                                    key={slot}
                                                    className={`grid grid-cols-[120px_1fr_1fr_32px] gap-3 items-center p-2 rounded-xl transition-colors ${isDeleting
                                                        ? 'bg-red-50 dark:bg-red-900/10 opacity-50'
                                                        : isBooked
                                                            ? 'bg-blue-50 dark:bg-blue-900/10'
                                                            : 'bg-gray-50 dark:bg-gray-900/50'
                                                        }`}
                                                >
                                                    <span className={`text-sm font-bold ${isBooked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{slot}</span>

                                                    <select
                                                        value={f.purpose || ''}
                                                        onChange={e => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], purpose: e.target.value } }))}
                                                        disabled={isDeleting}
                                                        className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none font-medium appearance-none disabled:opacity-50"
                                                    >
                                                        <option value="">— Software —</option>
                                                        {(selectedPC?.softwares || []).map(sw => (
                                                            <option key={sw} value={sw}>{sw}</option>
                                                        ))}
                                                    </select>

                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Student name"
                                                            value={f.studentName || ''}
                                                            onFocus={() => setActiveSearchSlot(slot)}
                                                            onBlur={() => setTimeout(() => setActiveSearchSlot(null), 200)}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setSlotForms(prev => ({
                                                                    ...prev,
                                                                    [slot]: { ...prev[slot], studentName: val, queueId: null }
                                                                }));
                                                            }}
                                                            disabled={isDeleting}
                                                            className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none font-medium disabled:opacity-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                                                        />

                                                        {activeSearchSlot === slot && f.studentName && f.studentName.length > 0 && !f.queueId && (
                                                            <div className="absolute z-[1100] top-full mt-1.5 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                {queue
                                                                    .filter(q =>
                                                                        q.status === 'waiting' &&
                                                                        !currentlyAssignedQueueIds.includes(q._id) &&
                                                                        q.studentName.toLowerCase().includes(f.studentName.toLowerCase())
                                                                    )
                                                                    .slice(0, 5)
                                                                    .map(q => (
                                                                        <button
                                                                            key={q._id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSlotForms(prev => ({
                                                                                    ...prev,
                                                                                    [slot]: {
                                                                                        ...prev[slot],
                                                                                        studentName: q.studentName,
                                                                                        purpose: q.purpose,
                                                                                        queueId: q._id
                                                                                    }
                                                                                }));
                                                                                setActiveSearchSlot(null);
                                                                            }}
                                                                            className="w-full text-left px-3.5 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-500/10 flex items-center justify-between group transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700/50"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{q.studentName}</p>
                                                                                <p className="text-[9px] text-gray-400 font-medium truncate opacity-70 group-hover:text-brand-500/80 transition-colors uppercase tracking-tight">{q.batchPreference} • {q.purpose || 'General Use'}</p>
                                                                            </div>
                                                                            <div className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-500/5 flex items-center justify-center text-[10px] text-brand-500 font-black scale-0 group-hover:scale-100 transition-transform">
                                                                                +
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                {queue.filter(q => q.status === 'waiting' && !currentlyAssignedQueueIds.includes(q._id) && q.studentName.toLowerCase().includes(f.studentName.toLowerCase())).length === 0 && (
                                                                    <div className="px-3.5 py-3 text-center">
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No matches in waitlist</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {f.existingId ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], toDelete: !prev[slot].toDelete } }))}
                                                            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${isDeleting
                                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300'
                                                                : 'bg-red-100 dark:bg-red-900/20 text-red-500 hover:bg-red-200'
                                                                }`}
                                                        >
                                                            {isDeleting ? '↩' : '×'}
                                                        </button>
                                                    ) : <span />}
                                                </div>
                                            );
                                        })}

                                        {/* Waitlist Integration in Modal */}
                                        {queue.filter(q => q.status === 'waiting' && !currentlyAssignedQueueIds.includes(q._id)).length > 0 && (
                                            <div className="mt-8 p-6 bg-gray-50/80 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-800/60 backdrop-blur-sm">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2.5">
                                                    <div className="w-1.5 h-3.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(var(--color-brand-500),0.4)]" />
                                                    Assign from Waitlist
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    {queue
                                                        .filter(q => q.status === 'waiting' && !currentlyAssignedQueueIds.includes(q._id))
                                                        .map(q => (
                                                            <button
                                                                key={q._id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const nextEmptySlot = TIME_SLOTS.find(s => !slotForms[s]?.studentName);
                                                                    if (nextEmptySlot) {
                                                                        setSlotForms(prev => ({
                                                                            ...prev,
                                                                            [nextEmptySlot]: {
                                                                                ...prev[nextEmptySlot],
                                                                                studentName: q.studentName,
                                                                                purpose: q.purpose,
                                                                                queueId: q._id
                                                                            }
                                                                        }));
                                                                    }
                                                                }}
                                                                className="group text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-brand-400 dark:hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 relative overflow-hidden"
                                                            >
                                                                <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-brand-500/10 transition-colors" />
                                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5 truncate relative z-10">{q.studentName}</p>
                                                                <div className="flex items-center gap-2 relative z-10">
                                                                    <span className="text-[9px] font-black text-brand-500 uppercase tracking-tighter shrink-0">{q.batchPreference}</span>
                                                                    <span className="text-[9px] text-gray-400 truncate italic opacity-80">{q.purpose}</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                </div>
                                                <p className="mt-4 text-[9px] text-gray-400 font-medium italic text-center opacity-60">Waitlisted students will be auto-filled into available time slots.</p>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                            <Button type="submit" className="px-10 rounded-xl py-3">Update</Button>
                                        </div>
                                    </form>
                                );
                            })()}
                        </div>
                    </div>
                )
            }

            {/* Student Queue Modal */}
            {showQueueModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/10">
                        <div className="mb-8 flex justify-between items-start">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Waitlist Student</h2>
                            <button onClick={() => setShowQueueModal(false)} className="text-gray-400 hover:text-gray-600 transition-all text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleAddToQueue} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Student Name</label>
                                <input
                                    required
                                    value={queueForm.studentName}
                                    onChange={e => setQueueForm({ ...queueForm, studentName: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                    placeholder="Enter full name..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Purpose / Software</label>
                                <input
                                    value={queueForm.purpose}
                                    onChange={e => setQueueForm({ ...queueForm, purpose: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none"
                                    placeholder="e.g. Photoshop Research"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Time Slot Preference</label>
                                <select
                                    value={queueForm.batchPreference}
                                    onChange={e => setQueueForm({ ...queueForm, batchPreference: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none"
                                >
                                    {["Early AM", "Late AM", "Midday", "Early PM", "Late PM"].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" className="flex-1 rounded-xl py-3.5" onClick={() => setShowQueueModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-xl py-3.5">Add to Waitlist</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {
                showRowModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/10">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {editingRow ? 'Edit Section' : 'New Section'}
                                </h2>
                            </div>
                            <form onSubmit={handleSaveRow} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Section Name (Letter)</label>
                                    <input
                                        required
                                        value={rowForm.name}
                                        onChange={e => setRowForm({ ...rowForm, name: e.target.value.toUpperCase() })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder="e.g. A"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 rounded-xl py-3.5" onClick={() => setShowRowModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 rounded-xl py-3.5">Save Section</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showLabModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/10">
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                                    {editingLab ? 'Edit Laboratory' : 'New Laboratory'}
                                </h2>
                            </div>
                            <form onSubmit={handleSaveLab} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Laboratory Name</label>
                                    <input
                                        required
                                        value={labForm.name}
                                        onChange={e => setLabForm({ ...labForm, name: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder="e.g. Computing Lab 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Location / Description</label>
                                    <input
                                        value={labForm.location}
                                        onChange={e => setLabForm({ ...labForm, location: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                                        placeholder="e.g. 3rd Floor, West Wing"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Associated Brands</label>
                                    <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 max-h-40 overflow-y-auto">
                                        {(user?.brands || []).map(b => {
                                            const bId = (b.brand?._id || b.brand || b).toString();
                                            const bName = b.brand?.name || "Unknown Brand";
                                            const isSelected = labForm.brands?.includes(bId);
                                            return (
                                                <label key={bId} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newBrands = e.target.checked
                                                                ? [...(labForm.brands || []), bId]
                                                                : (labForm.brands || []).filter(id => id !== bId);
                                                            setLabForm({ ...labForm, brands: newBrands });
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                                    />
                                                    <span className={`text-xs font-bold transition-colors ${isSelected ? 'text-brand-500' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                                                        {bName}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 rounded-xl py-3.5" onClick={() => setShowLabModal(false)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 rounded-xl py-3.5">Save Laboratory</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Raise Complaint Modal */}
            {showComplaintModal && (
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
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Issue Headline *</label>
                                <input required value={complaintForm.title} onChange={e => setComplaintForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g. Hardware Malfunction" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-brand-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Priority Matrix</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button key={p} type="button" onClick={() => setComplaintForm(f => ({ ...f, priority: p }))}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 ${complaintForm.priority === p
                                                ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-brand-300'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Detailed Log</label>
                                <textarea value={complaintForm.description} onChange={e => setComplaintForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3} placeholder="Describe the technical issue in detail..." className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-sm font-medium text-gray-800 dark:text-white outline-none focus:border-brand-500 resize-none transition-all leading-relaxed" />
                            </div>

                            <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <Button variant="outline" className="flex-1" onClick={() => setShowComplaintModal(false)} disabled={savingComplaint}>Abort</Button>
                                <Button type="submit" className="flex-1" disabled={savingComplaint || !complaintForm.title.trim()}>
                                    {savingComplaint ? 'Committing...' : 'Commit Log'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LabScheduler() {
    return (
        <DndProvider backend={HTML5Backend}>
            <ArrangementContent />
        </DndProvider>
    );
}
