import React, { useState, useEffect, useRef } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { Modal } from '../../../components/ui/modal';
import JobForm from './JobForm';
import { hrService } from '../../../services/hrService';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    ChevronDown,
    Briefcase,
    Users,
    FileText,
    Calendar,
    Mail,
    ExternalLink,
    User,
    Plus,
    Pencil,
    Trash2,
    Copy,
    ArrowUpRight,
    History,
    CheckCircle2,
    Clock,
    UserCircle,
    MoreVertical,
    Star,
    MapPin,
    XCircle
} from 'lucide-react';

const ItemTypes = {
    APPLICANT: 'applicant'
};

// --- DRAGGABLE APPLICANT CARD ---
const DraggableApplicantCard = ({ app, onViewHistory, onDrop }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.APPLICANT,
        item: { id: app._id, currentStatus: app.status || 'Pending', jobId: app.jobId?._id || app.jobId },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [app]);

    // Metadata Fallbacks
    const experience = app.experience || '3+ Yrs';
    const jobTitle = app.jobId?.title || 'Position';
    const location = app.location || 'Remote';
    const appliedDate = new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    return (
        <div
            ref={drag}
            className={`
                group/card relative flex flex-col bg-white dark:bg-gray-800 rounded-[12px] border border-gray-100 dark:border-gray-700 
                shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing
                ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}
            `}
        >
            {/* Main Content */}
            <div className="p-3.5">
                <div className="flex justify-between items-start mb-1.5">
                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-white truncate tracking-tight pr-5 group-hover/card:text-brand-500 transition-colors">
                        {app.fullName}
                    </h4>
                    <button className="absolute top-3 right-1.5 p-1 text-gray-300 hover:text-gray-500 transition-colors">
                        <MoreVertical className="size-4" />
                    </button>
                </div>

                {/* Info Lines */}
                <div className="space-y-1.5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight truncate leading-none">
                        {jobTitle}
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-brand-500 font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                        <span className="flex items-center gap-1"><Briefcase className="size-2.5 opacity-40 shrink-0" /> {experience}</span>
                        <span className="opacity-20 flex-shrink-0">•</span>
                        <span className="flex items-center gap-1"><MapPin className="size-2.5 opacity-40 shrink-0" /> {location}</span>
                        <span className="opacity-20 flex-shrink-0">•</span>
                        <span className="flex items-center gap-1 truncate"><Calendar className="size-2.5 opacity-40 shrink-0" /> {appliedDate}</span>
                    </div>
                </div>
            </div>

            {/* Hover Action Bar */}
            <div className="absolute inset-x-0 -bottom-1 flex items-center justify-center gap-2 opacity-0 group-hover/card:opacity-100 group-hover/card:bottom-2 transition-all duration-200 pointer-events-none">
                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-xl rounded-full px-2 py-1.5 pointer-events-auto divide-x divide-gray-100 dark:divide-gray-800">
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewHistory(app); }}
                        className="px-2.5 text-gray-400 hover:text-brand-500 transition-colors"
                        title="View History"
                    >
                        <History className="size-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toast.info('Schedule'); }}
                        className="px-2.5 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Schedule"
                    >
                        <Clock className="size-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toast.info('Drag to move'); }}
                        className="px-2.5 text-gray-400 hover:text-purple-500 transition-colors"
                        title="Move"
                    >
                        <ArrowUpRight className="size-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDrop(app._id, 'Rejected'); }}
                        className="px-2.5 text-gray-400 hover:text-rose-500 transition-colors"
                        title="Reject"
                    >
                        <XCircle className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- DROPPABLE STAGE COLUMN ---
