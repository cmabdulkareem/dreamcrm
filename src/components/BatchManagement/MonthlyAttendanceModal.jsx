import React, { useState, useEffect } from 'react';
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import axios from 'axios';
import API from '../../config/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { X, Hash } from 'lucide-react';

export default function MonthlyAttendanceModal({ isOpen, onClose, batch, viewStudentId, initialDate }) {
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(initialDate ? new Date(initialDate).getMonth() + 1 : new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(initialDate ? new Date(initialDate).getFullYear() : new Date().getFullYear());
    const [attendanceData, setAttendanceData] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        if (isOpen && initialDate) {
            setSelectedMonth(new Date(initialDate).getMonth() + 1);
            setSelectedYear(new Date(initialDate).getFullYear());
        }
    }, [isOpen, initialDate]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        if (isOpen && batch) {
            fetchData();
        }
    }, [isOpen, batch, selectedMonth, selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const studentsRes = await axios.get(`${API}/batches/${batch._id}/students`, { withCredentials: true });
            const studentList = studentsRes.data.students;
            setStudents(studentList);

            const [attendanceRes, holidayRes] = await Promise.all([
                axios.get(`${API}/batches/${batch._id}/attendance?month=${selectedMonth}&year=${selectedYear}`, { withCredentials: true }),
                axios.get(`${API}/holidays?month=${selectedMonth}&year=${selectedYear}`, { withCredentials: true })
            ]);
            setAttendanceData(attendanceRes.data.attendance);
            setHolidays(holidayRes.data.holidays);

            // Merge historical students (those in attendance records but not in current batch list)
            const activeIds = new Set(studentList.map(s => s._id));
            const historicalMap = new Map();
            
            attendanceRes.data.attendance.forEach(record => {
                record.records.forEach(studentRec => {
                    if (!activeIds.has(studentRec.studentId)) {
                        historicalMap.set(studentRec.studentId, {
                            _id: studentRec.studentId,
                            studentName: studentRec.studentName,
                            createdAt: record.date, // Fallback to record date
                            isHistorical: true
                        });
                    }
                });
            });

            if (historicalMap.size > 0) {
                setStudents([...studentList, ...Array.from(historicalMap.values())]);
            }

        } catch (error) {
            console.error("Failed to fetch monthly attendance:", error);
            toast.error("Failed to load attendance report.");
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const processAttendance = () => {
        const studentMap = {};
        const statsMap = {};
        const dailyStats = {};

        const today = new Date();
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const batchStart = batch?.startDate ? new Date(batch.startDate) : new Date(0);
        const batchStartNormalized = new Date(batchStart.getFullYear(), batchStart.getMonth(), batchStart.getDate());

        students.forEach(s => {
            studentMap[s._id] = {};
            statsMap[s._id] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, weekOff: 0, totalSessions: 0 };
        });

        const firstMarkMap = {};

        attendanceData.forEach(record => {
            const recordDate = new Date(record.date);
            const day = recordDate.getDate();
            record.records.forEach(studentRec => {
                if (studentMap[studentRec.studentId]) {
                    studentMap[studentRec.studentId][day] = studentRec.status;
                    if (!firstMarkMap[studentRec.studentId] || recordDate < firstMarkMap[studentRec.studentId]) {
                        firstMarkMap[studentRec.studentId] = recordDate;
                    }
                }
            });
        });

        // Calculate Batch-level Holidays and Week Offs separately (once per month, not per student)
        const holidaySet = new Set(holidays.map(h => new Date(h.date).getDate()));

        let batchHolidayCount = 0;
        let batchWeekOffCount = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(selectedYear, selectedMonth - 1, day);
            if (holidaySet.has(day)) {
                batchHolidayCount++;
            } else if (currentDate.getDay() === 0) {
                batchWeekOffCount++;
            }
        }

        const monthlySummary = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            holiday: batchHolidayCount,
            weekOff: batchWeekOffCount
        };

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(selectedYear, selectedMonth - 1, day);
            const isFutureDate = currentDate > todayNormalized;

            // Initialize dailyStats
            if (!dailyStats[day]) {
                dailyStats[day] = { present: 0, absent: 0, late: 0, excused: 0, holiday: 0, weekOff: 0 };
            }

            students.forEach(student => {
                const studentJoinDate = new Date(student.createdAt || batchStartNormalized);
                if (isNaN(studentJoinDate.getTime())) {
                    studentJoinDate.setTime(batchStartNormalized.getTime());
                }
                studentJoinDate.setHours(0, 0, 0, 0);

                let studentEffectiveStart = studentJoinDate;
                if (firstMarkMap[student._id] && firstMarkMap[student._id] < studentEffectiveStart) {
                    studentEffectiveStart = new Date(firstMarkMap[student._id]);
                    studentEffectiveStart.setHours(0, 0, 0, 0);
                }
                if (studentEffectiveStart < batchStartNormalized) {
                    studentEffectiveStart = batchStartNormalized;
                }

                const sStats = statsMap[student._id];
                let status = studentMap[student._id][day];
                let isConsideredSession = false;
                let finalStatus = status;

                // Priority 1: Check existing manual status
                if (status) {
                    if (status !== 'Holiday' && status !== 'Week Off') {
                        isConsideredSession = true;
                    }
                }
                // Priority 2: Check for Global Holiday or Sunday (Default WO)
                else if (currentDate >= studentEffectiveStart) {
                    if (holidaySet.has(day)) {
                        finalStatus = 'Holiday';
                        studentMap[student._id][day] = 'Holiday';
                    } else if (currentDate.getDay() === 0) {
                        finalStatus = 'Week Off';
                        studentMap[student._id][day] = 'Week Off';
                    }
                }

                // Increment student-specific stats
                if (finalStatus === 'Holiday') {
                    sStats.holiday++;
                    dailyStats[day].holiday++;
                } else if (finalStatus === 'Week Off') {
                    sStats.weekOff++;
                    dailyStats[day].weekOff++;
                }

                if (isConsideredSession && !isFutureDate) {
                    sStats.totalSessions++;
                    if (finalStatus === 'Absent') {
                        sStats.absent++;
                        dailyStats[day].absent++;
                    } else {
                        sStats.present++;
                        if (finalStatus === 'Present') {
                            dailyStats[day].present++;
                        } else if (finalStatus === 'Late') {
                            sStats.late++;
                            dailyStats[day].late++;
                        } else if (finalStatus === 'Excused') {
                            sStats.excused++;
                            dailyStats[day].excused++;
                        }
                    }
                }
            });
        }
        return { studentMap, statsMap, monthlySummary, dailyStats };
    };

    const { studentMap, statsMap, monthlySummary, dailyStats } = processAttendance();

    const renderStatusCell = (status) => {
        if (!status) return <span className="text-gray-200 text-xs">-</span>;
        let colorClass = "text-gray-500";
        let label = status.charAt(0);
        switch (status) {
            case 'Present': colorClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"; break;
            case 'Absent': colorClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"; break;
            case 'Late': colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"; break;
            case 'Excused': colorClass = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"; break;
            case 'Holiday': colorClass = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"; break;
            case 'Week Off': colorClass = "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700"; break;
            default: colorClass = "bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800/50 dark:text-gray-600 dark:border-gray-800"; break;
        }
        return (
            <div className={`w-6 h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold mx-auto border ${colorClass}`}>
                {label}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl p-0 h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Standard CRM Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-950 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            Attendance Analytics
                        </span>
                        <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                                {batch?.batchName}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Monthly Attendance Report
                        </h3>
                        <div className="flex gap-2">
                            <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                                className="text-[10px] uppercase font-bold tracking-widest p-1.5 px-3 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                            >
                                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))} 
                                className="text-[10px] uppercase font-bold tracking-widest p-1.5 px-3 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 flex flex-col flex-1 overflow-hidden bg-white dark:bg-gray-900 border-none">

            {!loading && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 shrink-0">
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 tracking-widest">Monthly Status Indicators</div>
                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                        {[
                            { l: 'H', n: 'Holiday', c: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', count: monthlySummary.holiday },
                            { l: 'W', n: 'Week Off', c: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400', count: monthlySummary.weekOff }
                        ].map(item => (
                            <div key={item.l} className="flex items-center gap-3">
                                <span className={`w-7 h-7 flex items-center justify-center text-xs font-bold border shadow-sm ${item.c}`}>{item.l}</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase leading-none mb-1">{item.n}</span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-white leading-none">{item.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
                {loading ? <LoadingSpinner className="h-full" /> : (
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 dark:bg-gray-800/80 z-30 border-r border-gray-100 dark:border-gray-700 min-w-[180px]">Student Identity</th>
                                    {daysArray.map(day => {
                                        const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                        const isSunday = dateObj.getDay() === 0;
                                        return (
                                            <th key={day} className={`px-2 py-3 text-center text-[9px] font-black min-w-[36px] border-l border-gray-100 dark:border-gray-800 transition-colors ${isSunday ? 'text-rose-500 bg-rose-50/20 dark:bg-rose-900/10' : 'text-gray-400 dark:text-gray-500'}`}>
                                                <div className="uppercase opacity-50 mb-0.5">{['S', 'M', 'T', 'W', 'T', 'F', 'S'][dateObj.getDay()]}</div>
                                                <div className="text-[11px] text-gray-600 dark:text-gray-300">{day}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80 sticky right-[70px] z-30 border-l border-gray-100 dark:border-gray-700 w-[100px]">Sessions</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80 sticky right-0 z-30 border-l border-gray-100 dark:border-gray-700 w-[70px]">%</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-50 dark:divide-gray-800">
                                {students.map(student => {
                                    const stats = statsMap[student._id] || { present: 0, totalSessions: 0 };
                                    const percentage = stats.totalSessions > 0 ? Math.round((stats.present / stats.totalSessions) * 100) : 0;
                                    const isHighlighted = viewStudentId && (student._id === viewStudentId || student.studentId === viewStudentId || (student.studentId?._id === viewStudentId));
                                    
                                    return (
                                        <tr key={student._id} className={`${isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500 z-10 relative' : 'hover:bg-blue-50/10 dark:hover:bg-blue-900/5'} transition-colors`}>
                                            <td className={`px-6 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white sticky left-0 z-20 border-r border-gray-100 dark:border-gray-800 min-w-[180px] ${isHighlighted ? 'bg-blue-50 dark:bg-blue-900 text-blue-950 dark:text-blue-300' : 'bg-white dark:bg-gray-900'}`}>{student.studentName}</td>
                                            {daysArray.map(day => {
                                                const dateObj = new Date(selectedYear, selectedMonth - 1, day);
                                                return <td key={day} className={`px-1 py-2 text-center border-l border-gray-50 dark:border-gray-800 ${dateObj.getDay() === 0 ? 'bg-rose-50/5 dark:bg-rose-950/5' : ''}`}>{renderStatusCell(studentMap[student._id]?.[day])}</td>;
                                            })}
                                            <td className="px-6 py-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300 sticky right-[70px] bg-gray-50/30 dark:bg-gray-800/30 z-10 border-l border-gray-100 dark:border-gray-700 w-[100px]">
                                                <span className="text-emerald-600 dark:text-emerald-400">{stats.present}</span>
                                                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                                                {stats.totalSessions}
                                            </td>
                                            <td className="px-6 py-3 text-center text-sm sticky right-0 bg-white dark:bg-gray-900 z-10 border-l border-gray-100 dark:border-gray-700 font-black w-[70px]">
                                                <span className={percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : percentage >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>{percentage}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            <div className="mt-6 flex justify-end shrink-0 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" onClick={onClose} className="px-8 font-bold uppercase text-[10px] tracking-widest h-10">
                    Exit Report
                </Button>
            </div>
        </div>
    </Modal>
    );
}
