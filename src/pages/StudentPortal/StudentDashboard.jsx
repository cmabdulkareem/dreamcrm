import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(`${API}/student-portal/dashboard`, { withCredentials: true });
                setData(res.data);
            } catch (err) {
                console.error("Dashboard fetch error", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) return <LoadingSpinner className="h-96" />;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;

    const { student, batches } = data;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {student.fullName}</h1>
                <p className="text-gray-500">Here's an overview of your learning journey.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Active Batches</p>
                        <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Joining Date</p>
                        <p className="text-lg font-bold text-gray-900">
                            {new Date(student.enrollmentDate).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Course Preference</p>
                        <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]" title={student.coursePreference}>
                            {student.coursePreference}
                        </p>
                    </div>
                </div>
            </div>

            {/* Batches List */}
            <h2 className="text-lg font-semibold text-gray-900 mt-8">My Batches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {batches.length > 0 ? (
                    batches.map(batch => (
                        <div key={batch._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{batch.batchName}</h3>
                                        <p className="text-sm text-gray-500">Instructor: {batch.instructorName}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                ${batch.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                            `}>
                                        {batch.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                    <div className="flex justify-between">
                                        <span>Start Date:</span>
                                        <span className="font-medium">{new Date(batch.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>End Date:</span>
                                        <span className="font-medium">{new Date(batch.expectedEndDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <Link to={`/student/attendance/${batch._id}`}>
                                    <button className="w-full py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors">
                                        View Detailed Attendance
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">You are not assigned to any batches yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
