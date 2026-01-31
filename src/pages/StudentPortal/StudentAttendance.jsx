import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../../config/api';
import { useParams, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function StudentAttendance() {
    const { batchId } = useParams(); // might need to adjust routing
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // If no batchId provided, maybe show list to select or fetch first?
    // For now assuming routed with ID or fetch all if not

    useEffect(() => {
        if (!batchId) return;

        const fetchAttendance = async () => {
            try {
                const res = await axios.get(`${API}/student-portal/attendance/${batchId}`, { withCredentials: true });
                setData(res.data);
            } catch (err) {
                console.error("Attendance fetch error", err);
                setError("Failed to load attendance records.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [batchId]);

    if (!batchId) return <div className="p-8">Please select a batch from the dashboard.</div>;
    if (loading) return <LoadingSpinner className="h-96" />;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;

    const { attendance, holidays, batch } = data;

    // Calculate stats
    const totalDays = attendance.length;
    const present = attendance.filter(r => r.status === 'Present').length;
    const absent = attendance.filter(r => r.status === 'Absent').length;
    const late = attendance.filter(r => r.status === 'Late').length;

    const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/student/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Details</h1>
                    <p className="text-gray-500">{batch.batchName}</p>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Attendance</p>
                    <p className={`text-2xl font-bold ${percentage >= 75 ? 'text-green-600' : 'text-orange-600'}`}>
                        {percentage}%
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Present</p>
                    <p className="text-2xl font-bold text-green-600">{present}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{absent}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Late</p>
                    <p className="text-2xl font-bold text-yellow-600">{late}</p>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 font-semibold text-gray-900">
                    History
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendance.map((record, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {new Date(record.date).toLocaleDateString(undefined, {
                                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                    record.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                                                        record.status === 'Holiday' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-gray-100 text-gray-800'}
                                    `}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {record.remarks || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
