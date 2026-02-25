import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import { labService } from '../../services/labService';
import { PlusIcon, PencilIcon, TrashBinIcon } from '../../icons';
import { toast } from 'react-toastify';

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

const emptyPC = { pcNumber: '', label: '', status: 'available', specs: '', location: '', row: 'A', position: 0, notes: '', softwares: [] };
const emptySchedule = { studentName: '', date: '', timeSlot: 'Early AM', purpose: '', notes: '' };

const TIME_SLOTS = ["Early AM", "Late AM", "Midday", "Early PM", "Late PM"];

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

const PCSeat = ({ pc, cfg, todaySlots, inUse, onAssign, onEdit, onDelete, onMovePC }) => {
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
                ${isHovered ? 'z-[500]' : 'z-10'}
                ${isOver ? 'scale-110 rotate-1' : ''}
            `}
        >
            <div
                onClick={() => onAssign(pc)}
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

            {/* Action Buttons: Flipped for Row A to prevent collision */}
            {isHovered && (
                <div
                    className={`absolute ${pc.row === 'A' ? '-top-6' : '-bottom-6'} left-1/2 -translate-x-1/2 flex gap-1.5 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 p-1.5 rounded-xl z-[520]`}
                    onMouseEnter={handleMouseEnter}
                >
                    <button onClick={(e) => { e.stopPropagation(); onEdit(pc); }} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(pc._id, pc.row, pc.position); }} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 rounded-lg transition-colors">
                        <TrashBinIcon className="w-4 h-4" />
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

const RowContainer = ({ rowName, pcsInRow, emptySlotsInRow, onMovePC, onQuickAdd, renderPC, renderSlot }) => {

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
            <div className="sticky left-0 w-16 shrink-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50 py-4 -ml-6 pl-6">
                <span className="text-3xl font-black text-gray-300 dark:text-gray-700 uppercase tracking-tighter leading-none">{rowName}</span>
                <div className="w-8 h-1 rounded-full bg-gray-100 dark:bg-gray-800 mt-2 opacity-50" />
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

    const [emptySlots, setEmptySlots] = useState([]);
    const [rows, setRows] = useState([]);
    const [slotForms, setSlotForms] = useState({});
    // slotForms: { [timeSlot]: { studentName, purpose, existingId|null, toDelete } }

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchAll(true);
    }, []);

    const normalizeRow = (r) => r?.replace(/Row\s+/i, '').trim().toUpperCase() || 'A';

    const fetchAll = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        else setRefreshing(true);

        try {
            const [pcData, schedData, rowData] = await Promise.all([
                labService.getPCs(),
                labService.getSchedules({ date: today }),
                labService.getRows()
            ]);
            setPCs(pcData.map(p => ({ ...p, row: normalizeRow(p.row) })));
            setSchedules(schedData);
            setRows(rowData);

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

        const finalForm = { ...pcForm, row: normalizedRow, softwares: softwareArray };
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
                    if (!f.existingId) {
                        // New booking
                        promises.push(labService.addSchedule({
                            pc: selectedPC._id,
                            studentName: f.studentName.trim(),
                            purpose: f.purpose,
                            date: today,
                            timeSlot: slot,
                        }));
                    }
                    // If existingId and no toDelete → no change needed
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
        const rowPCs = pcs.filter(p => p.row === normalizedRowName);
        const rowSlots = emptySlots.filter(s => s.row === normalizedRowName);
        const allPositions = new Set([...rowPCs.map(p => p.position), ...rowSlots.map(s => s.position)]);

        let firstHole = 0;
        while (allPositions.has(firstHole)) firstHole++;

        try {
            await labService.addEmptySlot({ row: normalizedRowName, position: firstHole });
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

    const handleAddNewRow = async () => {
        const nextRow = getNextRowName();
        try {
            await labService.addRow({ name: nextRow });
            fetchAll();
        } catch (e) {
            toast.error("Failed to add row");
        }
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

            <ComponentCard
                title="Workstation Arrangement"
                desc="Visualize and manage lab seating layout (A1, B2...)"
                action={
                    <div className="flex items-center gap-4">
                        {refreshing && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-brand-500 uppercase tracking-widest animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                                Syncing...
                            </div>
                        )}
                        <Button
                            size="sm"
                            onClick={() => {
                                setPCForm({ ...emptyPC, pcNumber: '', row: 'A' });
                                setEditingPC(null);
                                setIsQuickAdd(false);
                                setShowPCModal(true);
                            }}
                            startIcon={<PlusIcon className="w-4 h-4" />}
                        >
                            New Unit
                        </Button>
                    </div>
                }
            >
                <div className="bg-white dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 min-h-[400px] relative z-10">
                    {loading ? (
                        <div className="text-center py-24 text-gray-400 font-medium animate-pulse">Syncing environment arrangement...</div>
                    ) : (visibleRowNames.length === 0) ? (
                        <div className="text-center py-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                            <MonitorIcon className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-800 mb-6" />
                            <p className="text-gray-500 font-semibold mb-2">No workstations mapped yet</p>
                            <p className="text-gray-400 text-sm mb-8">Start by creating your first section.</p>
                            <Button variant="primary" size="sm" onClick={handleAddNewRow}>
                                Create Section A
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto no-scrollbar -mx-8 px-8 pt-[400px] pb-32 -mt-[400px]">
                            <div className="space-y-0 min-w-max pt-10">
                                {visibleRowNames.map((rowName) => (
                                    <RowContainer
                                        key={rowName}
                                        rowName={rowName}
                                        pcsInRow={rowsMap[rowName] || []}
                                        emptySlotsInRow={slotsMap[rowName] || []}
                                        onMovePC={handleMovePC}
                                        onQuickAdd={handleQuickAddSlot}
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

                                <div className="pt-12 flex justify-center">
                                    <button
                                        onClick={handleAddNewRow}
                                        className="flex items-center gap-2.5 px-8 py-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-black text-gray-500 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-all uppercase tracking-widest group shadow-sm hover:shadow-md"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Add Section {getNextRowName()}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                    }

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

            {showPCModal && (
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
                                {/* Workstation Name */}
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

                                {/* Status */}
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

                            {/* Installed Softwares */}
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

                            {/* Hardware Specification */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Hardware Specification</label>
                                <textarea value={pcForm.specs} onChange={e => setPCForm({ ...pcForm, specs: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm outline-none h-20 resize-none" placeholder="e.g. 16GB RAM, RTX 3060, 512GB SSD" />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" className="flex-1 rounded-xl py-3.5" onClick={() => setShowPCModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-xl py-3.5">Save Unit</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showScheduleModal && selectedPC && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-white/10">

                        {/* Header */}
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

                        {/* Grid — header row */}
                        <div className="grid grid-cols-[120px_1fr_1fr_32px] gap-3 mb-2 px-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Time Slot</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Software</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Name</span>
                            <span />
                        </div>

                        {/* Grid — one row per slot */}
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
                                        {/* Slot label */}
                                        <span className={`text-sm font-bold ${isBooked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                            }`}>{slot}</span>

                                        {/* Software selector — from PC's own softwares */}
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

                                        {/* Student name */}
                                        <input
                                            type="text"
                                            placeholder="Student name"
                                            value={f.studentName || ''}
                                            onChange={e => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], studentName: e.target.value } }))}
                                            disabled={isDeleting}
                                            className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none font-medium disabled:opacity-50"
                                        />

                                        {/* Delete / restore toggle */}
                                        {f.existingId ? (
                                            <button
                                                type="button"
                                                onClick={() => setSlotForms(prev => ({ ...prev, [slot]: { ...prev[slot], toDelete: !prev[slot].toDelete } }))}
                                                title={isDeleting ? 'Undo remove' : 'Remove this slot'}
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

                            {/* Footer */}
                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                                <Button type="submit" className="px-10 rounded-xl py-3">Update</Button>
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
