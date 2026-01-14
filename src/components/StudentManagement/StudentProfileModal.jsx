import React from 'react';
import axios from 'axios';
import { Modal } from '../ui/modal';
import API from '../../config/api';

const StudentProfileModal = ({ isOpen, onClose, student }) => {
    const [detailedStudent, setDetailedStudent] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [invoices, setInvoices] = React.useState([]);
    const [loadingInvoices, setLoadingInvoices] = React.useState(false);

    const handlePrint = () => {
        window.print();
    };

    React.useEffect(() => {
        if (isOpen && student) {
            fetchStudentDetails();
            fetchInvoices();
        } else {
            setDetailedStudent(null);
            setInvoices([]);
        }
    }, [isOpen, student]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const idToFetch = (student.studentId && typeof student.studentId === 'object' && student.studentId._id)
                ? student.studentId._id
                : student._id;

            const response = await axios.get(`${API}/students/${idToFetch}`, { withCredentials: true });
            setDetailedStudent(response.data.student);
        } catch (error) {
            console.error("Failed to fetch student details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const idToFetch = (student.studentId && typeof student.studentId === 'object' && student.studentId._id)
                ? student.studentId._id
                : (student._id || student.id);

            const response = await axios.get(`${API}/invoices?customer=${idToFetch}`, { withCredentials: true });
            setInvoices(response.data);
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    if (!student) return null;

    // Use detailed data if available, otherwise fall back to prop data
    const displayStudent = detailedStudent || student;

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
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true} className="max-w-5xl !p-0 overflow-hidden bg-white dark:bg-gray-900 shadow-2xl">
            {/* Header / Actions - Hidden in Print */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 print:hidden">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Student Profile Viewer</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        PRINT REPORT
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main scrollable container */}
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar bg-gray-100/50 dark:bg-gray-900/50 p-4 sm:p-8" id="report-print-area">
                <div className="w-full max-w-[210mm] mx-auto bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-sm overflow-hidden flex flex-col">

                    {/* Official Letterhead Header */}
                    <div className="p-6 sm:p-8 border-b-4 border-brand-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full -mr-32 -mt-32"></div>
                        <div className="relative flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex gap-6 items-center">
                                {displayStudent.brand?.logo ? (
                                    <img
                                        src={getPhotoUrl(displayStudent.brand.logo)}
                                        alt="Brand Logo"
                                        className="h-20 w-auto object-contain"
                                    />
                                ) : (
                                    <div className="h-20 w-20 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-brand-200">
                                        {displayStudent.brand?.name?.charAt(0) || 'D'}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                                        {displayStudent.brand?.name || 'DREAM CRM'}
                                    </h1>
                                    <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest leading-relaxed max-w-[300px]">
                                        {displayStudent.brand?.address || 'Official Training Partner'}
                                        {displayStudent.brand?.phone && <><br />Contact: {displayStudent.brand.phone}</>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-light text-gray-300 dark:text-gray-700 uppercase tracking-[0.2em] mb-1">REPORT</h2>
                                <div className="inline-block px-3 py-1 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm">
                                    Official Document
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 flex-grow flex flex-col gap-6">

                        {/* Title & Student Core Info */}
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-[0.5em] mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                                Student Progress Report
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-8 items-center text-left">
                                <div className="flex justify-center md:justify-start print:justify-start">
                                    <img
                                        src={getPhotoUrl(displayStudent.photo)}
                                        alt={displayStudent.fullName}
                                        className="h-32 w-32 rounded-sm object-cover border-4 border-gray-50 dark:border-gray-800 shadow-md gray-scale"
                                        onError={(e) => { e.target.src = "/images/user/user-01.jpg"; }}
                                    />
                                </div>
                                <div className="md:col-span-3 print:col-span-3 grid grid-cols-2 gap-y-4 gap-x-12">
                                    <div className="space-y-0.5 border-b border-gray-50 dark:border-gray-800 pb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Student Name</span>
                                        <p className="text-lg font-black text-gray-900 dark:text-white uppercase">{displayStudent.fullName}</p>
                                    </div>
                                    <div className="space-y-0.5 border-b border-gray-50 dark:border-gray-800 pb-2 text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Student ID</span>
                                        <p className="text-lg font-mono font-black text-brand-600">{displayStudent.studentId}</p>
                                    </div>
                                    <div className="space-y-0.5 border-b border-gray-50 dark:border-gray-800 pb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Enrollment Date</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatDate(displayStudent.enrollmentDate)}</p>
                                    </div>
                                    <div className="space-y-0.5 border-b border-gray-50 dark:border-gray-800 pb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Current Status</span>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{displayStudent.status || 'Active'}</p>
                                    </div>
                                    <div className="space-y-0.5 border-b border-gray-50 dark:border-gray-800 pb-2 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Average Attendance</span>
                                            <span className={`text-md font-black ${parseFloat(displayStudent.averageAttendance) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                                {displayStudent.averageAttendance || '0.00'}%
                                            </span>
                                            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${parseFloat(displayStudent.averageAttendance) >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{ width: `${displayStudent.averageAttendance || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Bio-Data Section */}
                        <section>
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-2 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-500">
                                Bio-Data & Contact Records
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email Address</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{displayStudent.email || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Primary Contact</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{displayStudent.phone1 || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date of Birth</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{formatDate(displayStudent.dob)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gender</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">{displayStudent.gender || '-'}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Permanent Address</span>
                                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-relaxed italic">{displayStudent.address || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Place / Region</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                                        {displayStudent.place === 'Other' ? displayStudent.otherPlace : displayStudent.place}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Identification (Aadhar)</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{displayStudent.aadharCardNumber || '-'}</p>
                                </div>
                            </div>
                        </section>

                        {/* Course Information Section */}
                        <section>
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-2 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-500">
                                Academic Curriculum
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-sm">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Primary Specialization</span>
                                    <p className="text-md font-black text-gray-800 dark:text-gray-200 mt-1 uppercase">
                                        {displayStudent.courseDetails ? `${displayStudent.courseDetails.courseCode} - ${displayStudent.courseDetails.courseName}` : displayStudent.coursePreference}
                                    </p>
                                    <div className="mt-2 text-[11px] text-gray-500 flex gap-4 font-bold">
                                        <span>Duration: {displayStudent.courseDetails?.duration || '-'} Months</span>
                                        <span>Mode: {displayStudent.courseDetails?.mode || '-'}</span>
                                    </div>
                                </div>
                                {displayStudent.additionalCourseDetails && displayStudent.additionalCourseDetails.length > 0 && (
                                    <div className="p-4 border border-gray-100 dark:border-gray-800 rounded-sm">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Additional Modules</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {displayStudent.additionalCourseDetails.map((course, idx) => (
                                                <span key={idx} className="text-[10px] bg-gray-100 dark:bg-gray-800 font-bold px-2 py-1 border border-gray-200 dark:border-gray-700">
                                                    {course.courseCode} - {course.courseName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Attendance & Records Section */}
                        <section>
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-2 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-500">
                                Attendance & Performance Summary
                            </h4>
                            {displayStudent.batchHistory && displayStudent.batchHistory.length > 0 ? (
                                <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-sm">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3 font-black">Batch Name</th>
                                                <th className="px-4 py-3 font-black">Subject / Module</th>
                                                <th className="px-4 py-3 font-black">Instructor</th>
                                                <th className="px-4 py-3 font-black text-center">Attendance</th>
                                                <th className="px-4 py-3 font-black text-right">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {displayStudent.batchHistory.map((batch, index) => (
                                                <tr key={index} className="text-gray-700 dark:text-gray-300">
                                                    <td className="px-4 py-3 font-bold">{batch.batchName}</td>
                                                    <td className="px-4 py-3">{batch.subject}</td>
                                                    <td className="px-4 py-3">{batch.instructorName || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${parseFloat(batch.attendancePercentage) >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {batch.attendancePercentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold">-</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-sm italic text-gray-400 text-xs">
                                    No batch history records available for this period.
                                </div>
                            )}
                        </section>

                        {/* Financial Statement Section */}
                        <section>
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-2 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-500">
                                Official Financial Statement
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-8">
                                <div className="md:col-span-2 print:col-span-2 grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Fee Calculation Basis</span>
                                        <p className="text-md font-black text-gray-800 mt-1 uppercase">
                                            {displayStudent.feeType === 'singleShot' ? 'Single Shot Payment Plan' : 'Standard Installment Plan'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-right">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Discount Category</span>
                                        <p className="text-md font-black text-gray-800 mt-1 italic">
                                            {displayStudent.discountPercentage > 0 ? `PROMOTIONAL (${displayStudent.discountPercentage}%)` : 'NONE'}
                                        </p>
                                    </div>

                                    <div className="col-span-2 p-4 border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between text-xs font-bold py-1">
                                            <span className="text-gray-500 uppercase">Gross Course Value</span>
                                            <span className="text-gray-900">₹{displayStudent.totalCourseValue?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold py-1 border-b border-gray-50 pb-2">
                                            <span className="text-red-500 uppercase">Scholarship / Discount</span>
                                            <span className="text-red-500">- ₹{displayStudent.discountAmount?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-md font-black py-3">
                                            <span className="text-gray-900 uppercase">Net Amount Payable</span>
                                            <span className="text-brand-600">₹{displayStudent.finalAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center p-6 border-2 border-brand-500/20 bg-brand-500/5 rounded-sm text-center">
                                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2 font-mono">Current Status</span>
                                    <div className="w-16 h-16 rounded-full border-4 border-brand-500 flex items-center justify-center mb-2">
                                        <svg className="h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-black text-gray-900 uppercase">Registered</span>
                                    <span className="text-[10px] text-gray-400 mt-1 font-mono">{formatDate(new Date())}</span>
                                </div>
                            </div>
                        </section>

                        {/* Recent Transactions Section */}
                        <section className="pt-4">
                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 px-4 py-2 uppercase tracking-[0.2em] mb-4 border-l-4 border-brand-500">
                                Recent Payment History / Invoices
                            </h4>
                            {invoices.length > 0 ? (
                                <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-sm">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-gray-50 dark:bg-gray-800 uppercase text-gray-500">
                                            <tr>
                                                <th className="px-4 py-3 font-black">Date</th>
                                                <th className="px-4 py-3 font-black">Invoice Number</th>
                                                <th className="px-4 py-3 font-black">Description</th>
                                                <th className="px-4 py-3 font-black text-center">Status</th>
                                                <th className="px-4 py-3 font-black text-right">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {invoices.map((inv) => (
                                                <tr key={inv._id} className="text-gray-700 dark:text-gray-300">
                                                    <td className="px-4 py-3">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-bold">#{inv.invoiceNumber}</td>
                                                    <td className="px-4 py-3 uppercase text-[10px]">{inv.items?.[0]?.description || 'Course Fees'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black">
                                                        ₹{inv.totalAmount?.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-sm italic text-gray-400 text-xs">
                                    No financial transactions or invoices recorded yet.
                                </div>
                            )}
                        </section>

                        {/* Summary Footer */}
                        <div className="mt-8 grid grid-cols-2 gap-20">
                            <div className="text-center">
                                <div className="border-b border-gray-300 h-16 mb-2"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Signature</span>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-gray-300 h-16 mb-2 relative">
                                    {/* Optional Stamp placeholder */}
                                    <div className="absolute top-0 right-0 w-20 h-20 border-2 border-brand-500/20 rounded-full flex items-center justify-center opacity-10 -rotate-12 translate-x-4 -translate-y-4">
                                        <span className="text-[8px] font-black text-brand-500 text-center uppercase tracking-tighter">Dream CRM<br />Official Seal</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Signatory</span>
                            </div>
                        </div>

                    </div>

                    {/* Official Footer */}
                    <div className="bg-gray-900 text-white p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">
                                Generated Automatically via Dream CRM Systems
                            </div>
                            <div className="text-[10px] font-medium opacity-80 flex gap-4">
                                <span>Report Ref: {displayStudent.studentId}-{new Date().getFullYear()}</span>
                                <span>|</span>
                                <span>© {new Date().getFullYear()} {displayStudent.brand?.name || 'Dream CRM'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
@media print {
    @page {
        margin: 0;
        size: A4;
    }
    body {
        margin: 0;
        padding: 0;
        background: white !important;
        transform: scale(0.95);
        transform-origin: top left;
        width: 100%;
        height: 100%;
    }

    /* Force background colors and grayscale */
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }

    /* Hide everything except report area */
    body * {
        visibility: hidden !important;
    }

    #report-print-area, #report-print-area * {
        visibility: visible !important;
    }

    #report-print-area {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        z-index: 2147483647 !important;
        overflow: visible !important;
    }

    .print\\:hidden {
        display: none !important;
    }



    /* Custom scrollbar reset */
    .custom-scrollbar::-webkit-scrollbar {
        display: none;
    }
}
` }} />
        </Modal>
    );
};

export default StudentProfileModal;
