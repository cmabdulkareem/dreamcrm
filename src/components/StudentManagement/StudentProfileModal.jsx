import React from 'react';
import { Modal } from '../ui/modal';
import API from '../../config/api';

const StudentProfileModal = ({ isOpen, onClose, student }) => {
    if (!student) return null;

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/images/user/user-01.jpg";
        if (photoPath.startsWith('http') || photoPath.startsWith('data:')) return photoPath;
        const baseUrl = API.replace('/api', '');
        return `${baseUrl}${photoPath}`;
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            studying: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            working: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            selfEmployed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            freelancer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
            homeMaker: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
            jobSeeker: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            doingNothing: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
        };
        const labels = {
            studying: 'Studying',
            working: 'Working',
            selfEmployed: 'Self Employed',
            freelancer: 'Freelancer',
            homeMaker: 'Home Maker',
            jobSeeker: 'Job Seeker',
            doingNothing: 'N/A'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.doingNothing}`}>
                {labels[status] || status || 'N/A'}
            </span>
        );
    };

    const DataField = ({ label, value, className = "" }) => (
        <div className={`py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 ${className}`}>
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
            <span className="text-sm text-gray-900 dark:text-white font-medium break-words">{value || '-'}</span>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-4xl !p-0 overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">
            {/* Main scrollable container */}
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                {/* Header / Banner */}
                <div className="relative h-32 bg-gradient-to-r from-brand-500 to-brand-700">
                    {/* The Modal component provides a close button, but we can have our own or use theirs */}
                </div>

                <div className="px-5 pb-8 sm:px-8">
                    {/* Profile Summary Section */}
                    <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 text-center sm:text-left">
                        <div className="relative">
                            <img
                                src={getPhotoUrl(student.photo)}
                                alt={student.fullName}
                                className="h-32 w-32 rounded-3xl object-cover border-4 border-white dark:border-gray-900 shadow-lg"
                                onError={(e) => { e.target.src = "/images/user/user-01.jpg"; }}
                            />
                            <div className="absolute -bottom-2 -right-2 bg-green-500 h-6 w-6 rounded-full border-4 border-white dark:border-gray-900"></div>
                        </div>
                        <div className="flex-grow pb-2">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{student.fullName}</h2>
                            <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-mono bg-brand-50 dark:bg-gray-800 px-2 py-0.5 rounded text-brand-600 dark:text-brand-400 font-bold tracking-wider">
                                    {student.studentId}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {student.brand?.name || (typeof student.brand === 'string' ? student.brand : 'N/A')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Personal Info */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Personal Details
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1 border border-gray-100 dark:border-gray-800">
                                    <DataField label="Email Address" value={student.email} />
                                    <DataField label="Primary Phone" value={student.phone1} />
                                    <DataField label="Alternate Phone" value={student.phone2} />
                                    <DataField label="Date of Birth" value={formatDate(student.dob)} />
                                    <DataField label="Gender" value={student.gender?.toUpperCase()} />
                                    <DataField label="Aadhar Number" value={student.aadharCardNumber} />
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Address & Place
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1 border border-gray-100 dark:border-gray-800">
                                    <DataField label="Place" value={student.place === 'Other' ? student.otherPlace : student.place} />
                                    <DataField label="Full Address" value={student.address} />
                                </div>
                            </section>
                        </div>

                        {/* Middle Column: Academic & Status */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                                    Academic Profile
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1 border border-gray-100 dark:border-gray-800">
                                    <div className="py-2 border-b border-gray-100 dark:border-gray-800">
                                        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Status</span>
                                        <StatusBadge status={student.status} />
                                    </div>
                                    <DataField label="Education" value={student.education} />
                                    <DataField
                                        label="Primary Course"
                                        value={student.courseDetails ? `${student.courseDetails.courseCode} - ${student.courseDetails.courseName}` : student.coursePreference}
                                    />
                                    {student.additionalCourseDetails && student.additionalCourseDetails.length > 0 && (
                                        <div className="py-2">
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Additional Courses</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {student.additionalCourseDetails.map((course, idx) => (
                                                    <span key={idx} className="text-xs bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300 px-2 py-1 rounded-lg">
                                                        {course.courseCode}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Enrollment Info
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1 border border-gray-100 dark:border-gray-800">
                                    <DataField label="Enrollment Date" value={formatDate(student.enrollmentDate)} />
                                    <DataField label="Created By" value={student.createdBy} />
                                    <DataField label="Registered On" value={formatDate(student.createdAt)} />
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Financials */}
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-sm font-bold text-brand-500 dark:text-brand-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Financial Summary
                                </h3>
                                <div className="bg-brand-500 p-6 rounded-3xl text-white shadow-xl shadow-brand-100 dark:shadow-none mb-4">
                                    <span className="text-xs opacity-80 uppercase tracking-widest font-bold">Final Amount Payable</span>
                                    <div className="text-4xl font-black mt-1">₹{student.finalAmount?.toLocaleString()}</div>
                                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm">
                                        <span>Discount Applied</span>
                                        <span className="font-bold">{student.discountPercentage}% (₹{student.discountAmount?.toLocaleString()})</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl space-y-1 border border-gray-100 dark:border-gray-800">
                                    <DataField label="Total Course Value" value={`₹${student.totalCourseValue?.toLocaleString()}`} />
                                    <div className="py-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch Scheduled</span>
                                        <span className={`h-3 w-3 rounded-full ${student.batchScheduled ? 'bg-green-500' : 'bg-red-500'}`} title={student.batchScheduled ? 'Scheduled' : 'Not Scheduled'}></span>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 p-6 rounded-3xl flex flex-col items-center justify-center text-center opacity-70">
                                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-2xl mb-3">
                                    <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">OFFICIAL DATASHEET</span>
                                <span className="text-[9px] text-gray-400 mt-1">System Generated Record</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default StudentProfileModal;
