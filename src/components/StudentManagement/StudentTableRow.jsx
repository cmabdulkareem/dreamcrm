import React from "react";
import {
    TableCell,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
    PencilIcon,
    VerticalDotsIcon,
    EyeIcon,
    CalendarIcon,
    TrashIcon,
} from "../../icons";

/**
 * StudentTableRow
 * Desktop table row for a single student. Wrapped in React.memo.
 */
const StudentTableRow = ({
    student,
    index,
    onEdit,
    onView,
    onDate,
    onViewProfile,
    openDropdownId,
    onToggleDropdown,
    onDropdownClose,
    isUserCounsellor,
    getPhotoUrl,
    onDelete,
}) => {
    return (
        <TableRow className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0">
            {/* Row Number */}
            <TableCell className="py-4 px-4 text-gray-500 dark:text-gray-400 text-[11px] font-bold tabular-nums">
                {index}
            </TableCell>

            {/* Photo */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="flex-shrink-0 h-10 w-10">
                    <img
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                        src={getPhotoUrl(student.photo)}
                        alt={student.fullName}
                        onError={(e) => {
                            e.target.src = "/images/user/user-01.jpg";
                        }}
                    />
                </div>
            </TableCell>

            {/* Student Name + ID + Batch Status */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="flex flex-col min-w-0">
                    <span
                        className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 cursor-pointer hover:text-brand-500 transition-colors truncate"
                        onClick={() => onViewProfile(student)}
                    >
                        {student.fullName}
                    </span>
                    <span className="text-gray-400 text-[11px] font-medium">{student.studentId}</span>
                    <div className="mt-1">
                        {student.batchScheduled ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                Assigned
                            </span>
                        ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 font-bold uppercase tracking-wider">
                                Unassigned
                            </span>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Contact: Email + Phone */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="flex flex-col min-w-0">
                    <span className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[180px]">{student.email}</span>
                    <a href={`tel:${student.phone1}`} className="text-brand-500 hover:underline text-[12px] font-bold mt-0.5 tracking-tight">{student.phone1}</a>
                </div>
            </TableCell>

            {/* Course Details */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="max-w-[200px]">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 text-xs truncate">
                        {student.courseDetails ?
                            `${student.courseDetails.courseCode} - ${student.courseDetails.courseName}` :
                            student.coursePreference}
                    </p>
                    {student.additionalCourseDetails && student.additionalCourseDetails.length > 0 && (
                        <p className="text-[10px] text-brand-500 font-bold mt-0.5 uppercase tracking-wide">
                            +{student.additionalCourseDetails.length} Additional
                        </p>
                    )}
                </div>
            </TableCell>

            {/* Amount & Fee Type */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                <div className="flex flex-col items-center gap-1.5">
                    <span className="font-bold text-gray-900 dark:text-white text-theme-sm tabular-nums">₹{student.finalAmount || 0}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${student.feeType === 'singleShot' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400'}`}>
                        {student.feeType === 'singleShot' ? 'Single' : 'Normal'}
                    </span>
                </div>
            </TableCell>

            {/* Enrollment Date */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                   <CalendarIcon className="size-3.5 opacity-50" />
                   <span className="tabular-nums">{new Date(student.enrollmentDate).toLocaleDateString()}</span>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50 text-center">
                <Badge size="sm" color="success" className="font-bold uppercase tracking-widest text-[10px]">
                    Active
                </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="flex items-center justify-center gap-2">
                    {!isUserCounsellor && (
                        <button
                            onClick={() => onEdit(student)}
                            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 transition-colors shadow-sm"
                            title="Edit"
                        >
                            <PencilIcon className="size-4.5" />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => onToggleDropdown(student._id)}
                            className="size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05] transition-all"
                        >
                            <VerticalDotsIcon className="size-5" />
                        </button>
                        <Dropdown isOpen={openDropdownId === student._id} onClose={onDropdownClose} className="w-40">
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onView(student); }}
                                className="flex items-center gap-2 text-blue-500 font-semibold"
                            >
                                <EyeIcon className="size-4" /> View Details
                            </DropdownItem>
                            {!isUserCounsellor && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDate(student); }}
                                    className="flex items-center gap-2 text-amber-600 font-semibold"
                                >
                                    <CalendarIcon className="size-4" /> Update Date
                                </DropdownItem>
                            )}
                            {!isUserCounsellor && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDelete(student); }}
                                    className="flex items-center gap-2 text-red-600 font-semibold"
                                >
                                    <TrashIcon className="size-4" /> Delete Student
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default React.memo(StudentTableRow);
