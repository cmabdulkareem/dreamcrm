import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal } from '../ui/modal';
import API from '../../config/api';
import LoadingSpinner from '../common/LoadingSpinner';

const StudentProfileModal = ({ isOpen, onClose, student }) => {
    const [fullStudent, setFullStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (isOpen && student?._id) {
            fetchFullStudentDetails();
        } else {
            setFullStudent(null);
            setActiveTab('profile');
        }
    }, [isOpen, student?._id]);

    const fetchFullStudentDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/students/${student._id}`, { withCredentials: true });
            setFullStudent(response.data.student);
        } catch (error) {
            console.error("Error fetching full student details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    const s = fullStudent || student;

    // Mapping Enums to Human Readable Titles
    const statusMap = {
        studying: 'Studying',
        working: 'Working',
        selfEmployed: 'Self Employed',
        freelancer: 'Freelancer',
        homeMaker: 'Home Maker',
        jobSeeker: 'Job Seeker',
        doingNothing: 'N/A'
    };

    const educationMap = {
        notEducated: 'Not Educated',
        below10th: 'Below 10th',
        '10th': '10th Standard',
        '12th': '12th Standard',
        diploma: 'Diploma Holder',
        graduate: 'Graduate',
        postGraduate: 'Post Graduate'
    };

    const genderMap = {
        male: 'Male',
        female: 'Female',
        other: 'Other'
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPhotoUrl = (photo) => {
        if (!photo) return "/images/user/user-01.jpg";
        if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
        const baseUrl = API.replace('/api', '');
        return `${baseUrl}/${photo.replace(/^\//, '')}`;
    };

    const DataField = ({ label, value, subValue }) => (
        <div className="py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
            <span className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 group-hover:text-brand-500 transition-colors">{label}</span>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {value || 'Not Provided'}
                </span>
                {subValue && <span className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-0.5">{subValue}</span>}
            </div>
        </div>
    );

    const StatusBadge = ({ status }) => {
        const colors = {
            studying: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
            working: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
            selfEmployed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
            freelancer: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
            homeMaker: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
            jobSeeker: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
            doingNothing: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        };
        const colorClass = colors[status?.toLowerCase()] || colors.doingNothing;
        return (
            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${colorClass} border border-current opacity-80`}>
                {statusMap[status] || status || 'N/A'}
            </span>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-6xl !p-0 overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">
            <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Banner */}
                <div className="relative h-48 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-800 overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-brand-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="px-6 pb-10 sm:px-12">
                    {/* Header */}
                    <div className="relative -mt-24 flex flex-col sm:flex-row items-center sm:items-end gap-8 mb-10 text-center sm:text-left">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-brand-700 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <img
                                src={getPhotoUrl(s.photo)}
                                alt={s.fullName}
                                className="relative h-44 w-44 rounded-[2.8rem] object-cover border-8 border-white dark:border-gray-900 shadow-2xl"
                                onError={(e) => { e.target.src = "/images/user/user-01.jpg"; }}
                            />
                            <div className="absolute bottom-2 right-2 bg-green-500 h-10 w-10 rounded-2xl border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center">
                                <span className="h-3 w-3 bg-white rounded-full animate-pulse"></span>
                            </div>
                        </div>
                        <div className="flex-grow pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                                <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{s.fullName}</h2>
                                <StatusBadge status={s.status} />
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-sm">
                                <div className="flex items-center gap-2 bg-brand-50 dark:bg-gray-800 text-brand-700 dark:text-brand-400 px-4 py-1.5 rounded-2xl font-black font-mono border border-brand-100 dark:border-brand-900 shadow-sm">
                                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">SID</span>
                                    {s.studentId}
                                </div>
                                <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                                    <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    {s.brand?.name} <span className="text-brand-500 font-black">({s.brand?.code})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-3xl mb-10 w-fit border border-gray-100 dark:border-gray-700/50 shadow-inner">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            Full Dossier
                        </button>
                        <button
                            onClick={() => setActiveTab('attendance')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'attendance' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-xl scale-105' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            Academic History
                            {s.batchHistory?.length > 0 && (
                                <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-lg shadow-lg shadow-brand-200">
                                    {s.batchHistory.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-24 flex justify-center"><LoadingSpinner /></div>
                    ) : activeTab === 'profile' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                            {/* Personal & Contact */}
                            <div className="lg:col-span-1 space-y-10">
                                <section>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                        Contact Matrix
                                    </h3>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 space-y-1">
                                        <DataField label="Primary Email" value={s.email} />
                                        <DataField label="Primary Mobile" value={s.phone1} />
                                        <DataField label="Alternate Mobile" value={s.phone2} />
                                        <DataField label="Legal Gender" value={genderMap[s.gender?.toLowerCase()]} />
                                        <DataField label="Date of Birth" value={formatDate(s.dob)} />
                                        <DataField label="National ID (Aadhar)" value={s.aadharCardNumber} />
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                        Location
                                    </h3>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/20 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 space-y-1">
                                        <DataField label="Native Place" value={s.place === 'Other' ? s.otherPlace : s.place} />
                                        <div className="py-2.5">
                                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Postal Address</span>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">{s.address}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Academic Profile */}
                            <div className="lg:col-span-2 space-y-10">
                                <section>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                        Academic profile
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 dark:bg-gray-800/20 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800/50">
                                        <div className="space-y-4">
                                            <DataField label="Highest Qualification" value={educationMap[s.education]} />
                                            <DataField
                                                label="Primary Specialization"
                                                value={s.courseDetails?.courseName}
                                                subValue={s.courseDetails?.courseCode}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <DataField label="Admissions Channel" value={s.leadId ? `Leads Portal / ${s.leadId.fullName}` : 'Direct Enrollment'} />
                                            <div className="py-2.5">
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Additional Certifications</span>
                                                <div className="flex flex-wrap gap-3">
                                                    {s.additionalCourseDetails?.map((course, idx) => (
                                                        <div key={idx} className="group/chip relative px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 hover:border-brand-500">
                                                            <div className="text-xs font-black text-gray-800 dark:text-gray-200">{course.courseCode}</div>
                                                            <div className="text-[9px] font-bold text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{course.courseName}</div>
                                                        </div>
                                                    ))}
                                                    {(!s.additionalCourseDetails || s.additionalCourseDetails.length === 0) && (
                                                        <span className="text-xs text-gray-400 italic">No additional courses selected</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <section>
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                            System Audit
                                        </h3>
                                        <div className="bg-white dark:bg-gray-800/40 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 space-y-1">
                                            <DataField label="Enrollment Date" value={formatDate(s.enrollmentDate)} />
                                            <DataField label="Data Entered By" value={s.createdBy} />
                                            <DataField label="Last Profile Sync" value={formatDate(s.updatedAt)} />
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                            Allocation
                                        </h3>
                                        <div className="bg-white dark:bg-gray-800/40 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                                            <div className={`h-16 w-16 rounded-3xl flex items-center justify-center mb-4 ${s.batchScheduled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {s.batchScheduled ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    )}
                                                </svg>
                                            </div>
                                            <div className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">{s.batchScheduled ? 'Allocated In Batch' : 'Awaiting Batch'}</div>
                                            <p className="text-[10px] text-gray-400 mt-1">{s.batchScheduled ? 'Student is currently attending classes.' : 'Scheduling pending from Academic Dept.'}</p>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Financials & Card */}
                            <div className="lg:col-span-1 space-y-10">
                                <section>
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                        <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                                        Billing summary
                                    </h3>
                                    <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group mb-10">
                                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-brand-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Total Receivable</span>
                                        <div className="text-5xl font-black mt-3 tracking-tighter leading-none">₹{s.finalAmount?.toLocaleString()}</div>

                                        <div className="mt-10 space-y-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="opacity-40 font-bold uppercase tracking-widest">Base Value</span>
                                                <span className="font-bold">₹{s.totalCourseValue?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-brand-400">
                                                <span className="font-bold uppercase tracking-widest">Scholarship</span>
                                                <span className="font-black">-{s.discountPercentage}%</span>
                                            </div>
                                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase opacity-40">Savings</span>
                                                <span className="text-xl font-black text-green-400">₹{s.discountAmount?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 p-8 rounded-[3rem] text-center">
                                        <div className="bg-indigo-50 dark:bg-gray-900 p-6 rounded-[2rem] w-fit mx-auto mb-6">
                                            <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-[0.2em] mb-2">Authenticated Record</h4>
                                        <p className="text-[10px] text-gray-400 leading-relaxed px-4">This profile is a certified digital transcript of student data as per official records.</p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {s.batchHistory && s.batchHistory.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {s.batchHistory.map((batch, idx) => (
                                        <div key={idx} className="bg-gray-50/50 dark:bg-gray-800/20 rounded-[3.5rem] border border-gray-100 dark:border-gray-800/50 overflow-hidden group hover:border-brand-500/30 transition-all duration-500">
                                            <div className="p-10 pb-6 flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{batch.batchName}</h4>
                                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${new Date() < new Date(batch.expectedEndDate) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                            {new Date() < new Date(batch.expectedEndDate) ? 'Live Now' : 'Concluded'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-brand-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                        {batch.subject}
                                                    </span>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-xl border border-gray-50 dark:border-gray-700 flex flex-col items-center">
                                                    <div className="text-4xl font-black text-brand-600 dark:text-brand-400 leading-none">{batch.attendancePercentage}%</div>
                                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Attendance</div>
                                                </div>
                                            </div>

                                            <div className="mx-10 grid grid-cols-2 gap-8 py-8 border-y border-gray-100 dark:border-gray-800/50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Academician</span>
                                                    <span className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-[10px] font-black">{batch.instructorName[0]}</div>
                                                        {batch.instructorName}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Batch duration</span>
                                                    <span className="text-sm font-black text-gray-800 dark:text-gray-200">
                                                        {formatDate(batch.startDate)} <span className="mx-2 opacity-20">→</span> {formatDate(batch.expectedEndDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-10 pt-8">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex justify-between items-center">
                                                    Engagement Journal
                                                    <span className="text-[9px] opacity-60">Showing latest session logs</span>
                                                </h5>
                                                <div className="flex flex-wrap gap-3">
                                                    {batch.attendanceDetails?.slice(0, 15).reverse().map((record, rIdx) => {
                                                        const statusColors = {
                                                            'Present': 'bg-green-500 border-green-200 shadow-green-100',
                                                            'Absent': 'bg-red-500 border-red-200 shadow-red-100',
                                                            'Late': 'bg-orange-500 border-orange-200 shadow-orange-100',
                                                            'Excused': 'bg-blue-500 border-blue-200 shadow-blue-100',
                                                            'Holiday': 'bg-gray-400 border-gray-200 shadow-gray-100'
                                                        };
                                                        return (
                                                            <div
                                                                key={rIdx}
                                                                title={`${formatDate(record.date)}: ${record.status}${record.remarks ? ` - ${record.remarks}` : ''}`}
                                                                className={`h-10 w-10 rounded-2xl border-4 shadow-xl flex items-center justify-center text-xs text-white font-black transition-all hover:scale-125 hover:-translate-y-1 cursor-help ${statusColors[record.status] || 'bg-gray-300'}`}
                                                            >
                                                                {record.status[0]}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {(!batch.attendanceDetails || batch.attendanceDetails.length === 0) && (
                                                    <div className="py-12 text-center">
                                                        <div className="text-xs font-black text-gray-300 uppercase tracking-widest">Awaiting First Session Log</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[4rem] border-4 border-dashed border-gray-100 dark:border-gray-800">
                                    <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl mb-8 scale-125">
                                        <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h5 className="text-2xl font-black text-gray-800 dark:text-gray-200 tracking-tight">Zero Academic Engagement</h5>
                                    <p className="text-sm text-gray-400 max-w-[400px] text-center mt-3 font-medium leading-relaxed">This scholar is currently not linked to any active or historical academic batches within the system matrix.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default StudentProfileModal;
