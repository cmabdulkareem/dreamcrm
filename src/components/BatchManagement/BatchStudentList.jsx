import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, isOwner, isManager } from '../../utils/roleHelpers';
import LoadingSpinner from '../common/LoadingSpinner';

import StudentProfileModal from '../StudentManagement/StudentProfileModal';

export default function BatchStudentList({ batchId, batchSubject, batchStartDate, batchEndDate, brandName }) {
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
            // Fetch all students from Manage Students list
            const response = await axios.get(`${API}/students/all`, { withCredentials: true });
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

    if (loading) return <LoadingSpinner className="py-10" />;

    return (
        <div className="mt-4">
            {mergeSource && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex justify-between items-center animate-pulse">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-bold">Merge Mode:</span> Select a target student to move <span className="underline">{mergeSource.studentName}'s</span> attendance into.
                    </div>
                    <button
                        onClick={() => setMergeSource(null)}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
                    >
                        Cancel
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Students: {students.length}</h6>
                {canEdit && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-xs font-semibold px-3 py-1 bg-brand-50 text-brand-600 rounded-md hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400"
                    >
                        {isAdding ? 'Done Adding' : '+ Add Student'}
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="mb-4 p-4 bg-brand-50/50 dark:bg-brand-900/20 rounded-lg border border-brand-100 dark:border-brand-800">
                    <h5 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Add Student to Batch</h5>
                    <div className="mb-4 relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Search Student (from Manage Students)</label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search by name, phone or ID..."
                            className="w-full text-sm border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowResults(false);
                                }, 200);
                            }}
                        />
                        {showResults && searchTerm && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-2 text-xs text-gray-500">Loading...</div>
                                ) : filteredConvertedStudents.length > 0 ? (
                                    filteredConvertedStudents.map(student => (
                                        <div
                                            key={student._id}
                                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleQuickAddStudent(student)}
                                        >
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                                            <div className="text-xs text-gray-500">{student.studentId || 'No ID'} | {student.phone1}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-gray-500">No matching students found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                        <div className="text-xs text-gray-400 mb-2 italic">Or enter details manually if not found in search:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">ID (Opt)</label>
                                <input type="text" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Custom ID" />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                                <input type="text" value={newStudent.studentName} onChange={e => setNewStudent({ ...newStudent, studentName: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Name" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">DOB</label>
                                <input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                                <input type="text" value={newStudent.phoneNumber} onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Phone" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Parent Phone</label>
                                <input type="text" value={newStudent.parentPhoneNumber} onChange={e => setNewStudent({ ...newStudent, parentPhoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Parent (Opt)" />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button onClick={handleManualSubmit} className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 shadow-sm">
                                Add Manually
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Phone</th>
                            {canEdit && <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {students.map(student => {
                            const data = getStudentData(student);
                            return (
                                <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    {editingId === student._id ? (
                                        <>
                                            <td className="px-4 py-2"><input type="text" value={editStudent.studentId} disabled className="w-full text-sm border-gray-300 rounded bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-white" /></td>
                                            <td className="px-4 py-2"><input type="text" value={editStudent.studentName} onChange={e => setEditStudent({ ...editStudent, studentName: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
                                            <td className="px-4 py-2"><input type="date" value={editStudent.dob ? new Date(editStudent.dob).toISOString().split('T')[0] : ''} onChange={e => setEditStudent({ ...editStudent, dob: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
                                            <td className="px-4 py-2"><input type="text" value={editStudent.phoneNumber} onChange={e => setEditStudent({ ...editStudent, phoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
                                            <td className="px-4 py-2"><input type="text" value={editStudent.parentPhoneNumber} onChange={e => setEditStudent({ ...editStudent, parentPhoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
                                            <td className="px-4 py-2 text-right">
                                                <button onClick={handleEditSubmit} className="text-green-600 hover:text-green-800 mr-2"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                                                <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-800"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{data.id}</td>
                                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                                <span
                                                    className="cursor-pointer hover:text-brand-600 transition-colors font-medium"
                                                    onClick={() => handleViewStudent(student)}
                                                >
                                                    {data.name}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{data.dob ? new Date(data.dob).toLocaleDateString() : '-'}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{data.phone}</td>
                                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{data.parentPhone || '-'}</td>
                                            {canEdit && (
                                                <td className="px-4 py-2 text-right flex items-center justify-end space-x-2">
                                                    {mergeSource ? (
                                                        mergeSource._id !== student._id ? (
                                                            <button
                                                                onClick={() => handleMergeAttendance(student)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 bg-blue-50/50"
                                                                title="Merge Here"
                                                            >
                                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">Source</span>
                                                        )
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkForMerge(student)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                            title="Mark for Attendance Merge"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleGenerateID(student)}
                                                        disabled={generatingId === student._id}
                                                        className={`p-1.5 rounded-md transition-colors ${generatingId === student._id ? 'text-gray-300' : 'text-brand-500 hover:bg-brand-50'}`}
                                                        title="Generate ID Card"
                                                    >
                                                        {generatingId === student._id ? (
                                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : (
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button onClick={() => { setEditingId(student._id); setEditStudent(student); }} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-md transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                    <button onClick={() => handleDelete(student._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </td>
                                            )}
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                        {!isAdding && students.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-10 text-center text-sm text-gray-500">No students enrolled in this batch yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <StudentProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                student={selectedStudentForProfile}
            />
        </div>
    );
}
