import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/ui/button/Button';
import API from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import BatchCalendar from '../../components/BatchManagement/BatchCalendar';
import CreateBatchModal from '../../components/BatchManagement/CreateBatchModal';
import HolidayCalendarModal from '../../components/BatchManagement/HolidayCalendarModal';
import { isAdmin, isOwner, isManager } from '../../utils/roleHelpers';
import { LayoutGrid, Calendar, Plus, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subWeeks, addWeeks, subMonths, addMonths } from 'date-fns';

export default function BatchManagement() {
    const { user } = useContext(AuthContext);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('week');
    const canCreate = isAdmin(user) || isOwner(user) || isManager(user);

    const handlePrev = () => {
        if (view === 'day') setCurrentDate(prev => addDays(prev, -1));
        else if (view === 'week') setCurrentDate(prev => subWeeks(prev, 1));
        else setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNext = () => {
        if (view === 'day') setCurrentDate(prev => addDays(prev, 1));
        else if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1));
        else setCurrentDate(prev => addMonths(prev, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    useEffect(() => {
        fetchBatches();
    }, []);

    const fetchBatches = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const response = await axios.get(`${API}/batches`, { withCredentials: true });
            setBatches(response.data.batches);
        } catch (error) {
            console.error("Error fetching batches:", error);
            toast.error("Failed to load batches.");
        } finally {
            setLoading(false);
        }
    };

    const handleBatchCreated = (newBatch) => {
        setBatches([newBatch, ...batches]);
        setIsModalOpen(false);
    };

    const handleBatchUpdated = (updatedBatch) => {
        setBatches(batches.map(b => b._id === updatedBatch._id ? updatedBatch : b));
    };

    const handleBatchDeleted = (batchId) => {
        setBatches(batches.filter(b => b._id !== batchId));
    };

    const totalSlots = batches.length;
    const establishedBatches = batches.filter(b => !b.isSlot).length;
    const vacantSlots = batches.filter(b => b.isSlot).length;

    return (
        <div className="flex flex-col min-h-screen">
            <PageMeta
                title="Batch Management | CDC International"
                description="Manage students in structured batches"
            />
            
            <div className="flex-1 space-y-4">
                <PageBreadcrumb pageTitle="Batch Management" />

                <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-6 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                    {format(currentDate, 'MMMM yyyy')}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Scheduling Plane Matrix</p>
                                <span className="size-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                <p className="text-xs text-blue-500 font-semibold">{totalSlots} Total Slots</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Calendar Navigation */}
                            <div className="hidden lg:flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-4">
                                <div className="flex items-center bg-white border border-gray-100 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                                    <button
                                        onClick={() => setView('week')}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                            view === 'week' 
                                            ? 'bg-blue-50 text-blue-600 shadow-sm dark:bg-blue-900/40 dark:text-blue-500' 
                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        Capacity Matrix (Weekly)
                                    </button>
                                </div>

                                <div className="flex items-center gap-1 bg-white border border-gray-100 dark:border-gray-800 rounded-xl p-1 shadow-sm">
                                    <button 
                                        onClick={handlePrev}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button 
                                        onClick={handleToday}
                                        className="px-3 py-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Current
                                    </button>
                                    <button 
                                        onClick={handleNext}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {canCreate && (
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm"
                                        variant="outline" 
                                        onClick={() => setIsHolidayModalOpen(true)}
                                        className="!rounded-full h-10 px-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-slate-400 font-bold text-xs"
                                        startIcon={<Calendar className="size-4" />}
                                    >
                                        Holidays
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Efficiency Stats - Pill-Style Grouped Layout */}
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-8">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 h-10 shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-white/10">
                            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">
                                Total Slots:
                            </span>
                            <span className="font-black text-gray-800 dark:text-white text-[15px] tabular-nums leading-none">
                                {totalSlots}
                            </span>
                        </div>

                        <div className="flex items-center gap-5 px-5 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm">
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-emerald-500 shadow-sm" />
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[9px]">
                                        Established:
                                    </span>
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-[14px] tabular-nums leading-none">
                                        {establishedBatches}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-amber-500 shadow-sm" />
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter text-[9px]">
                                        Vacant:
                                    </span>
                                    <span className="font-black text-amber-600 dark:text-amber-400 text-[14px] tabular-nums leading-none">
                                        {vacantSlots}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm transition-all hover:bg-gray-100/50 dark:hover:bg-gray-700/50 ml-auto">
                            <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">
                                System Health:
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest leading-none">
                                Optimized
                            </span>
                        </div>
                    </div>

                    {loading && batches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading your batches...</p>
                        </div>
                    ) : (
                        <div className="mb-0">
                            <BatchCalendar 
                                currentDate={currentDate} 
                                setCurrentDate={setCurrentDate} 
                                view={view} 
                                setView={setView} 
                            />
                        </div>
                    )}
                </div>
            </div>

            {isHolidayModalOpen && (
                <HolidayCalendarModal
                    isOpen={isHolidayModalOpen}
                    onClose={() => setIsHolidayModalOpen(false)}
                />
            )}
            <ToastContainer position="top-center" autoClose={3000} className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    );
}
