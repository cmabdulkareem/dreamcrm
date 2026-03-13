import React from "react";
import Badge from "../../ui/badge/Badge";
import { Dropdown } from "../../ui/dropdown/Dropdown";
import { DropdownItem } from "../../ui/dropdown/DropdownItem";
import {
    PencilIcon,
    VerticalDotsIcon,
    UserIcon,
    FileIcon,
    CalendarIcon,
    ChatIcon,
    TrashBinIcon,
} from "../../../icons";
import { callListStatusOptions } from "../../../data/DataSets";
import { formatDate, getLatestRemark } from "../leadHelpers";

/**
 * ColdCallMobileCard
 * Mobile card view for a single cold call list entry. Wrapped in React.memo.
 */
const ColdCallMobileCard = ({
    entry,
    index,
    openDropdownId,
    onEdit,
    onDelete,
    onToggleDropdown,
    onDropdownClose,
    canDelete,
    onTooltipEnter,
    onTooltipLeave,
}) => {
    // getLatestRemark now correctly handles the calls array as well
    const latestRemark = getLatestRemark(entry.remarks, entry.callLogs);
    
    // Default to pending if not found
    const currentStatus = callListStatusOptions.find(opt => opt.value === entry.status) || callListStatusOptions[0];
    const statusColor = currentStatus.color;

    return (
        <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
            {/* Status Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-60 bg-gray-300" style={{ backgroundColor: statusColor }} />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 pl-1">
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Entry #{index + 1}</span>
                    <h4 className="text-[18px] font-black text-gray-950 dark:text-white leading-tight" 
                        data-tooltip-id={`mobile-${entry._id}`}
                        onMouseEnter={(e) => onTooltipEnter(e, entry)}
                        onMouseLeave={onTooltipLeave}
                    >{entry.name || 'Unnamed'}</h4>
                    <span
                        className="w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase shadow-sm opacity-80"
                        style={{
                            backgroundColor: `${statusColor}15`,
                            color: statusColor,
                            border: `1px solid ${statusColor}40`
                        }}
                    >
                        {currentStatus.label}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(entry)}
                        className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-brand-500 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-all"
                        title="Edit Entry"
                    >
                        <PencilIcon className="size-4.5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => onToggleDropdown(entry._id + "_mobile")}
                            className="size-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition-all active:scale-95"
                        >
                            <VerticalDotsIcon className="size-5" />
                        </button>
                        <Dropdown
                            isOpen={openDropdownId === entry._id + "_mobile"}
                            onClose={onDropdownClose}
                            className="w-48 top-full mt-2 shadow-2xl"
                        >
                            {canDelete && (
                                <DropdownItem
                                    onClick={() => { onDropdownClose(); onDelete(entry); }}
                                    className="flex items-center gap-3 py-3 px-4 text-red-600 dark:text-red-400 font-semibold text-sm"
                                >
                                    <TrashBinIcon className="size-4" /> Delete Entry
                                </DropdownItem>
                            )}
                        </Dropdown>
                    </div>
                </div>
            </div>

            {/* Phone */}
            {entry.phoneNumber && (
                <div className="mb-4 pl-1">
                    <a href={`tel:${entry.phoneNumber}`} className="text-gray-600 dark:text-gray-300 text-[15px] font-semibold flex items-center gap-2.5 hover:text-brand-600 transition-colors">
                        <svg className="size-4 rotate-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {entry.phoneNumber}
                    </a>
                </div>
            )}

            {/* Metadata */}
            <div className="space-y-3.5 mb-5 pl-1 text-[13px]">
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <UserIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Assigned To</span>
                        <span className="text-gray-900 dark:text-gray-100 font-bold truncate">{entry.assignedTo?.fullName || "Unassigned"}</span>
                    </div>
                </div>
                {(entry.source || entry.purpose) && (
                    <div className="flex items-center gap-3">
                        <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <FileIcon className="size-4 text-gray-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Source / Purpose</span>
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                                {entry.source && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 border border-sky-100 dark:border-sky-800/40 truncate max-w-[120px]" title={entry.source}>
                                        {entry.source}
                                    </span>
                                )}
                                {entry.purpose && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40 truncate max-w-[120px]" title={entry.purpose}>
                                        {entry.purpose}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <CalendarIcon className="size-4 text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Date Added</span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium text-[12px]">
                            {formatDate(entry.createdAt)} by <span className="italic font-semibold">{entry.creator?.fullName || "System"}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Remark / Call Log Display */}
            {latestRemark && latestRemark !== '-' && latestRemark !== 'No remarks yet' && (
                <div className="mb-2 ml-1 pl-4 border-l-2 border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-white/[0.02] py-3 pr-3 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                        <ChatIcon className="size-3.5 text-gray-400" />
                        <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Latest Activity</span>
                    </div>
                    {(() => {
                        const isOutgoing = latestRemark.startsWith('📞');
                        const isIncoming = latestRemark.startsWith('📲');
                        const isMissed = latestRemark.startsWith('📵');
                        const isCall = isOutgoing || isIncoming || isMissed;
                        if (isCall) {
                            const color = isMissed
                                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                : isIncoming
                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                    : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
                            return (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${color}`}>
                                    {latestRemark}
                                </span>
                            );
                        }
                        return (
                            <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed italic font-medium">
                                "{latestRemark}"
                            </p>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default React.memo(ColdCallMobileCard);
