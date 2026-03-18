import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, isOwner, isManager } from '../../utils/roleHelpers';
import LoadingSpinner from '../common/LoadingSpinner';

import StudentProfileModal from '../StudentManagement/StudentProfileModal';

export default function BatchStudentList({ batchId, batchSubject, batchStartDate, batchEndDate, brandName, batchModuleId }) {
    const { user } = useAuth();
    const canEdit = isAdmin(user) || isOwner(user) || isManager(user);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [generatingId, setGeneratingId] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
    const [mergeSource, setMergeSource] = useState(null); // ID of student whose attendance will be moved
    const cardRef = React.useRef(null);

    // Search & Select States
    const [convertedStudents, setConvertedStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const initialStudentState = {
        studentId: '',
        studentName: '',
        dob: '',
        phoneNumber: '',
        parentPhoneNumber: ''
    };
    const [newStudent, setNewStudent] = useState(initialStudentState);
    const [editStudent, setEditStudent] = useState(initialStudentState);

    useEffect(() => {
        fetchStudents();
    }, [batchId]);

    useEffect(() => {
        if (isAdding && convertedStudents.length === 0) {
            fetchConvertedStudents();
        }
    }, [isAdding]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/batches/${batchId}/students`, { withCredentials: true });
            setStudents(response.data.students);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConvertedStudents = async () => {
        try {
            setIsSearching(true);
            // Fetch all students from Manage Students list, filtered by module and availability
            let url = `${API}/students/all?availableForBatch=true`;
            if (batchModuleId) {
                url += `&currentModule=${batchModuleId}`;
            }
            const response = await axios.get(url, { withCredentials: true });
            setConvertedStudents(response.data.students);
        } catch (error) {
            toast.error("Failed to fetch student list for selection.");
        } finally {
            setIsSearching(false);
        }
    };

    // Filter students based on search term and exclude those already in batch
    const filteredConvertedStudents = convertedStudents.filter(student => {
        const isInBatch = students.some(s =>
            (s.studentId && s.studentId._id === student._id) ||
            (s.studentId === student._id)
        );

        if (isInBatch) return false;

        return (
            student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.phone1?.includes(searchTerm) ||
            (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    // Quick Add: Immediately add student upon selection
    const handleQuickAddStudent = async (student) => {
        const payload = {
            studentId: student._id, // The Object ID ref to 'Student'
            studentName: student.fullName,
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            phoneNumber: student.phone1,
            parentPhoneNumber: student.phone2 || ''
        };

        try {
            const response = await axios.post(`${API}/batches/${batchId}/students`, payload, { withCredentials: true });

            // Update UI
            setStudents(prev => [...prev, response.data.student]);
            setSearchTerm(''); // Clear search
            setShowResults(false); // Hide dropdown
            toast.success(`${student.fullName} added successfully!`);
        } catch (error) {
            console.error("Error adding student:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to add student.");
            }
        }
    };

    // Manual Add: For when user types details manually without selecting
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!newStudent.studentName || !newStudent.phoneNumber) {
            toast.error("Student Name and Phone Number are required.");
            return;
        }

        const payload = { ...newStudent };
        // If manual, we don't have a linked studentId (ObjectId), so ensure we don't send a partial string
        if (!payload.studentId || payload.studentId.length < 24) {
            delete payload.studentId;
        }

        try {
            const response = await axios.post(`${API}/batches/${batchId}/students`, payload, { withCredentials: true });
            setStudents([...students, response.data.student]);
            setNewStudent(initialStudentState);
            toast.success("Student added successfully!");
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to add student.");
            }
        }
    };

    const handleViewStudent = (student) => {
        const studentData = student.studentId && typeof student.studentId === 'object' ? student.studentId : student;
        setSelectedStudentForProfile(studentData);
        setIsProfileModalOpen(true);
    };

    // Helper to get display values (prefer populated data, fallback to static)
    const getStudentData = (student) => {
        const source = student.studentId && typeof student.studentId === 'object' ? student.studentId : student;
        const isPopulated = student.studentId && typeof student.studentId === 'object';

        return {
            id: isPopulated ? (source.studentId || '-') : (student.studentId || '-'),
            name: isPopulated ? source.fullName : student.studentName,
            dob: source.dob,
            phone: isPopulated ? source.phone1 : student.phoneNumber,
            parentPhone: isPopulated ? source.phone2 : student.parentPhoneNumber,
            course: isPopulated ? (source.courseName || source.coursePreference || '') : '',
            _id: student._id
        };
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editStudent.studentName || !editStudent.phoneNumber) {
            toast.error("Student Name and Phone Number are required.");
            return;
        }
        try {
            await axios.put(`${API}/batches/students/${editingId}`, editStudent, { withCredentials: true });
            fetchStudents();
            setEditingId(null);
            toast.success("Student updated successfully!");
        } catch (error) {
            toast.error("Failed to update student.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this student?")) {
            try {
                await axios.delete(`${API}/batches/students/${id}`, { withCredentials: true });
                setStudents(students.filter(s => s._id !== id));
                toast.success("Student removed successfully.");
            } catch (error) {
                toast.error("Failed to remove student.");
            }
        }
    };

    const handleMarkForMerge = (student) => {
        if (mergeSource && mergeSource._id === student._id) {
            setMergeSource(null);
        } else {
            setMergeSource(student);
        }
    };

    const handleMergeAttendance = async (targetStudent) => {
        if (!mergeSource) return;

        if (window.confirm(`Are you sure you want to merge all attendance from ${mergeSource.studentName} into ${targetStudent.studentName}? ${mergeSource.studentName} will be removed from this batch.`)) {
            try {
                setLoading(true);
                const response = await axios.post(`${API}/batches/${batchId}/students/merge-attendance`, {
                    sourceId: mergeSource._id,
                    targetId: targetStudent._id
                }, { withCredentials: true });

                toast.success(response.data.message);
                setMergeSource(null);
                fetchStudents(); // Refresh list
            } catch (error) {
                console.error("Merge error:", error);
                const data = error.response?.data;
                const errorMsg = data?.error
                    ? `${data.message}: ${data.error}`
                    : (data?.message || error.message || "Failed to merge attendance.");
                toast.error(errorMsg, { autoClose: 7000 });
            } finally {
                setLoading(false);
            }
        }
    };


    const handleGenerateID = async (student) => {
        setGeneratingId(student._id);

        try {
            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    reject(new Error(`Failed to load: ${src}`));
                };
                img.src = src;
            });

            const canvasWidth = 1550;
            const canvasHeight = 2400;
            const canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d');

            // --- PAGE 1: FRONT SIDE ---
            let frontTemplate = '/images/cc_id_temp.png'; // Default
            if (brandName) {
                const lowerBrand = brandName.toLowerCase();
                if (lowerBrand.includes('cadd')) frontTemplate = '/images/cc_id_temp.png';
                else if (lowerBrand.includes('synergy')) frontTemplate = '/images/syn_id_temp.png';
                else if (lowerBrand.includes('dream')) frontTemplate = '/images/dz_id_temp.png';
                else if (lowerBrand.includes('livewire')) frontTemplate = '/images/lw_id_temp.png';
            }

            const bgImgFront = await loadImage(frontTemplate);
            ctx.drawImage(bgImgFront, 0, 0, canvasWidth, canvasHeight);

            const sData = getStudentData(student);
            let studentPhoto = student.studentId?.photo || student.photo;
            if (studentPhoto && !studentPhoto.startsWith('http') && !studentPhoto.startsWith('data:')) {
                studentPhoto = `${API.replace('/api', '')}/${studentPhoto.replace(/^\//, '')}`;
            }
            if (!studentPhoto) {
                studentPhoto = '/images/user/avatar.png';
            }

            try {
                const photoImg = await loadImage(studentPhoto);
                const x = 345, y = 422, size = 905;
                const cx = x + size / 2, cy = y + size / 2, radius = size / 2;

                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(photoImg, x, y, size, size);
                ctx.restore();

                ctx.strokeStyle = "#000";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();
            } catch (err) {
                console.error("Could not load student photo, drawing placeholder", err);
                const x = 345, y = 422, size = 905;
                const cx = x + size / 2, cy = y + size / 2, radius = size / 2;
                ctx.fillStyle = "#f3f4f6";
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = "#021349";
            ctx.font = "bold 100px Arial";
            ctx.fillText(sData.name || "Student Name", 145, 1595);

            ctx.fillStyle = "#000000";
            ctx.font = "bold 75px Arial";
            ctx.fillText(sData.course || "", 145, 1680);

            ctx.fillStyle = "#021349";
            ctx.font = "normal 70px Arial";
            ctx.fillText(sData.id || "Student ID", 145, 1800);

            const imgDataFront = canvas.toDataURL('image/jpeg', 0.95);

            // --- PAGE 2: BACK SIDE ---
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            const bgImgBack = await loadImage('/images/cc_id_temp_back.png');
            ctx.drawImage(bgImgBack, 0, 0, canvasWidth, canvasHeight);

            if (batchStartDate && batchEndDate) {
                const startStr = new Date(batchStartDate).toLocaleDateString();
                const endStr = new Date(batchEndDate).toLocaleDateString();
                ctx.fillStyle = "#021349";
                ctx.font = "bold 70px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`Start Date: ${startStr}`, canvasWidth / 2, 2030);
                ctx.fillText(`End Date: ${endStr}`, canvasWidth / 2, 2150);
            }

            const imgDataBack = canvas.toDataURL('image/jpeg', 0.95);

            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [canvasWidth * 0.75, canvasHeight * 0.75],
            });

            pdf.addImage(imgDataFront, 'JPEG', 0, 0, canvasWidth * 0.75, canvasHeight * 0.75);
            pdf.addPage();
            pdf.addImage(imgDataBack, 'JPEG', 0, 0, canvasWidth * 0.75, canvasHeight * 0.75);

            const baseName = (sData.name || "Student").trim().replace(/[^a-z0-9]/gi, '_');
            const fileName = `${baseName}_ID_Card.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("ID Generation Error:", error);
            toast.error(`Error: ${error.message}`);
        } finally {
            setGeneratingId(null);
        }
    };

    const [addMethod, setAddMethod] = useState('search'); // 'search' or 'manual'

    if (loading) return <LoadingSpinner className="py-10" />;

    const studentsCount = students.length;

    return (
        <div className="mt-4">
            {/* Merge Notification */}
            {mergeSource && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-blue-100 dark:border-indigo-800 rounded-2xl flex justify-between items-center animate-pulse shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-indigo-900/40 rounded-lg text-blue-950 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-300">
                            <span className="font-bold underline">{mergeSource.studentName}</span> is selected. Click on another student to move their attendance.
                        </div>
                    </div>
                    <button
                        onClick={() => setMergeSource(null)}
                        className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-950 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-indigo-800 hover:bg-indigo-50 transition-colors"
                    >
                        Cancel Merge
                    </button>
                </div>
            )}

            {/* Header & Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h6 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Enrollment Status
                    </h6>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{studentsCount}</span>
                        <span className="text-sm font-medium text-gray-500">Students Enrolled</span>
                    </div>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            isAdding 
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200' 
                            : 'bg-blue-950 text-white hover:bg-blue-900 hover:shadow-blue-800/20'
                        }`}
                    >
                        {isAdding ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Student
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Add Student Section */}
            {isAdding && (
                <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-inner">
                    <div className="flex gap-4 mb-6 p-1 bg-white dark:bg-gray-800 rounded-2xl w-fit border border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={() => setAddMethod('search')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${addMethod === 'search' ? 'bg-blue-950 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Search Database
                        </button>
                        <button 
                            onClick={() => setAddMethod('manual')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${addMethod === 'manual' ? 'bg-blue-950 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Quick Manual Entry
                        </button>
                    </div>

                    {addMethod === 'search' ? (
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Search Student Name or ID</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Type to search..."
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-800/20 transition-all text-sm font-medium dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                />
                                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-800 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            {showResults && searchTerm && (
                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl max-h-72 overflow-y-auto animate-fadeInUp">
                                    {isSearching ? (
                                        <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />
                                            Searching students...
                                        </div>
                                    ) : filteredConvertedStudents.length > 0 ? (
                                        <div className="p-2">
                                            {filteredConvertedStudents.map(student => (
                                                <div
                                                    key={student._id}
                                                    className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer rounded-xl transition-all"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleQuickAddStudent(student)}
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{student.fullName}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px]">{student.studentId || 'NO-ID'}</span>
                                                            <span>•</span>
                                                            <span>{student.phone1}</span>
                                                        </div>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                                        <div className="bg-indigo-50 text-blue-950 px-3 py-1 rounded-lg text-xs font-bold">Add</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center">
                                            <p className="text-sm text-gray-400 font-medium italic">No matching students found in the database.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Student ID (Optional)</label>
                                    <input type="text" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-4 py-2.5" placeholder="Custom ID" />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Student Name *</label>
                                    <input type="text" value={newStudent.studentName} onChange={e => setNewStudent({ ...newStudent, studentName: e.target.value })} className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-4 py-2.5" placeholder="Full Name" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">DOB</label>
                                    <input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number *</label>
                                    <input type="text" value={newStudent.phoneNumber} onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-4 py-2.5" placeholder="Contact No" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Parent Phone</label>
                                    <input type="text" value={newStudent.parentPhoneNumber} onChange={e => setNewStudent({ ...newStudent, parentPhoneNumber: e.target.value })} className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-4 py-2.5" placeholder="Guardian No" />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={handleManualSubmit} className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold rounded-2xl hover:bg-black dark:hover:bg-gray-600 shadow-lg transition-all active:scale-95">
                                    Confirm Enrollment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Identity</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule Info</th>
                                {canEdit && <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 transition-all">
                            {students.map(student => {
                                const data = getStudentData(student);
                                const isEditing = editingId === student._id;

                                return (
                                    <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors group">
                                        {isEditing ? (
                                            <>
                                                <td className="px-6 py-4 lg:w-1/4">
                                                    <input type="text" value={editStudent.studentName} onChange={e => setEditStudent({ ...editStudent, studentName: e.target.value })} className="w-full text-sm border-gray-200 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-800/20 px-3 py-2" />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <input type="text" value={editStudent.phoneNumber} onChange={e => setEditStudent({ ...editStudent, phoneNumber: e.target.value })} className="w-full text-xs border-gray-200 rounded-lg dark:bg-gray-700 dark:text-white px-3 py-1.5" placeholder="Phone" />
                                                        <input type="text" value={editStudent.parentPhoneNumber} onChange={e => setEditStudent({ ...editStudent, parentPhoneNumber: e.target.value })} className="w-full text-xs border-gray-200 rounded-lg dark:bg-gray-700 dark:text-white px-3 py-1.5" placeholder="Parent" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input type="date" value={editStudent.dob ? new Date(editStudent.dob).toISOString().split('T')[0] : ''} onChange={e => setEditStudent({ ...editStudent, dob: e.target.value })} className="w-full text-xs border-gray-200 rounded-lg dark:bg-gray-700 dark:text-white px-3 py-1.5" />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={handleEditSubmit} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg></button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-blue-950 flex items-center justify-center font-black text-xs border border-blue-100 dark:border-indigo-800">
                                                            {data.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div 
                                                                className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-950 transition-colors"
                                                                onClick={() => handleViewStudent(student)}
                                                            >
                                                                {data.name}
                                                            </div>
                                                            <div className="text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 tracking-tighter mt-0.5">#{data.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                            {data.phone}
                                                        </div>
                                                        {data.parentPhone && (
                                                            <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354l1.104 1.104a.5.5 0 010 .708L12 7.27a.5.5 0 01-.708 0L10.188 6.166a.5.5 0 010-.708L11.293 4.354a.5.5 0 01.707 0zM12 19.646L10.896 18.542a.5.5 0 010-.708L12 16.73a.5.5 0 01.708 0l1.104 1.104a.5.5 0 010 .708L12.707 19.646a.5.5 0 01-.707 0zM17.653 12L16.549 10.896a.5.5 0 010-.708L17.653 9.084a.5.5 0 01.708 0l1.104 1.104a.5.5 0 010 .708L18.36 12.707a.5.5 0 01-.707 0zM6.347 12l1.104 1.104a.5.5 0 010 .708L6.347 14.916a.5.5 0 01-.708 0L4.535 13.812a.5.5 0 010-.708l1.105-1.104a.5.5 0 01.707 0zM12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></svg>
                                                                G: {data.parentPhone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg w-fit">
                                                            DOB: {data.dob ? new Date(data.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                        {data.course && (
                                                            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">{data.course}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            {mergeSource ? (
                                                                mergeSource._id !== student._id ? (
                                                                    <button
                                                                        onClick={() => handleMergeAttendance(student)}
                                                                        className="p-2 text-blue-950 bg-indigo-50 rounded-xl hover:bg-blue-100 transition-all border border-blue-200 shadow-sm"
                                                                        title="Merge Attendance Into This Student"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                                        </svg>
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-[10px] font-black text-blue-950 bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200">SOURCE</span>
                                                                )
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleMarkForMerge(student)}
                                                                    className="p-2 text-gray-400 hover:text-blue-950 hover:bg-indigo-50 rounded-xl transition-all"
                                                                    title="Transfer Attendance"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleGenerateID(student)}
                                                                disabled={generatingId === student._id}
                                                                className={`p-2 rounded-xl transition-all ${generatingId === student._id ? 'text-gray-300' : 'text-gray-400 hover:text-blue-950 hover:bg-gray-100'}`}
                                                                title="Generate Student ID"
                                                            >
                                                                {generatingId === student._id ? (
                                                                    <div className="animate-spin w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full" />
                                                                ) : (
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            <button onClick={() => { setEditingId(student._id); setEditStudent(student); }} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                            <button onClick={() => handleDelete(student._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                        </div>
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                            {!isAdding && students.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-20 text-center animate-pulse">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354l1.104 1.104a.5.5 0 010 .708L12 7.27a.5.5 0 01-.708 0L10.188 6.166a.5.5 0 010-.708L11.293 4.354a.5.5 0 01.707 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Enrollments</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <StudentProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                student={selectedStudentForProfile}
            />
        </div>
    );
}
