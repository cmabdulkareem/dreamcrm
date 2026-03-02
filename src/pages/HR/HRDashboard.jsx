import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import { UserCircleIcon, CalendarIcon, ListIcon, PlusIcon, PencilIcon, TrashBinIcon } from '../../icons';
import { Link } from 'react-router-dom';
import { hrService } from '../../services/hrService';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import JobForm from './Recruitment/JobForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { Clock } from 'lucide-react';

// Manual Icons since some might be missing from the icons directory
const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CopyIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
    </svg>
);

const HRDashboard = () => {
    const [stats, setStats] = useState([
        { title: 'Total Employees', value: '...', icon: <UserCircleIcon className="w-6 h-6 text-blue-950" />, change: 'Loading...' },
        { title: 'On Leave Today', value: '...', icon: <CalendarIcon className="w-6 h-6 text-yellow-500" />, change: 'Loading...' },
        { title: 'Open Positions', value: '...', icon: <ListIcon className="w-6 h-6 text-green-500" />, change: 'Loading...' },
        { title: 'Interviews Today', value: '...', icon: <UserCircleIcon className="w-6 h-6 text-purple-500" />, change: 'Loading...' },
    ]);
    const [postings, setPostings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [activity, setActivity] = useState([]);
    const [selectedPostings, setSelectedPostings] = useState([]);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingJobId, setEditingJobId] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);
    const [selectedJobForApps, setSelectedJobForApps] = useState(null);
    const [applications, setApplications] = useState([]);
    const [appsLoading, setAppsLoading] = useState(false);

    const activeCount = postings.filter(p => p.status === 'Active').length;
    const closedCount = postings.filter(p => p.status === 'Closed').length;

    const formatJobDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedPostings(postings.map(p => p.id || p._id));
        } else {
            setSelectedPostings([]);
        }
    };

    const handleSelectPosting = (id) => {
        setSelectedPostings(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const fetchPostings = async () => {
        try {
            const data = await hrService.getJobs();
            setPostings(data);
        } catch (error) {
            console.error('Error fetching postings:', error);
        }
    };

    const handleDeleteJob = async (id) => {
        if (window.confirm('Are you sure you want to delete this job posting?')) {
            try {
                await hrService.deleteJob(id);
                fetchPostings();
                setSelectedPostings(prev => prev.filter(item => item !== id));
            } catch (error) {
                console.error('Error deleting job:', error);
            }
        }
    };

    const handleCopyLink = (jobId) => {
        const link = `${window.location.origin} /jobs/apply / ${jobId} `;
        navigator.clipboard.writeText(link).then(() => {
            toast.success('Public application link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy link:', err);
            toast.error('Failed to copy link');
        });
    };

    const handleOpenJobModal = (jobId = null) => {
        setEditingJobId(jobId);
        setIsJobModalOpen(true);
    };

    const handleCloseJobModal = () => {
        setIsJobModalOpen(false);
        setEditingJobId(null);
    };

    const handleViewApplications = async (job) => {
        setSelectedJobForApps(job);
        setIsAppModalOpen(true);
        setAppsLoading(true);
        try {
            const data = await hrService.getJobApplications(job._id || job.id);
            setApplications(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setAppsLoading(false);
        }
    };

    const handleCloseAppModal = () => {
        setIsAppModalOpen(false);
        setSelectedJobForApps(null);
        setApplications([]);
    };

    const fetchDashboardData = async () => {
        try {
            const [statsData, activityData] = await Promise.all([
                hrService.getStats(),
                hrService.getRecentActivity()
            ]);

            setStats([
                { title: 'Total Employees', value: statsData.totalEmployees, icon: <UserCircleIcon className="w-6 h-6 text-blue-950" />, change: 'Active' },
                { title: 'On Leave Today', value: statsData.onLeaveToday, icon: <CalendarIcon className="w-6 h-6 text-yellow-500" />, change: 'Approved' },
                { title: 'Open Positions', value: statsData.openPositions, icon: <ListIcon className="w-6 h-6 text-green-500" />, change: 'Active Jobs' },
                { title: 'Interviews Today', value: statsData.interviewsToday, icon: <UserCircleIcon className="w-6 h-6 text-purple-500" />, change: 'Scheduled' },
            ]);

            setActivity(activityData);
            await fetchPostings();
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading && postings.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <>
            <PageMeta title="HR Dashboard - CRM" />
            <PageBreadCrumb items={[{ name: 'EMS', path: '/hr' }, { name: 'Dashboard' }]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">{stat.title}</p>
                                        <h3 className="text-3xl font-black text-gray-800 dark:text-white mt-1 tabular-nums">{stat.value}</h3>
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center size-5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-500">
                                        <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </span>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tight">
                                        {stat.change}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                        <div className="mb-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Job Postings</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleOpenJobModal()}
                                        size="sm"
                                        className="bg-blue-950 hover:bg-blue-900 !rounded-full text-xs"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" />
                                        Post Job
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 h-10 shadow-sm transition-all hover:bg-slate-100/50 dark:hover:bg-white/10">
                                        <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Total:</span>
                                        <span className="font-black text-blue-950 dark:text-blue-400 text-[15px] tabular-nums leading-none">{postings.length}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm transition-all hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                        <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">Active:</span>
                                        <span className="font-black text-green-600 dark:text-green-400 text-[15px] tabular-nums leading-none">{activeCount}</span>
                                    </div>
                                    {/* Closed Pill - Restored from original */}
                                    <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 h-10 shadow-sm transition-all hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                                        <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">
                                            Closed:
                                        </span>
                                        <span className="font-black text-red-600 dark:text-red-400 text-[15px] tabular-nums leading-none">
                                            {closedCount}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <SearchIcon className="w-4 h-4" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search postings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full sm:w-64 h-10 pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
                            <Table className="min-w-full border-collapse">
                                <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] border-b border-gray-100 dark:border-gray-800">
                                    <TableRow>
                                        <TableCell isHeader className="py-4 pl-8 pr-5 text-start text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit">
                                            <input
                                                type="checkbox"
                                                checked={postings.length > 0 && selectedPostings.length === postings.length}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-950 cursor-pointer"
                                            />
                                        </TableCell>
                                        <TableCell isHeader className="py-4 px-5 text-start text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit border-l border-gray-100 dark:border-gray-800/50">Date</TableCell>
                                        <TableCell isHeader className="py-4 px-5 text-start text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit border-l border-gray-100 dark:border-gray-800/50">Title</TableCell>
                                        <TableCell isHeader className="py-4 px-5 text-start text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit border-l border-gray-100 dark:border-gray-800/50">Status</TableCell>
                                        <TableCell isHeader className="py-4 px-5 text-center text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit border-l border-gray-100 dark:border-gray-800/50">Applicants</TableCell>
                                        <TableCell isHeader className="py-4 px-5 text-end text-[10.5px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-400 bg-inherit border-l border-gray-100 dark:border-gray-800/50">Actions</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {postings.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.department.toLowerCase().includes(searchTerm.toLowerCase())).map((post) => (
                                        <TableRow key={post._id || post.id} className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01]">
                                            <TableCell className="py-4 pl-8 pr-5 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white relative">
                                                <div className={`absolute left - 0 top - 0 bottom - 0 w - [6px] ${post.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'} `} />
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPostings.includes(post._id || post.id)}
                                                    onChange={() => handleSelectPosting(post._id || post.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-950 focus:ring-blue-950"
                                                />
                                            </TableCell>
                                            <TableCell className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-800/50">{formatJobDate(post.postedDate)}</TableCell>
                                            <TableCell className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white border-l border-gray-100 dark:border-gray-800/50">
                                                <div className="flex flex-col">
                                                    <p className="font-semibold text-gray-800 dark:text-white/90 truncate group-hover:text-blue-950 transition-colors">{post.title}</p>
                                                    <p className="text-blue-500 text-[12px] font-medium">{post.department}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 whitespace-nowrap border-l border-gray-100 dark:border-gray-800/50">
                                                <Badge variant="secondary" color={post.status === 'Active' ? 'success' : 'light'} size="sm">
                                                    {post.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className="px-5 py-4 whitespace-nowrap text-center border-l border-gray-100 dark:border-gray-800/50 cursor-pointer"
                                                onClick={() => handleViewApplications(post)}
                                            >
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 group-hover:bg-blue-100 transition-all">
                                                    {post.applications?.length ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-5 py-4 whitespace-nowrap text-end border-l border-gray-100 dark:border-gray-800/50">
                                                <div className="flex items-center justify-end gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleCopyLink(post._id || post.id)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Copy Link"><CopyIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleOpenJobModal(post._id || post.id)} className="p-2 text-gray-500 hover:text-blue-950 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteJob(post._id || post.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><TrashBinIcon className="w-4 h-4" /></button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden h-fit">
                    <div className="p-5 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-widest">Recent Activity</h3>
                        <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="p-5 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {activity.length === 0 ? (
                            <div className="py-10 text-center opacity-30">
                                <p className="text-xs font-bold uppercase tracking-widest">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-700">
                                {activity.map((item) => (
                                    <div key={item.id} className="relative pl-8 group">
                                        <div className={`absolute left-0 top-1 size-5 rounded-full border-4 border-white dark:border-gray-800 z-10 shadow-sm transition-transform group-hover:scale-125 ${item.type === 'application' ? 'bg-blue-500' :
                                            item.type === 'status' ? 'bg-purple-500' :
                                                'bg-emerald-500'
                                            }`} />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white leading-none mb-1.5">{item.title}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
                                            <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {new Date(item.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-700/10 border-t border-gray-50 dark:border-gray-700/50">
                        <Link to="/hr/activity" className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:gap-3 transition-all">
                            View Full Logs
                            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                    </div>
                </div>
            </div>

            <Modal isOpen={isJobModalOpen} onClose={handleCloseJobModal} className="max-w-4xl">
                <JobForm jobId={editingJobId} onClose={handleCloseJobModal} onSuccess={fetchPostings} />
            </Modal>

            <Modal isOpen={isAppModalOpen} onClose={handleCloseAppModal} className="max-w-4xl" showCloseButton={true}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-5">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Applicants for {selectedJobForApps?.title}</h2>
                            <p className="text-base font-medium text-gray-600 dark:text-gray-400 mt-1">{selectedJobForApps?.brand} • {selectedJobForApps?.department}</p>
                        </div>
                    </div>

                    {appsLoading ? (
                        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : applications.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">
                            <p className="text-lg">No applications received yet.</p>
                            <p className="text-sm mt-2">Public Link: {window.location.origin}/jobs/apply/{selectedJobForApps?._id || selectedJobForApps?.id}</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <TableRow>
                                        <TableCell isHeader className="py-4 px-6 text-xs uppercase font-bold text-gray-600 dark:text-gray-300 tracking-wider">Candidate</TableCell>
                                        <TableCell isHeader className="py-4 px-6 text-xs uppercase font-bold text-gray-600 dark:text-gray-300 tracking-wider">Contact Info</TableCell>
                                        <TableCell isHeader className="py-4 px-6 text-xs uppercase font-bold text-gray-600 dark:text-gray-300 tracking-wider">Applied Date</TableCell>
                                        <TableCell isHeader className="py-4 px-6 text-xs uppercase font-bold text-gray-600 dark:text-gray-300 tracking-wider text-end">Action</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications.map((app) => (
                                        <TableRow key={app._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors border-gray-100 dark:border-gray-800">
                                            <TableCell className="py-5 px-6">
                                                <div className="text-base font-bold text-gray-900 dark:text-white">{app.fullName}</div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6">
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{app.email}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{app.phone}</div>
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-sm tabular-nums text-gray-600 dark:text-gray-300 font-medium">
                                                {new Date(app.appliedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </TableCell>
                                            <TableCell className="py-5 px-6 text-end">
                                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-950 text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-all shadow-md active:scale-95">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    View Resume
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <Button onClick={handleCloseAppModal} size="sm" className="bg-gray-100 !text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:!text-gray-400 dark:hover:bg-gray-700 !rounded-full text-xs font-bold">Close</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default HRDashboard;
