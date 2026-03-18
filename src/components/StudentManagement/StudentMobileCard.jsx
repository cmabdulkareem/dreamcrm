import React from "react";
import Badge from "../ui/badge/Badge";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
    PencilIcon,
    VerticalDotsIcon,
    UserIcon,
    FileIcon,
    CalendarIcon,
    RupeeIcon,
    EyeIcon,
    TrashIcon,
} from "../../icons";

/**
 * StudentMobileCard
 * Mobile card view for a single student. Wrapped in React.memo.
 */
const StudentMobileCard = ({
    student,
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
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-60 ${student.batchScheduled ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 pl-1">
                <div className="flex gap-3 min-w-0">
                    <img
                        className="h-12 w-12 rounded-xl object-cover border-2 border-gray-100 dark:border-gray-800 flex-shrink-0"
                        src={getPhotoUrl(student.photo)}
                        alt={student.fullName}
                        onError={(e) => {
                            e.target.src = "/images/user/user-01.jpg";
                        }}
                    />
                    <div className="flex flex-col gap-1.5 min-w-0">
                        <h4
                            className="text-[17px] font-black text-gray-950 dark:text-white leading-tight truncate cursor-pointer hover:text-brand-500"
                            onClick={() => onViewProfile(student)}
                        >
                            {student.fullName}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <span className="text-gray-400 text-[10px] font-bold tracking-wider">{student.studentId}</span>
                            <Badge variant="secondary" color="success" className="font-bold px-2 py-0.5 text-[9px] uppercase tracking-wider opacity-80">
                                Active
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isUserCounsellor && (
                        <button
                            onClick={() => onEdit(student)}
                            className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-brand-500 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
                            title="Edit Student"
                        >
                            <PencilIcon className="size-4.5" />
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => onToggleDropdown(student._id + "_mobile")}
                            className="size-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition-all active:scale-95"
                        >
                            <VerticalDotsIcon className="size-5" />
                        </button>
                        <Dropdown
                            isOpen={openDropdownId === student._id + "_mobile"}
                            onClose={onDropdownClose}
                            className="w-48 top-full mt-2 shadow-2xl"
                        >
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onView(student); }}
                                className="flex items-center gap-3 py-3 px-4 text-blue-600 dark:text-blue-400 font-semibold text-sm"
                            >
                                <EyeIcon className="size-4" /> View Details
                            </DropdownItem>
                            {!isUserCounsellor && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDate(student); }}
                                    className="flex items-center gap-3 py-3 px-4 text-amber-600 dark:text-amber-400 font-semibold text-sm"
                                >
                                    <CalendarIcon className="size-4" /> Update Date
                                </DropdownItem>
                            )}
                            {!isUserCounsellor && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDelete(student); }}
                                    className="flex items-center gap-3 py-3 px-4 text-red-600 dark:text-red-400 font-semibold text-sm"
                                >
                                    <TrashIcon className="size-4" /> Delete Student
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Phone */}
            <div className="mb-4 pl-1">
                <a href={`tel:${student.phone1}`} className="text-brand-600 dark:text-brand-400 text-[14px] font-black flex items-center gap-2.5 bg-brand-50/50 dark:bg-brand-500/5 px-3 py-1.5 rounded-lg w-fit border border-brand-100/50 dark:border-brand-500/10">
                    <UserIcon className="size-4 text-brand-400" />
                    {student.phone1}
                </a>
            </div>

            {/* Batch Status */}
            <div className="mb-5 pl-1">
                <div className={`inline-flex items-center gap-2 rounded-full py-1.5 px-4 border shadow-sm ${student.batchScheduled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                    <CalendarIcon className="size-3.5 opacity-60" />
                    <span className="text-[12px] font-bold uppercase tracking-tight">
                        Batch: {student.batchScheduled ? 'Assigned' : 'Unassigned'}
                    </span>
                </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-2 pl-1">
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <FileIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Course</span>
                        <span className="text-gray-900 dark:text-gray-100 font-bold text-xs truncate">
                            {student.courseDetails?.courseName || student.coursePreference}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <RupeeIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Amount</span>
                        <span className="text-gray-900 dark:text-gray-100 font-black text-xs">₹{student.finalAmount || 0}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <CalendarIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Enrollment</span>
                        <span className="text-gray-700 dark:text-gray-200 font-bold text-xs">
                            {new Date(student.enrollmentDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <UserIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Email</span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium text-[11px] truncate">{student.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(StudentMobileCard);
