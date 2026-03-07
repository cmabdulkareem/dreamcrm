import React from "react";
import Badge from "../../ui/badge/Badge";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import { Bell } from "lucide-react";
import {
    BoltIcon,
    PencilIcon,
    VerticalDotsIcon,
    UserIcon,
    FileIcon,
    CalendarIcon,
    ChatIcon,
    TrashBinIcon,
} from "../../../icons";
import { formatDate, getLeadStatusColor, getLeadStatusLabel, getLatestRemark, hasUnreadRemarks } from "../leadHelpers";
import { getDueDateBadgeColor, getDueDateBadgeText } from "../leadTableHelpers";

/**
 * LeadMobileCard
 * Mobile card view for a single lead. Wrapped in React.memo.
 */
const LeadMobileCard = ({
    row,
    openDropdownId,
    onEdit,
    onDelete,
    onAlarm,
    onImmediateFollowup,
    onAssign,
    onToggleDropdown,
    onDropdownClose,
    canAssignLeads,
}) => {
    const latestRemark = getLatestRemark(row.remarks);
    const statusColor = getLeadStatusColor(row.leadStatus);

    const stripColor = statusColor === 'primary' ? '#e91e63'
        : statusColor === 'success' ? '#10b981'
            : statusColor === 'warning' ? '#f59e0b'
                : '#3b82f6';

    const badgeStyle = getDueDateBadgeColor(row.followUpDate);

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
            {/* Status Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-60" style={{ backgroundColor: stripColor }} />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 pl-1">
                <div className="flex flex-col gap-1.5">
                    <h4 className="text-[18px] font-black text-gray-950 dark:text-white leading-tight">{row.fullName}</h4>
                    <Badge variant="secondary" color={statusColor} className="w-fit font-bold px-2.5 py-0.5 text-[10px] uppercase tracking-wider shadow-sm opacity-80">
                        {getLeadStatusLabel(row.leadStatus)}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(row)}
                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-brand-500 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
                        title="Edit Lead"
                    >
                        <PencilIcon className="size-4.5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => onToggleDropdown(row._id + "_mobile")}
                            className="size-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition-all active:scale-95"
                        >
                            <VerticalDotsIcon className="size-5" />
                        </button>
                        <Dropdown
                            isOpen={openDropdownId === row._id + "_mobile"}
                            onClose={onDropdownClose}
                            className="w-48 top-full mt-2 shadow-2xl"
                        >
                            {canAssignLeads && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onAssign(row); }}
                                    className="flex items-center gap-3 py-3 px-4 text-blue-600 dark:text-blue-400 font-semibold text-sm"
                                >
                                    <UserIcon className="size-4" /> Assign Lead
                                </DropdownItem>
                            )}
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onAlarm(row); }}
                                className="flex items-center gap-3 py-3 px-4 text-yellow-600 dark:text-yellow-400 font-semibold text-sm"
                            >
                                <BoltIcon className="size-4" /> Follow-up
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onImmediateFollowup(row); }}
                                className="flex items-center gap-3 py-3 px-4 text-orange-600 dark:text-orange-400 font-semibold text-sm"
                            >
                                <Bell className="size-4" /> Immediate Follow-up
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onDelete(row); }}
                                className="flex items-center gap-3 py-3 px-4 text-red-600 dark:text-red-400 font-semibold text-sm"
                            >
                                <TrashBinIcon className="size-4" /> Delete Lead
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Phone */}
            <div className="mb-4 pl-1">
                <a href={`tel:${row.phone1}`} className="text-gray-600 dark:text-gray-300 text-[15px] font-semibold flex items-center gap-2.5 hover:text-brand-600 transition-colors">
                    <BoltIcon className="size-4 rotate-45 text-gray-400" />
                    {row.phone1}
                </a>
            </div>

            {/* Follow-up */}
            <div className="mb-5 pl-1">
                <div className={`inline-flex items-center gap-2 rounded-full py-1.5 px-4 border shadow-sm ${badgeStyle === 'danger' ? 'bg-red-50 text-red-700 border-red-100' : badgeStyle === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    <CalendarIcon className="size-3.5 opacity-60" />
                    <span className="text-[13px] font-bold">Follow-up: {getDueDateBadgeText(row.followUpDate)}</span>
                </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3.5 mb-5 pl-1 text-[13px]">
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <UserIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Assigned To</span>
                        <span className="text-gray-900 dark:text-gray-100 font-bold truncate">{row.assignedTo?.fullName || "Unassigned"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <FileIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Course</span>
                        <span className="text-gray-900 dark:text-gray-100 font-semibold truncate">{row.coursePreference?.join(", ") || "N/A"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <CalendarIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Date Added</span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium text-[12px]">
                            {formatDate(row.createdAt)} by <span className="italic font-semibold">{row.createdBy?.fullName || row.handledBy || "N/A"}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Remark */}
            <div className="mb-2 ml-1 pl-4 border-l-2 border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-white/[0.02] py-3 pr-3 rounded-r-xl">
                <div className="flex items-center gap-2 mb-1.5">
                    <ChatIcon className="size-3.5 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Latest Remark</span>
                </div>
                <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed italic font-medium">
                    "{latestRemark || "No remarks yet"}"
                </p>
                {row.assignmentRemark && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-2.5">
                        Remark: {row.assignmentRemark}
                    </p>
                )}
            </div>
        </div>
    );
};

export default React.memo(LeadMobileCard);
