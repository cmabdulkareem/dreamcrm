import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import API from '../../config/api';

export default function BatchStudentList({ batchId }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

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

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API}/batches/${batchId}/students`, newStudent, { withCredentials: true });
            setStudents([...students, response.data.student]);
            setIsAdding(false);
            setNewStudent(initialStudentState);
            toast.success("Student added successfully!");
        } catch (error) {
            toast.error("Failed to add student.");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${API}/batches/students/${editingId}`, editStudent, { withCredentials: true });
            setStudents(students.map(s => s._id === editingId ? response.data.student : s));
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

    if (loading) return <div className="text-sm text-gray-500 py-4">Loading students...</div>;

    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Students: {students.length}</h6>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
                >
                    {isAdding ? 'Cancel' : '+ Add Student'}
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Phone</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {isAdding && (
                            <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                                <td className="px-4 py-2"><input type="text" value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="ID" /></td>
                                <td className="px-4 py-2"><input type="text" value={newStudent.studentName} onChange={e => setNewStudent({ ...newStudent, studentName: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Name" /></td>
                                <td className="px-4 py-2"><input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
                                <td className="px-4 py-2"><input type="text" value={newStudent.phoneNumber} onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Phone" /></td>
                                <td className="px-4 py-2"><input type="text" value={newStudent.parentPhoneNumber} onChange={e => setNewStudent({ ...newStudent, parentPhoneNumber: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" placeholder="Parent Phone" /></td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={handleAddSubmit} className="text-green-600 hover:text-green-800 mr-2"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                                </td>
                            </tr>
                        )}
                        {students.map(student => (
                            <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                {editingId === student._id ? (
                                    <>
                                        <td className="px-4 py-2"><input type="text" value={editStudent.studentId} onChange={e => setEditStudent({ ...editStudent, studentId: e.target.value })} className="w-full text-sm border-gray-300 rounded dark:bg-gray-800 dark:text-white" /></td>
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
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{student.studentId}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{student.studentName}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{new Date(student.dob).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{student.phoneNumber}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{student.parentPhoneNumber || '-'}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => { setEditingId(student._id); setEditStudent(student); }} className="text-gray-400 hover:text-indigo-600 mr-2"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button onClick={() => handleDelete(student._id)} className="text-gray-400 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {!isAdding && students.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-10 text-center text-sm text-gray-500">No students enrolled in this batch yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
