import React, { useState, useEffect, useRef } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadCrumb from '../../../components/common/PageBreadCrumb';
import AddCandidateModal from './AddCandidateModal';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { Modal } from '../../../components/ui/modal';
import JobForm from './JobForm';
import { hrService } from '../../../services/hrService';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import API from '../../../config/api';

import {
    FileText,
    Calendar,
    ExternalLink,
    ChevronDown,
    User,
    Plus,
    Pencil,
    Trash2,
    Copy,
    History,
    Clock,
    UserCircle,
    MapPin,
    CheckCircle2,
    MoreVertical,
    XCircle,
    X,
    Eye,
    Mail,
    Phone,
    Briefcase,
    Printer,
    FileCheck,
    Download,
    ShieldCheck,
} from 'lucide-react';

const ItemTypes = {
    APPLICANT: 'applicant'
};

// --- DRAGGABLE APPLICANT CARD ---
const DraggableApplicantCard = ({ app, onViewHistory, onDrop, onSchedule, onOpenDetails, onDelete }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.APPLICANT,
        item: { id: app._id, currentStatus: app.status || 'Pending', jobId: app.jobId?._id || app.jobId },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [app]);

    // Metadata Fallbacks
    const experience = app.experience || '1+ Yr';
    const jobTitle = app.jobId?.title || 'Position';
    const source = app.source || 'Online'; // 'Online' | 'Manual'
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
                    <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                        <span className="flex items-center gap-1 text-brand-500"><Briefcase className="size-2.5 opacity-40 shrink-0" /> {experience}</span>
                        <span className="opacity-20 flex-shrink-0">•</span>
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest border ${source === 'Manual'
                            ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                            : 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20'
                            }`}>
                            {source === 'Manual' ? 'OFFLINE' : 'ONLINE'}
                        </span>
                        <span className="opacity-20 flex-shrink-0">•</span>
                        <span className="flex items-center gap-1 text-gray-500"><Calendar className="size-2.5 opacity-40 shrink-0" /> {appliedDate}</span>
                    </div>
                </div>
            </div>

            {/* Hover Action Bar - Full Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 bg-white/40 dark:bg-gray-900/40 backdrop-blur-[2px] rounded-[12px] transition-all duration-300 pointer-events-none z-10">
                <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 shadow-2xl rounded-full p-1.5 pointer-events-auto scale-90 group-hover/card:scale-100 transition-all duration-300 divide-x divide-gray-100 dark:divide-gray-800">
                    <button
                        onClick={(e) => { e.stopPropagation(); onOpenDetails(app); }}
                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 first:rounded-l-full transition-all duration-200"
                        title="View Full Application"
                    >
                        <Eye className="size-5" strokeWidth={2} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewHistory(app); }}
                        className="p-2.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all duration-200"
                        title="View History"
                    >
                        <History className="size-5" strokeWidth={2} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(app._id); }}
                        className="p-2.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 last:rounded-r-full transition-all duration-200"
                        title="Remove Applicant"
                    >
                        <XCircle className="size-5" strokeWidth={2} />
                    </button>
                </div>
            </div>
            {app.interviewDate && app.status === 'Interviewed' && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg border-2 border-white dark:border-gray-800 animate-pulse">
                    INT: {new Date(app.interviewDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
            )}
        </div>
    );
};

// --- DROPPABLE STAGE COLUMN ---
const DroppableStageColumn = ({ stage, apps, onDrop, onViewHistory, onSchedule, onOpenDetails, onDelete }) => {
    const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.APPLICANT,
        drop: (item) => onDrop(item.id, stage.name),
        canDrop: (item) => item.currentStatus !== stage.name,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }), [stage.name, onDrop]);

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
                            onSchedule={onSchedule}
                            onOpenDetails={onOpenDetails}
                            onDelete={onDelete}
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

// --- APPLICATION DETAILS MODAL ---
const ApplicationDetailsModal = ({ app, isOpen, onClose }) => {
    if (!app) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                            <UserCircle className="size-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{app.fullName}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant="secondary" color="primary" className="text-[10px] px-2 py-0.5">
                                    {app.status || 'Pending'}
                                </Badge>
                                <span className="text-[11px] text-gray-400 font-medium">• Applied: {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Contact Details</label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Mail className="size-4 opacity-50" />
                                    <span className="text-sm font-medium">{app.email || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <Phone className="size-4 opacity-50" />
                                    <span className="text-sm font-medium">{app.phone}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Position</label>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Briefcase className="size-4 opacity-50" />
                                <span className="text-sm font-bold">{app.jobId?.title || 'Position'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Documents</label>
                            {app.resumeUrl ? (
                                <a
                                    href={app.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all group"
                                >
                                    <FileText className="size-4" />
                                    View Resume
                                    <ExternalLink className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400 italic text-xs py-2">
                                    <FileText className="size-4 opacity-50" />
                                    No resume attached
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {app.coverLetter && (
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-3xl p-6">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Cover Letter / Notes</label>
                        <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap italic">
                            "{app.coverLetter}"
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
const SignedAgreementModal = ({ app, isOpen, onClose }) => {
    const [generating, setGenerating] = useState(false);

    if (!app || !app.agreementSigned) return null;

    const handleDownload = async () => {
        try {
            setGenerating(true);
            const response = await axios.get(`${API}/hr/agreement/download?appId=${app._id}`, {
                responseType: 'blob'
            });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Signed_Agreement_${app.fullName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Agreement downloaded successfully!');
        } catch (error) {
            console.error('PDF Download Error:', error);
            toast.error('Failed to download PDF.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl !p-0">
            <div className="flex flex-col h-[90vh] bg-gray-100 dark:bg-gray-950 overflow-hidden rounded-3xl">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-20 no-print">
                    <div className="flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                            <FileCheck className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">Agreement Viewer</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{app.fullName} • Signed {new Date(app.signedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="p-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                            title="Print Agreement"
                        >
                            <Printer className="size-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50`}
                        >
                            {generating ? '...' : <Download className="size-4" />}
                            {generating ? 'Generating' : 'Download PDF'}
                        </button>
                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-2" />
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <Plus className="size-6 rotate-45" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto p-8 sm:p-12 scrollbar-hide bg-gray-100/50 dark:bg-gray-950/50">
                    {/* A4 Paper Simulation (Visual Reference Only) */}
                    <div className="mx-auto flex justify-center">
                        <div
                            className="bg-white text-gray-900 shadow-2xl w-full max-w-[794px] min-h-[1123px] p-[60px] sm:p-[80px] relative overflow-hidden flex flex-col"
                        >
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none rotate-[-45deg] z-0">
                                <h2 className="text-[100px] font-bold tracking-tighter uppercase">CDC INTERNATIONAL</h2>
                            </div>

                            <div className="relative z-10 space-y-10">
                                <header className="text-center border-b-2 border-gray-100 pb-10 mb-10">
                                    <div className="inline-block px-4 py-1.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-6 italic">Official System Record</div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-4 uppercase">Employment Agreement</h1>
                                    <div className="text-gray-500 font-medium text-sm">
                                        This agreement is digitally signed and concluded between <strong className="text-gray-900">CDC International</strong> and <strong className="text-gray-900">{app.fullName}</strong>.
                                    </div>
                                </header>

                                {app.signedContent?.map((section, idx) => (
                                    <section key={idx} className="space-y-3">
                                        <h2 className="text-base font-bold text-gray-900 uppercase flex items-center gap-3">
                                            <span className="text-blue-600 font-bold">{(idx + 1).toString().padStart(2, '0')}.</span>
                                            {section.title}
                                        </h2>
                                        <div
                                            className="text-gray-600 leading-relaxed text-[15px] prose prose-sm max-w-none text-left ql-editor p-0"
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    </section>
                                ))}

                                <div className="mt-20 pt-10 border-t-2 border-gray-100 grid grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Candidate Signature</p>
                                            <div className="h-14 flex items-end border-b border-gray-200 pb-2">
                                                <span className="text-xl font-medium italic text-blue-900 font-serif">{app.signatureName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date of Signing</p>
                                            <p className="text-xs font-bold text-gray-900">{new Date(app.signedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Attestation</p>
                                            <div className="h-14 flex items-center border-b border-gray-200 gap-3">
                                                <div className="w-5 h-5 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-600">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </div>
                                                <span className="text-[9px] font-black text-gray-900">VERIFIED BY CDC AUTH</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Document ID</p>
                                            <p dangerouslySetInnerHTML={{ __html: app._id }} className="text-[8px] font-mono text-gray-900 break-all"></p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer className="mt-auto pt-20 text-center opacity-30 pb-4">
                                <p className="text-[8px] font-bold tracking-widest uppercase">&copy; {new Date().getFullYear()} CDC International • Human Resources Division • Electronic Record</p>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .modal-container { box-shadow: none !important; border: none !important; }
                }
                .ql-editor p { margin-bottom: 0px !important; }
            `}} />
        </Modal>
    );
};

const ApplicationHistoryModal = ({ app, isOpen, onClose, onViewAgreement }) => {
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

                                            {(log.remark?.includes('Agreement signed') || (log.status === 'Hired' && app.agreementSigned)) && (
                                                <div className="mb-4">
                                                    <button
                                                        onClick={() => onViewAgreement(app)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FileCheck className="size-4" />
                                                        View Signed Copy
                                                    </button>
                                                </div>
                                            )}

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

// --- CUSTOM DATE TIME PICKER ---
const CustomDateTimePicker = ({ value, onChange }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [isOpen, setIsOpen] = useState(false);

    const formatLocalISO = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    // Parse current value correctly (treating it as local)
    const selectedDate = value ? new Date(value) : null;

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = (e) => { e.preventDefault(); setViewDate(new Date(year, month - 1)); };
    const handleNextMonth = (e) => { e.preventDefault(); setViewDate(new Date(year, month + 1)); };

    const handleDateSelect = (day) => {
        const newDate = new Date(year, month, day);
        if (selectedDate) {
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
        } else {
            newDate.setHours(9);
            newDate.setMinutes(0);
        }
        onChange(formatLocalISO(newDate));
    };

    const handleTimeChange = (type, val) => {
        const newDate = selectedDate ? new Date(selectedDate) : new Date();
        if (type === 'h') newDate.setHours(parseInt(val));
        else newDate.setMinutes(parseInt(val));
        onChange(formatLocalISO(newDate));
    };

    const days = [];
    const totalDays = daysInMonth(year, month);
    const offset = firstDayOfMonth(year, month);

    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-all dark:text-white group"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-blue-600" />
                    {selectedDate ? (
                        <span className="font-bold">
                            {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-blue-600 dark:text-blue-400">
                                {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                        </span>
                    ) : (
                        <span className="text-gray-400">Select interview window</span>
                    )}
                </div>
                <ChevronDown className={`size-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-3 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl w-[460px] left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                    <div className="flex">
                        {/* Calendar Section (Hero) */}
                        <div className="flex-1 p-6">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h4 className="text-sm font-black dark:text-white uppercase tracking-tighter">{monthNames[month]} {year}</h4>
                                <div className="flex gap-2">
                                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"><ChevronDown className="size-4 rotate-90" /></button>
                                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"><ChevronDown className="size-4 -rotate-90" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-3">
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                                    <div key={i} className="text-center text-[10px] font-black text-gray-400 tracking-widest">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {days.map((d, i) => (
                                    <div
                                        key={i}
                                        onClick={() => d && handleDateSelect(d)}
                                        className={`
                                            h-10 flex items-center justify-center text-xs rounded-xl cursor-pointer transition-all
                                            ${!d ? 'pointer-events-none' : 'hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 font-bold'}
                                            ${selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year ? 'bg-blue-600 text-white font-black scale-105 shadow-xl shadow-blue-500/20' : 'dark:text-gray-400 font-medium'}
                                        `}
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom Time Selector (Compact but clear) */}
                        <div className="w-32 border-l border-gray-100 dark:border-gray-800 flex flex-col relative bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="text-[10px] font-black text-gray-400 uppercase text-center py-4 tracking-tighter border-b border-gray-100 dark:border-gray-800">Time Window</div>

                            {/* AM/PM Toggle (Integrated) */}
                            <div className="flex p-2 gap-1 bg-white/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800">
                                {['AM', 'PM'].map(period => {
                                    const isPM = selectedDate ? selectedDate.getHours() >= 12 : false;
                                    const isActive = (period === 'PM') === isPM;
                                    return (
                                        <button
                                            key={period}
                                            type="button"
                                            onClick={() => {
                                                const newDate = selectedDate ? new Date(selectedDate) : new Date();
                                                let h = newDate.getHours();
                                                if (period === 'PM' && h < 12) h += 12;
                                                if (period === 'AM' && h >= 12) h -= 12;
                                                newDate.setHours(h);
                                                onChange(formatLocalISO(newDate));
                                            }}
                                            className={`
                                                flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all
                                                ${isActive ? 'bg-blue-950 text-white shadow-lg' : 'text-gray-400 hover:bg-white dark:hover:bg-gray-800'}
                                            `}
                                        >
                                            {period}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex-1 flex flex-col justify-center min-h-[220px]">
                                <div className="flex gap-1 px-1 relative h-[160px] overflow-hidden">
                                    {/* Subtle selection highlight */}
                                    <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 h-9 bg-blue-50/80 dark:bg-blue-900/40 rounded-xl pointer-events-none z-0 border border-blue-200 dark:border-blue-700" />

                                    {/* Hours (1-12) */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth h-full py-[62px] z-10 pr-1">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
                                            const isSelected = selectedDate && (selectedDate.getHours() % 12 || 12) === h;
                                            return (
                                                <div
                                                    key={h}
                                                    onClick={() => {
                                                        const newDate = selectedDate ? new Date(selectedDate) : new Date();
                                                        const isPM = newDate.getHours() >= 12;
                                                        let newHour = h;
                                                        if (isPM && h < 12) newHour += 12;
                                                        if (!isPM && h === 12) newHour = 0;
                                                        newDate.setHours(newHour);
                                                        onChange(formatLocalISO(newDate));
                                                    }}
                                                    className={`
                                                        text-xs h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all
                                                        ${isSelected ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold'}
                                                    `}
                                                >
                                                    {h.toString().padStart(2, '0')}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="text-gray-300 dark:text-gray-700 font-black self-center text-xs pb-1 z-10">:</div>

                                    {/* Minutes */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth h-full py-[62px] z-10 pr-1">
                                        {minutes.map(m => (
                                            <div
                                                key={m}
                                                onClick={() => handleTimeChange('m', m)}
                                                className={`
                                                    text-xs h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all
                                                    ${selectedDate && selectedDate.getMinutes() === m ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold'}
                                                `}
                                            >
                                                {m.toString().padStart(2, '0')}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-gray-900 flex gap-4 border-t border-gray-100 dark:border-gray-800 shadow-inner">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                now.setMinutes(Math.round(now.getMinutes() / 5) * 5);
                                onChange(formatLocalISO(now));
                            }}
                            className="px-6 py-2.5 text-[10px] font-black uppercase text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 hover:scale-[1.02]"
                        >
                            Confirm Interview Slot
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SCHEDULE INTERVIEW MODAL ---
const ScheduleInterviewModal = ({ app, isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        schedule: '',
        remark: ''
    });
    const [submitting, setSubmitting] = useState(false);

    if (!app) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const [date, time] = formData.schedule.split('T');
            const submissionData = {
                interviewDate: date,
                interviewTime: time,
                remark: formData.remark
            };
            await hrService.scheduleInterview(app._id, submissionData);
            toast.success('Interview scheduled successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error scheduling interview:', error);
            toast.error('Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
                    <Calendar className="size-5 text-blue-600" />
                    Schedule Interview
                </h3>
                <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-6">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Candidate</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{app.fullName}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{app.jobId?.title}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Clock className="size-3" /> Interview Date & Time
                        </label>
                        <CustomDateTimePicker
                            value={formData.schedule}
                            onChange={(val) => setFormData({ ...formData, schedule: val })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <FileText className="size-3" /> Interview Notes
                        </label>
                        <textarea
                            value={formData.remark}
                            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                            placeholder="Add interview details (e.g., link, room number)"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-28 resize-none transition-all dark:text-white"
                        />
                    </div>
                    <div className="pt-2 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 font-bold !rounded-2xl text-xs uppercase tracking-widest h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={!formData.schedule}
                            className="flex-1 bg-blue-950 hover:bg-black font-bold !rounded-2xl text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-500/10 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Schedule
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

// --- SELECT AGREEMENT MODAL ---
const SelectAgreementModal = ({ app, isOpen, onClose, onSuccess }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplates, setSelectedTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && app) {
            const fetchTemplates = async () => {
                setLoading(true);
                try {
                    const response = await axios.get(`${API}/hr/agreements`, { withCredentials: true });
                    console.log('Fetched agreement templates for selection:', response.data);
                    setTemplates(response.data);
                    // Pre-select active template if exists
                    const active = response.data.find(t => t.isActive);
                    if (active) setSelectedTemplates([active._id]);
                    else if (response.data.length > 0) setSelectedTemplates([response.data[0]._id]);
                } catch (error) {
                    console.error('Error fetching templates:', error);
                    toast.error('Failed to load agreement templates');
                } finally {
                    setLoading(false);
                }
            };
            fetchTemplates();
        }
    }, [isOpen, app]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedTemplates.length === 0) return toast.error('Please select at least one agreement template');

        setSubmitting(true);
        try {
            await hrService.updateApplicationStatus(app._id, 'Hired', 'Offer Sent with Selected Agreements', false, selectedTemplates);
            toast.success('Candidate moved to Offer stage and onboarding email sent.');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error sending offer:', error);
            toast.error(error.message || 'Failed to send offer');
        } finally {
            setSubmitting(false);
        }
    };

    if (!app) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
            <div className="p-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
                    <FileText className="size-5 text-emerald-600" />
                    Select Onboarding Agreement
                </h3>
                <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-6">
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Send Offer To</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{app.fullName}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{app.jobId?.title || 'Position'}</div>
                </div>

                {loading ? (
                    <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500 mb-4">No agreement templates found.</p>
                        <Button onClick={onClose} variant="outline" className="w-full font-bold !rounded-2xl text-xs uppercase tracking-widest">Cancel</Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Choose Template</label>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {templates.map((template) => (
                                    <label
                                        key={template._id}
                                        className={`
                                            relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all
                                            ${selectedTemplates.includes(template._id)
                                                ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10'
                                                : 'border-gray-100 dark:border-gray-800 hover:border-emerald-200'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            name="template"
                                            value={template._id}
                                            checked={selectedTemplates.includes(template._id)}
                                            onChange={() => {
                                                setSelectedTemplates(prev =>
                                                    prev.includes(template._id)
                                                        ? prev.filter(id => id !== template._id)
                                                        : [...prev, template._id]
                                                );
                                            }}
                                            className="hidden"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{template.name}</span>
                                                {template.isActive && (
                                                    <span className="text-[8px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">Active</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{template.sections?.length || 0} Sections</div>
                                        </div>
                                        {selectedTemplates.includes(template._id) && (
                                            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 duration-200">
                                                <CheckCircle2 className="size-3" />
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 font-bold !rounded-2xl text-xs uppercase tracking-widest h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={submitting}
                                className="flex-1 bg-emerald-600 hover:bg-black font-bold !rounded-2xl text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/10 h-12"
                            >
                                Send Offer
                            </Button>
                        </div>
                    </form>
                )}
            </div>
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
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
    const [isAgreementSignedModalOpen, setIsAgreementSignedModalOpen] = useState(false);
    const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [activeJobForCandidate, setActiveJobForCandidate] = useState(null);

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
            type: job.type,
            postedDate: job.postedDate,
            postedBy: typeof job.postedBy === 'object' ? job.postedBy?.fullName : (job.postedBy || null),
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

    const handleDrop = React.useCallback(async (applicantId, newStatus) => {
        const applicant = applications.find(a => a._id === applicantId);

        // If moving to Interviewed stage, open the scheduling modal instead of direct drop
        if (newStatus === 'Interviewed' && applicant) {
            handleOpenSchedule(applicant);
            return;
        }

        // If moving to Hired (Offer) stage, open the agreement selection modal
        if (newStatus === 'Hired' && applicant) {
            setSelectedApplicant(applicant);
            setIsAgreementModalOpen(true);
            return;
        }

        // Check if moving AWAY from Interviewed status (or just clearing schedule) while having an interview scheduled
        if (applicant && applicant.interviewDate && newStatus !== 'Interviewed') {
            const confirmCancel = window.confirm(
                `Moving ${applicant.fullName} to ${newStatus} will cancel the scheduled interview on ${new Date(applicant.interviewDate).toLocaleDateString()}. Proceed?`
            );
            if (!confirmCancel) return;
        }

        const isClearingInterview = applicant && applicant.interviewDate && newStatus !== 'Interviewed';

        try {
            // Optimistic update
            setApplications(prev => prev.map(app =>
                app._id === applicantId ? {
                    ...app,
                    status: newStatus,
                    ...(isClearingInterview ? { interviewDate: null, interviewTime: null } : {})
                } : app
            ));

            await hrService.updateApplicationStatus(applicantId, newStatus, null, isClearingInterview);
            // Re-fetch to get updated history
            fetchData();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to move candidate');
            fetchData(); // Rollback
        }
    }, [applications, fetchData]);

    const handleDeleteApplicant = async (applicantId) => {
        const applicant = applications.find(a => a._id === applicantId);
        if (!applicant) return;

        // If already Rejected → permanently delete
        if (applicant.status === 'Rejected') {
            if (!window.confirm(`Permanently remove ${applicant.fullName}? This cannot be undone.`)) return;
            try {
                setApplications(prev => prev.filter(a => a._id !== applicantId));
                await hrService.deleteApplication(applicantId);
                toast.success('Applicant permanently removed.');
            } catch (error) {
                console.error('Failed to delete applicant:', error);
                toast.error('Failed to remove applicant');
                fetchData();
            }
        } else {
            // Otherwise move to Rejected stage
            try {
                setApplications(prev => prev.map(a =>
                    a._id === applicantId ? { ...a, status: 'Rejected' } : a
                ));
                await hrService.updateApplicationStatus(applicantId, 'Rejected', 'Rejected by HR');
            } catch (error) {
                console.error('Failed to reject applicant:', error);
                toast.error('Failed to reject applicant');
                fetchData();
            }
        }
    };

    const handleViewHistory = (app) => {
        setSelectedApplicant(app);
        setIsHistoryModalOpen(true);
    };

    const handleOpenSchedule = (app) => {
        setSelectedApplicant(app);
        setIsScheduleModalOpen(true);
    };

    const handleOpenDetails = (app) => {
        setSelectedApplicant(app);
        setIsDetailsModalOpen(true);
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
                                                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            <Briefcase className="size-3 opacity-60" /> {group.type || 'Full-time'}
                                                        </span>
                                                        <span className="text-gray-200 dark:text-gray-700">|</span>
                                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            <Calendar className="size-3 opacity-60" />
                                                            Posted {group.postedDate ? new Date(group.postedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                        {group.postedBy && (
                                                            <>
                                                                <span className="text-gray-200 dark:text-gray-700">|</span>
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    By {group.postedBy}
                                                                </span>
                                                            </>
                                                        )}
                                                        {!group.postedBy && group.department && (
                                                            <>
                                                                <span className="text-gray-200 dark:text-gray-700">|</span>
                                                                <span className="text-[10px] text-gray-400 font-medium">
                                                                    {group.department}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pr-4 border-r border-gray-100 dark:border-gray-800 mr-4 opacity-0 group-hover/accordion:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveJobForCandidate(group);
                                                        setIsAddCandidateModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Add Manual Candidate"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
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
                                                                onSchedule={handleOpenSchedule}
                                                                onOpenDetails={handleOpenDetails}
                                                                onDelete={handleDeleteApplicant}
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
                    onViewAgreement={(app) => {
                        setSelectedApplicant(app);
                        setIsAgreementSignedModalOpen(true);
                    }}
                />

                <SignedAgreementModal
                    app={selectedApplicant}
                    isOpen={isAgreementSignedModalOpen}
                    onClose={() => setIsAgreementSignedModalOpen(false)}
                />

                <ApplicationDetailsModal
                    app={selectedApplicant}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                />

                <ScheduleInterviewModal
                    app={selectedApplicant}
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onSuccess={fetchData}
                />

                <SelectAgreementModal
                    app={selectedApplicant}
                    isOpen={isAgreementModalOpen}
                    onClose={() => setIsAgreementModalOpen(false)}
                    onSuccess={fetchData}
                />

                <AddCandidateModal
                    isOpen={isAddCandidateModalOpen}
                    onClose={() => {
                        setIsAddCandidateModalOpen(false);
                        setActiveJobForCandidate(null);
                    }}
                    jobId={activeJobForCandidate?.id}
                    jobTitle={activeJobForCandidate?.title}
                    onSuccess={fetchData}
                />
            </div>
        </DndProvider>
    );
};

export default CandidateList;
