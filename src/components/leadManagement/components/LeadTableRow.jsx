import React from "react";
import { Bell } from "lucide-react";
import {
    TableCell,
    TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/button/Button";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import {
    PencilIcon,
    BoltIcon,
    CloseIcon,
    VerticalDotsIcon,
} from "../../../icons";
import { formatDate, getLeadStatusColor, getLeadStatusLabel, getLatestRemark, hasUnreadRemarks, getContactPointIcon } from "../leadHelpers";
import { getLeadPotentialStyles, getDueDateBadgeColor, getDueDateBadgeText } from "../leadTableHelpers";
import { isAdmin, isManager, isOwner } from "../../../utils/roleHelpers";

/**
 * LeadTableRow
 * Desktop table row for a single lead. Wrapped in React.memo.
 */
const LeadTableRow = ({
    row,
    selectedLeads,
    openDropdownId,
    onSelect,
    onEdit,
    onDelete,
    onAlarm,
    onImmediateFollowup,
    onAssign,
    onToggleDropdown,
    onDropdownClose,
    onTooltipEnter,
    onTooltipLeave,
    onAnalysisEnter,
    onAnalysisLeave,
    canAssignLeads,
    user,
}) => {
    const latestRemark = getLatestRemark(row.remarks, row.callLogs);
    const hasUnread = hasUnreadRemarks(row.remarks);
    const styles = getLeadPotentialStyles(row.leadPotential);
    const { icon: ContactIcon, label: cpLabel, color: cpColor } = getContactPointIcon(row.contactPoint, row.otherContactPoint);
    const cpDetails = (
        row.contactPoint?.toLowerCase() === "other" ||
        row.contactPoint?.toLowerCase() === "reference" ||
        row.contactPoint?.toLowerCase() === "referance"
    ) && row.otherContactPoint
        ? `: ${row.otherContactPoint}` : "";

    return (
        <TableRow className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0">
            {/* Checkbox + unread indicator */}
            <TableCell className="py-4 pl-8 relative">
                <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${styles.bar}`} />
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={selectedLeads.includes(row._id)}
                        onChange={() => onSelect(row._id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    {hasUnread ? (
                        <div className="size-5 shrink-0 rounded-full bg-red-600 flex items-center justify-center shadow-md" title="New Remark">
                            <BoltIcon className="size-3.5 text-white" />
                        </div>
                    ) : (
                        <div className="size-6 invisible shrink-0" />
                    )}
                </div>
            </TableCell>

            {/* Name + course + phone */}
            <TableCell className="py-4 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div
                    className="flex flex-col min-w-0 cursor-help"
                    onMouseEnter={(e) => onAnalysisEnter(e, row)}
                    onMouseLeave={onAnalysisLeave}
                >
                    <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 truncate group-hover/name:text-brand-500 transition-colors">{row.fullName}</p>
                    <p className="text-gray-400 text-xs truncate max-w-[180px]">{row.coursePreference?.join(", ") || "N/A"}</p>
                    <a href={`tel:${row.phone1}`} className="text-blue-500 hover:underline text-[12px] font-medium mt-0.5">{row.phone1}</a>
                </div>
            </TableCell>

            {/* Date Added */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400">
                <div className="flex flex-col gap-0.5">
                    <p>{formatDate(row.createdAt)}</p>
                    <p className="text-gray-400 text-xs truncate max-w-[180px]">{row.createdBy?.fullName || row.handledBy || "N/A"}</p>
                </div>
            </TableCell>

            {/* Contact Point */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="group relative" title={`${cpLabel}${cpDetails}`}>
                        <div className="p-1.5 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100/50 dark:border-gray-700/50 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 group-hover:scale-110 shadow-sm inline-flex items-center justify-center">
                            <ContactIcon className={`size-4 ${cpColor}`} />
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Campaign */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                {row.campaign || "N/A"}
            </TableCell>

            {/* Status & Remark */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <Badge size="sm" color={getLeadStatusColor(row.leadStatus)}>
                            {getLeadStatusLabel(row.leadStatus)}
                        </Badge>
                    </div>
                    <div
                        className="relative group/remark"
                        data-row-id={row._id}
                        onMouseEnter={(e) => onTooltipEnter(e, row)}
                        onMouseLeave={onTooltipLeave}
                    >
                        <p className="text-xs text-gray-600 dark:text-gray-400 max-w-[180px] truncate cursor-help leading-relaxed">
                            {latestRemark || "No remarks yet"}
                        </p>
                        {row.assignmentRemark && (
                            <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 truncate animate-pulse duration-100">
                                Suggestion: {row.assignmentRemark}
                            </p>
                        )}
                    </div>
                </div>
            </TableCell>

            {/* Next Follow-up */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400">
                <div className="flex flex-col gap-1 items-start">
                    <Badge size="sm" color={getDueDateBadgeColor(row.followUpDate)}>
                        {getDueDateBadgeText(row.followUpDate)}
                    </Badge>
                    {row.assignedTo && (
                        <p className="text-gray-400 text-xs truncate max-w-[180px]">{row.assignedTo.fullName}</p>
                    )}
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400">
                <div className="flex items-center justify-center">
                    <Button size="sm" variant="outline" className="mr-2" endIcon={<PencilIcon className="size-5" />} onClick={() => onEdit(row)} />
                    <div className="relative">
                        <button
                            onClick={() => onToggleDropdown(row._id)}
                            className="dropdown-toggle size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
                        >
                            <VerticalDotsIcon className="size-5" />
                        </button>
                        <Dropdown isOpen={openDropdownId === row._id} onClose={onDropdownClose} className="w-40">
                            {canAssignLeads && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onAssign(row); }}
                                    className="flex items-center gap-2 text-blue-500"
                                >
                                    Assign
                                </DropdownItem>
                            )}
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onAlarm(row); }}
                                className="flex items-center gap-2 text-blue-500"
                            >
                                <BoltIcon className="size-4" /> Follow-up
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => { onDropdownClose(); onImmediateFollowup(row); }}
                                className="flex items-center gap-2 text-orange-500"
                            >
                                <Bell className="size-4" /> Heads Up
                            </DropdownItem>
                            {(isAdmin(user) || isManager(user) || isOwner(user)) && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDelete(row); }}
                                    className="flex items-center gap-2 text-red-500"
                                >
                                    <CloseIcon className="size-4" /> Delete
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default React.memo(LeadTableRow);
