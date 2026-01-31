import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import API from '../config/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PublicAttendance() {
    const { shareToken } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [error, setError] = useState(null);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        fetchData();
    }, [shareToken, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/batches/public/${shareToken}?month=${selectedMonth}&year=${selectedYear}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch public attendance:", err);
            setError(err.response?.data?.message || "Failed to load attendance report. The link might be invalid or expired.");
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const processAttendance = () => {
        if (!data) return { studentMap: {}, statsMap: {}, monthlySummary: {}, dailyStats: {} };
        const { students, attendance, batch, holidays = [] } = data;
        const studentMap = {};
        const statsMap = {};
        const monthlySummary = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, weekOff: 0 };
        const dailyStats = {};

        // 0. Map holidays
        const holidaySet = new Set(holidays.map(h => new Date(h.date).getDate()));

        const today = new Date();
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const batchStart = batch?.startDate ? new Date(batch.startDate) : new Date(0);
        const batchStartNormalized = new Date(batchStart.getFullYear(), batchStart.getMonth(), batchStart.getDate());

        // Initialize maps
        students.forEach(s => {
            studentMap[s._id] = {};
            statsMap[s._id] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, weekOff: 0, totalSessions: 0 };
        });

        const earliestMarkMap = {};

        // 1. Map existing attendance data
        attendance.forEach(record => {
            const recordDate = new Date(record.date);
            const day = recordDate.getDate();

            record.records.forEach(studentRec => {
                if (studentMap[studentRec.studentId]) {
                    studentMap[studentRec.studentId][day] = studentRec.status;

                    if (!earliestMarkMap[studentRec.studentId] || recordDate < earliestMarkMap[studentRec.studentId]) {
                        earliestMarkMap[studentRec.studentId] = recordDate;
                    }
                }
            });
        });

        // 2. Process each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(selectedYear, selectedMonth - 1, day);

            // Only consider dates within [batchStart, today]
            if (currentDate >= batchStartNormalized && currentDate <= todayNormalized) {

                if (!dailyStats[day]) {
                    dailyStats[day] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, weekOff: 0 };
                }

                students.forEach(student => {
                    const studentJoinDate = new Date(student.createdAt);
                    studentJoinDate.setHours(0, 0, 0, 0);

                    let studentEffectiveStart = studentJoinDate;
                    if (earliestMarkMap[student._id] && earliestMarkMap[student._id] < studentEffectiveStart) {
                        studentEffectiveStart = new Date(earliestMarkMap[student._id]);
                        studentEffectiveStart.setHours(0, 0, 0, 0);
                    }

                    if (studentEffectiveStart < batchStartNormalized) {
                        studentEffectiveStart = batchStartNormalized;
                    }

                    const sStats = statsMap[student._id];
                    let status = studentMap[student._id][day];

                    let isConsideredSession = false;
                    let finalStatus = status;

                    if (status) {
                        if (status !== 'Holiday' && status !== 'Week Off') {
                            isConsideredSession = true;
                        }
                    } else if (currentDate >= studentEffectiveStart) {
                        if (holidaySet.has(day)) {
                            finalStatus = 'Holiday';
                            studentMap[student._id][day] = 'Holiday';
                            isConsideredSession = false;
                        } else if (currentDate.getDay() === 0) { // Sunday Rule: Always Week Off by default
                            finalStatus = 'Week Off';
                            studentMap[student._id][day] = 'Week Off';
                            isConsideredSession = false;
                        } else {
                            isConsideredSession = true;
                            finalStatus = 'Present';
                            studentMap[student._id][day] = 'Present';
                        }
                    }

                    if (!isConsideredSession) {
                        if (finalStatus === 'Holiday') {
                            sStats.holiday++;
                            monthlySummary.holiday++;
                            dailyStats[day].holiday++;
                        } else if (finalStatus === 'Week Off') {
                            sStats.weekOff++;
                            monthlySummary.weekOff++;
                            dailyStats[day].weekOff++;
                        }
                        return;
                    }

                    // Process working day
                    sStats.totalSessions++;
                    if (finalStatus === 'Absent') {
                        sStats.absent++;
                        monthlySummary.absent++;
                        dailyStats[day].absent++;
                    } else {
                        sStats.present++;
                        if (finalStatus === 'Present') {
                            monthlySummary.present++;
                            dailyStats[day].present++;
                        } else if (finalStatus === 'Late') {
                            sStats.late++;
                            monthlySummary.late++;
                            dailyStats[day].late++;
                        } else if (finalStatus === 'Excused') {
                            sStats.excused++;
                            monthlySummary.excused++;
                            dailyStats[day].excused++;
                        }
                    }
                });
            }
        }

        return { studentMap, statsMap, monthlySummary, dailyStats };
    };

    const { studentMap, statsMap, monthlySummary, dailyStats } = processAttendance();

    const renderStatusCell = (status) => {
        if (!status) return <span className="text-gray-200 text-[10px]">-</span>;
        let colorClass = "";
        let label = status.charAt(0);
        switch (status) {
            case 'Present': colorClass = "bg-green-100 text-green-800 border-green-200"; break;
            case 'Absent': colorClass = "bg-red-100 text-red-800 border-red-200"; break;
            case 'Late': colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200"; break;
            case 'Excused': colorClass = "bg-blue-100 text-blue-800 border-blue-200"; break;
            case 'Holiday': colorClass = "bg-purple-100 text-purple-800 border-purple-200"; break;
            case 'Week Off': colorClass = "bg-gray-100 text-gray-800 border-gray-200"; break;
            default: colorClass = "bg-gray-50 text-gray-400"; break;
        }
        return (
            <div className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[9px] sm:text-[10px] font-bold mx-auto border ${colorClass}`}>
                {label}
            </div>
        );
    };

    if (loading && !data) return <div className="h-screen flex items-center justify-center bg-white"><LoadingSpinner /></div>;
    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30 px-4 py-4 sm:px-6 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{data.batch.batchName}</h1>
                            <p className="text-sm text-gray-500 font-medium">{data.batch.subject} • {data.batch.instructorName}</p>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="text-sm p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="text-sm p-2 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                {/* Monthly Summary Indicators */}
                <div className="mb-6 p-4 bg-white rounded-2xl border shadow-sm overflow-x-auto no-scrollbar">
                    <div className="flex gap-4 sm:gap-8 min-w-max pb-1">
                        {[
                            { l: 'P', n: 'Pres.', c: 'bg-green-100 text-green-800 border-green-200', count: monthlySummary.present },
                            { l: 'A', n: 'Abs.', c: 'bg-red-100 text-red-800 border-red-200', count: monthlySummary.absent },
                            { l: 'L', n: 'Late', c: 'bg-yellow-100 text-yellow-800 border-yellow-200', count: monthlySummary.late },
                            { l: 'E', n: 'Exc.', c: 'bg-blue-100 text-blue-800 border-blue-200', count: monthlySummary.excused },
                            { l: 'H', n: 'Hol.', c: 'bg-purple-100 text-purple-800 border-purple-200', count: monthlySummary.holiday },
                            { l: 'W', n: 'Off', c: 'bg-gray-100 text-gray-800 border-gray-200', count: monthlySummary.weekOff }
                        ].map(item => (
                            <div key={item.l} className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${item.c}`}>
                                    {item.l}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{item.n}</span>
                                    <span className="text-lg font-black text-gray-900 leading-none">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-white rounded-2xl border shadow-lg overflow-hidden flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-20 border-r min-w-[140px] sm:min-w-[180px]">
                                        Student
                                    </th>
                                    {daysArray.map(day => {
                                        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                        const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()];
                                        const isSunday = dateObj.getDay() === 0;
                                        return (
                                            <th key={day} className={`px-1 py-3 text-center text-[10px] font-bold min-w-[34px] border-l ${isSunday ? 'text-red-500 bg-red-50' : 'text-gray-400'}`}>
                                                <div className="text-[9px] opacity-70 mb-0.5">{dayName}</div>
                                                <div className="text-xs">{day}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="px-4 py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest sticky right-0 bg-gray-50 z-20 border-l min-w-[70px]">
                                        Att. %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {data.students.map((student, idx) => {
                                    const stats = statsMap[student._id] || { present: 0, totalSessions: 0 };
                                    const percentage = stats.totalSessions > 0 ? Math.round((stats.present / stats.totalSessions) * 100) : 0;
                                    return (
                                        <tr key={student._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 z-10 bg-inherit border-r">
                                                {student.studentName}
                                            </td>
                                            {daysArray.map(day => {
                                                const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                                const isSunday = dateObj.getDay() === 0;
                                                return (
                                                    <td key={day} className={`px-1 py-2 text-center border-l border-gray-50 ${isSunday ? 'bg-red-50/30' : ''}`}>
                                                        {renderStatusCell(studentMap[student._id]?.[day])}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center text-xs sticky right-0 z-10 bg-inherit border-l font-black">
                                                <span className={percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                    {percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 text-center">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                    Generated by CRM Attendance Portal
                </p>
            </footer>
        </div>
    );
}