const DroppableStageColumn = ({ stage, apps, onDrop, onViewHistory }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.APPLICANT,
        drop: (item) => onDrop(item.id, stage.name),
        canDrop: (item) => item.currentStatus !== stage.name,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [stage.name]);

    return (
        <div
            ref={drop}
            className={`flex flex-col min-h-[350px] transition-colors duration-200 ${isOver ? (canDrop ? 'bg-brand-50/30 dark:bg-brand-500/5' : 'bg-red-50/30 dark:bg-red-500/5') : ''}`}
        >
            {/* Column Name Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">
                    {stage.label}
                </span>
                <Badge size="sm" color="light" className="font-bold">
                    {apps.length}
                </Badge>
            </div>

            {/* Column Content */}
            <div className="p-3 space-y-3 flex-grow max-h-[600px] overflow-y-auto scrollbar-hide">
                {apps.length === 0 ? (
                    <div className="py-12 text-center opacity-5">
                        <User className="size-6 mx-auto" />
                    </div>
                ) : (
                    apps.map((app) => (
                        <DraggableApplicantCard
                            key={app._id}
                            app={app}
                            onViewHistory={onViewHistory}
                            onDrop={onDrop}
                        />
                    ))
                )}
                {isOver && canDrop && (
                    <div className="border-2 border-dashed border-brand-200 dark:border-brand-500/20 rounded-xl h-24 flex items-center justify-center bg-brand-50/20 dark:bg-brand-500/5 animate-pulse">
                        <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Drop Here</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- APPLICATION HISTORY MODAL ---
const ApplicationHistoryModal = ({ app, isOpen, onClose }) => {
    if (!app) return null;

    const history = [...(app.history || [])].reverse();

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl !p-0">
            <div className="flex flex-col h-[80vh] max-h-[800px]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-sm">
                            <History className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{app.fullName}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Application Lifecycle</span>
                                <span className="size-1 bg-gray-300 rounded-full" />
                                <span className="text-[10px] text-brand-500 font-black uppercase tracking-widest">{app.status || 'Pending'}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-auto p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <Plus className="size-6 rotate-45" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-brand-500/50 before:via-gray-100 dark:before:via-gray-800 before:to-transparent">
                        {history.length === 0 ? (
                            <div className="text-center py-20 opacity-20">
                                <Clock className="size-12 mx-auto mb-3" />
                                <p className="text-sm font-bold uppercase tracking-widest">No activity logged yet</p>
                            </div>
                        ) : (
                            history.map((log, idx) => {
                                const isLatest = idx === 0;
                                return (
                                    <div key={idx} className={`relative pl-12 transition-all duration-500 ${isLatest ? 'opacity-100' : 'opacity-80'}`}>
                                        <div className={`absolute left-0 top-1.5 size-9 rounded-full border-4 border-white dark:border-gray-950 flex items-center justify-center z-10 shadow-md transition-all ${isLatest ? 'bg-brand-500 scale-110' : 'bg-gray-100 dark:bg-gray-800'
                                            }`}>
                                            {log.remark === 'Entry Created' ? (
                                                <Plus className={`size-3.5 ${isLatest ? 'text-white font-bold' : 'text-gray-400'}`} />
                                            ) : (
                                                <CheckCircle2 className={`size-3.5 ${isLatest ? 'text-white font-bold' : 'text-gray-400'}`} />
                                            )}
                                        </div>

                                        <div className={`bg-white dark:bg-white/[0.02] border rounded-2xl p-4 shadow-sm hover:shadow-theme-md transition-all duration-300 group ${isLatest ? 'border-brand-500/30' : 'border-gray-100 dark:border-gray-800'
                                            }`}>
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-gray-50 dark:border-gray-800/50">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg shadow-sm ${log.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border border-rose-100' :
                                                        log.status === 'Hired' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' :
                                                            'bg-brand-50 text-brand-500 border border-brand-100'
                                                        }`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                                                        <Calendar className="size-3" />
                                                        {new Date(log.updatedOn).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                                                        <Clock className="size-3" />
                                                        {new Date(log.updatedOn).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

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
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5 flex justify-end gap-3 sticky bottom-0 z-30">
                    <Button onClick={onClose} variant="outline" className="font-bold !rounded-full text-xs uppercase tracking-widest">
                        Close Lifecycle
                    </Button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-thin::-webkit-scrollbar {
                    width: 5px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 20px;
                }
                .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}} />
        </Modal>
    );
};

// --- MAIN CANDIDATE LIST COMPONENT ---
const CandidateList = () => {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});

    // Modal states
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingJobId, setEditingJobId] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [jobsData, appsData] = await Promise.all([
                hrService.getJobs(),
                hrService.getAllApplications()
            ]);
            setJobs(jobsData);
            setApplications(appsData);

            // Expand first job by default if available and not already set
            if (jobsData.length > 0 && Object.keys(expandedJobs).length === 0) {
                const firstJobId = jobsData[0]._id || jobsData[0].id;
                if (firstJobId) {
                    setExpandedJobs({ [firstJobId]: true });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load recruitment data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stages = [
        { name: 'Pending', label: 'Applied', color: '#64748B', dot: 'bg-slate-400' },
        { name: 'Reviewed', label: 'Screening', color: '#F59E0B', dot: 'bg-amber-500' },
        { name: 'Interviewed', label: 'Interview', color: '#8B5CF6', dot: 'bg-purple-500' },
        { name: 'Hired', label: 'Offer', color: '#10B981', dot: 'bg-emerald-500' },
        { name: 'Rejected', label: 'Rejected', color: '#EF4444', dot: 'bg-rose-500' },
    ];

    const stageSummary = stages.map(stage => ({
        ...stage,
        count: applications.filter(app => (app.status || 'Pending') === stage.name).length
    }));

    // Grouping by Job - ensure all jobs are present
    const jobGroups = jobs.reduce((groups, job) => {
        const jobId = job._id || job.id;
        groups[jobId] = {
            id: jobId,
            title: job.title,
            brand: job.brand,
            department: job.department,
            status: job.status,
            apps: applications.filter(app => (app.jobId?._id || app.jobId) === jobId)
        };
        return groups;
    }, {});

    const toggleJob = (jobId) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    const handleOpenJobModal = (jobId = null) => {
        setEditingJobId(jobId);
        setIsJobModalOpen(true);
    };

    const handleCloseJobModal = () => {
        setIsJobModalOpen(false);
        setEditingJobId(null);
    };

    const handleDeleteJob = async (e, jobId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this job posting and all its applications?')) {
            try {
                await hrService.deleteJob(jobId);
                toast.success('Job deleted successfully');
                fetchData();
            } catch (error) {
                console.error('Error deleting job:', error);
                toast.error('Failed to delete job');
            }
        }
    };

    const handleCopyLink = (e, jobId) => {
        e.stopPropagation();
        const link = `${window.location.origin}/jobs/apply/${jobId}`;
        navigator.clipboard.writeText(link).then(() => {
            toast.success('Application link copied!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy link');
        });
    };

    const handleDrop = async (applicantId, newStatus) => {
        try {
            // Optimistic update
            setApplications(prev => prev.map(app =>
                app._id === applicantId ? { ...app, status: newStatus } : app
            ));

            await hrService.updateApplicationStatus(applicantId, newStatus);
            toast.success(`Candidate moved to ${newStatus}`);
            // Re-fetch to get updated history
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to move candidate');
            fetchData(); // Rollback
        }
    };

    const handleViewHistory = (app) => {
        setSelectedApplicant(app);
        setIsHistoryModalOpen(true);
    };

    if (loading && jobs.length === 0) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen pb-20">
                <PageMeta title="Recruitment Management | CDC Insights" />

                <PageBreadCrumb items={[{ name: 'EMS', path: '/hr' }, { name: 'Recruitment & Candidates' }]} />

                <div className="mt-6 space-y-6">

                    {/* 1. STAGE SUMMARY BAR & ACTIONS */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-wrap items-center gap-3">
                            {stageSummary.map((stage) => (
                                <div key={stage.name} className="flex items-center gap-3 px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm transition-all hover:bg-gray-100/80">
                                    <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">
                                        {stage.label}:
                                    </span>
                                    <span className="font-black text-gray-800 dark:text-gray-100 text-[15px] tabular-nums leading-none">
                                        {stage.count}
                                    </span>
                                    <span className={`size-1.5 rounded-full shadow-sm ${stage.dot}`}></span>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => handleOpenJobModal()}
                            size="sm"
                            className="bg-blue-950 hover:bg-blue-900 !rounded-full text-xs font-bold shadow-md active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-1.5" strokeWidth={3} />
                            Post New Job
                        </Button>
                    </div>

                    {/* 2. JOB ACCORDIONS */}
                    <div className="space-y-4">
                        {Object.values(jobGroups).length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
                                <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">No active job postings</h3>
                                <p className="text-sm text-gray-400 mt-1">Start by clicking "Post New Job" above.</p>
                            </div>
                        ) : (
                            Object.values(jobGroups).map((group) => {
                                const isExpanded = expandedJobs[group.id];
                                return (
                                    <div key={group.id} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-sm overflow-hidden transition-all group/accordion">
                                        {/* Accordion Header */}
                                        <div
                                            onClick={() => toggleJob(group.id)}
                                            className={`w-full text-left p-5 flex items-center justify-between cursor-pointer transition-all
                                                ${isExpanded ? 'bg-gray-50/50 dark:bg-white/5' : 'hover:bg-gray-50/30'}
                                            `}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-gray-700 shrink-0">
                                                    <Briefcase className="size-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">
                                                            {group.brand}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">• {group.apps.length} Applicants</span>
                                                        <Badge variant="secondary" color={group.status === 'Active' ? 'success' : 'light'} size="sm" className="text-[9px] h-4 leading-none">
                                                            {group.status}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate pr-4">
                                                        {group.title}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pr-4 border-r border-gray-100 dark:border-gray-800 mr-4 opacity-0 group-hover/accordion:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleCopyLink(e, group.id)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Copy Application Link"
                                                >
                                                    <Copy className="size-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenJobModal(group.id); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Job"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteJob(e, group.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Job"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>

                                            <div className={`transition-all duration-300 ${isExpanded ? 'rotate-180 text-brand-500' : 'text-gray-400'}`}>
                                                <ChevronDown className="size-5" />
                                            </div>
                                        </div>

                                        {/* Pipeline Grid */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/[0.02]">
                                                <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                                                    {stages.map((stage) => {
                                                        const stageApps = group.apps.filter(app => (app.status || 'Pending') === stage.name);
                                                        return (
                                                            <DroppableStageColumn
                                                                key={stage.name}
                                                                stage={stage}
                                                                apps={stageApps}
                                                                onDrop={handleDrop}
                                                                onViewHistory={handleViewHistory}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <Modal
                    isOpen={isJobModalOpen}
                    onClose={handleCloseJobModal}
                    className="max-w-4xl"
                >
                    <div className="p-1">
                        <JobForm
                            jobId={editingJobId}
                            onClose={handleCloseJobModal}
                            onSuccess={() => {
                                handleCloseJobModal();
                                fetchData();
                            }}
                        />
                    </div>
                </Modal>

                <ApplicationHistoryModal
                    app={selectedApplicant}
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                />
            </div>
        </DndProvider>
    );
};

export default CandidateList;
