import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, BookOpen, CheckCircle2, User } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Day Navigation Bar
// ─────────────────────────────────────────────────────────────
function DayNavigation({ date, onPrev, onNext, onToday }) {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
            <button
                onClick={onPrev}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            >
                <ChevronLeft size={18} />
            </button>

            <button onClick={onToday} className="flex flex-col items-center gap-0.5">
                <span className={`text-base font-black uppercase tracking-tight ${isToday(date) ? 'text-blue-950' : 'text-gray-900 dark:text-white'}`}>
                    {format(date, 'EEEE')}
                </span>
                <span className={`text-xs font-semibold ${isToday(date) ? 'text-blue-400' : 'text-gray-400'}`}>
                    {format(date, 'dd MMMM yyyy')}
                </span>
                {isToday(date) && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5">
                        Today
                    </span>
                )}
            </button>

            <button
                onClick={onNext}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Instructor Dropdown
// ─────────────────────────────────────────────────────────────
function InstructorDropdown({ instructors, selectedId, onChange }) {
    return (
        <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                Instructor
            </label>
            <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                    value={selectedId}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent shadow-sm"
                >
                    {instructors.map(i => (
                        <option key={i._id} value={i._id}>{i.fullName}</option>
                    ))}
                </select>
                <ChevronLeft size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-[-90deg]" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Slot Card
// ─────────────────────────────────────────────────────────────
function SlotCard({ slotIndex, batch, instructor, date, onBatchClick, onEmptyClick }) {
    const hasBatch = batch && !batch.isSlot;
    const isVacantSlot = batch && batch.isSlot;

    if (hasBatch) {
        return (
            <div className="w-full text-left p-4 bg-white dark:bg-gray-900 border border-blue-100 dark:border-indigo-900/50 border-l-4 border-l-blue-950 shadow-sm flex items-center justify-between gap-4 min-h-[80px]">
                <div className="flex flex-col justify-center gap-2 overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                        <Clock size={11} className="text-blue-800 flex-shrink-0" />
                        <span className="text-[10px] font-bold text-blue-950 dark:text-blue-400 uppercase tracking-tight">
                            {batch.batchTime?.from || '--:--'} – {batch.batchTime?.to || '--:--'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen size={11} className="text-gray-400 flex-shrink-0" />
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-[11px] font-black uppercase tracking-tight border border-gray-100 dark:border-gray-700 truncate">
                                {batch.subject || batch.batchName || 'No Module'}
                            </span>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex-shrink-0">
                                <User size={10} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                                    {batch.studentCount || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onBatchClick(batch)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all border border-emerald-100 dark:border-emerald-800/50 min-w-[70px]"
                >
                    <CheckCircle2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mark</span>
                </button>
            </div>
        );
    }

    // Empty / available slot
    return (
        <button
            onClick={() => onEmptyClick(instructor, date, slotIndex)}
            className="w-full text-left p-4 bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-all min-h-[72px] flex items-center gap-3 group hover:border-blue-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10"
        >
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-indigo-900/30 flex items-center justify-center transition-colors flex-shrink-0">
                <Plus size={14} className="text-gray-400 group-hover:text-blue-800 transition-colors" />
            </div>
            <div>
                <p className="text-xs font-black text-gray-400 group-hover:text-blue-800 uppercase tracking-widest transition-colors">
                    {isVacantSlot ? 'Vacant Track' : 'Available'}
                </p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">Slot {slotIndex + 1} • Tap to schedule</p>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// Slot Timeline
// ─────────────────────────────────────────────────────────────
function SlotTimeline({ instructor, date, tracks, getBatch, onBatchClick, onEmptyClick }) {
    if (!instructor) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
                <User size={32} className="text-gray-200 dark:text-gray-700" />
                <p className="text-sm font-bold text-gray-400">No instructor selected</p>
            </div>
        );
    }

    return (
        <div className="px-4 py-4 space-y-3 pb-28">
            {tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <CheckSquare size={32} className="text-gray-200 dark:text-gray-700" />
                    <p className="text-sm font-bold text-gray-400">No slots configured</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600">Use the desktop view to add tracks</p>
                </div>
            ) : (
                tracks.map((slotIndex) => {
                    const batch = getBatch(instructor._id, slotIndex, date);
                    return (
                        <SlotCard
                            key={slotIndex}
                            slotIndex={slotIndex}
                            batch={batch}
                            instructor={instructor}
                            date={date}
                            onBatchClick={onBatchClick}
                            onEmptyClick={onEmptyClick}
                        />
                    );
                })
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Floating Add Button
// ─────────────────────────────────────────────────────────────
function FloatingAddButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-950 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all hover:bg-blue-900 ring-4 ring-blue-100 dark:ring-indigo-900/40"
            aria-label="Create new schedule entry"
        >
            <Plus size={24} />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Mobile Daily Schedule Component
// ─────────────────────────────────────────────────────────────
export default function MobileDailySchedule({
    instructors,
    getBatchForInstructorSlotOnDate,
    getSlotTracksForInstructor,
    onBatchClick,
    onSlotCellClick,
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedInstructorId, setSelectedInstructorId] = useState('');

    // Auto-select first instructor when instructors load
    useEffect(() => {
        if (instructors.length > 0 && !selectedInstructorId) {
            setSelectedInstructorId(instructors[0]._id);
        }
    }, [instructors, selectedInstructorId]);

    const selectedInstructor = useMemo(
        () => instructors.find(i => i._id === selectedInstructorId) || null,
        [instructors, selectedInstructorId]
    );

    const tracks = useMemo(
        () => selectedInstructor ? getSlotTracksForInstructor(selectedInstructor._id) : [],
        [selectedInstructor, getSlotTracksForInstructor]
    );

    const handlePrevDay = () => setCurrentDate(prev => addDays(prev, -1));
    const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
    const handleToday   = () => setCurrentDate(new Date());

    const handleFabClick = () => {
        if (!selectedInstructor) return;
        // Find first empty/vacant slot or use next index
        const firstAvailableSlot = tracks.length > 0 ? tracks[0] : 0;
        onSlotCellClick(selectedInstructor, currentDate, firstAvailableSlot);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative">
            {/* Day Navigation */}
            <DayNavigation
                date={currentDate}
                onPrev={handlePrevDay}
                onNext={handleNextDay}
                onToday={handleToday}
            />

            {/* Instructor Selector */}
            <InstructorDropdown
                instructors={instructors}
                selectedId={selectedInstructorId}
                onChange={setSelectedInstructorId}
            />

            {/* Slot Timeline */}
            <div className="flex-1 overflow-y-auto">
                <SlotTimeline
                    instructor={selectedInstructor}
                    date={currentDate}
                    tracks={tracks}
                    getBatch={getBatchForInstructorSlotOnDate}
                    onBatchClick={onBatchClick}
                    onEmptyClick={onSlotCellClick}
                />
            </div>

            {/* FAB */}
            <FloatingAddButton onClick={handleFabClick} />
        </div>
    );
}
