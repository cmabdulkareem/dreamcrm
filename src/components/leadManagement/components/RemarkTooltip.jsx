import React from "react";
import { createPortal } from "react-dom";
import Badge from "../../ui/badge/Badge";
import { getLeadStatusColor, getLeadStatusLabel } from "../leadHelpers";

/**
 * RemarkTooltip
 * Portal-based tooltip showing full remark history for a lead row.
 */
const RemarkTooltip = ({
    hoveredRow,
    show,
    tooltipPosition,
    tooltipRef,
    hoverTimeoutRef,
    onMouseLeave,
}) => {
    if (!hoveredRow || !show) return null;
    const hasActivity = (hoveredRow.remarks?.length > 0) || (hoveredRow.callLogs?.length > 0);
    if (!hasActivity) return null;

    const isAbove = tooltipPosition.transform?.includes('-100%') || tooltipPosition.transform === 'translateY(-10px)';

    const callLogs = hoveredRow.callLogs || [];
    const allActivities = [
        ...(hoveredRow.remarks || []).map(r => ({ ...r, _type: 'remark', _date: r.updatedOn })),
        ...callLogs.map(c => ({ ...c, _type: 'call', _date: c.timestamp })),
    ].sort((a, b) => new Date(b._date) - new Date(a._date));

    const totalCount = allActivities.length;

    const isCallMissedUnansweredRejected = (item) => {
        if (item.type === 'MISSED' || String(item.type) === '3') return true;
        if (item.type === 'REJECTED' || String(item.type) === '5') return true;
        if (item.duration === 0) return true;
        return false;
    };
    const callTypeColor = (item) => isCallMissedUnansweredRejected(item) ? 'text-red-500' : 'text-green-600';
    const callTypeLabel = (item) => {
        const type = String(item.type);
        if (type === 'MISSED' || type === '3') return '📵 Missed Call';
        if (type === 'REJECTED' || type === '5') return '📵 Rejected Call';
        if (type === 'INCOMING' || type === '1') return item.duration > 0 ? '📲 Incoming Answered' : '📵 Incoming Missed';
        if (type === 'OUTGOING' || type === '2') return item.duration > 0 ? '📞 Outgoing Answered' : '📵 Outgoing Unanswered';
        return '📞 Call Log';
    };

    return createPortal(
        <div
            ref={tooltipRef}
            className={`fixed w-96 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[100000] transition-all duration-200 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                maxHeight: `${tooltipPosition.maxHeight}px`,
                transform: `${tooltipPosition.transform} ${show ? 'scale(1)' : 'scale(0.95)'}`,
            }}
            onMouseEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={onMouseLeave}
        >
            {/* Arrow */}
            {tooltipPosition.arrowLeft > 0 && (
                <div
                    className={`absolute ${isAbove ? 'bottom-0' : 'top-0'} left-0 w-0 h-0`}
                    style={{
                        left: `${tooltipPosition.arrowLeft}px`,
                        transform: isAbove ? `translateY(100%) translateX(-50%)` : `translateY(-100%) translateX(-50%)`,
                    }}
                >
                    <div
                        className={`w-0 h-0 border-l-[8px] border-r-[8px] ${isAbove
                            ? 'border-t-[8px] border-t-white dark:border-t-gray-800 border-l-transparent border-r-transparent'
                            : 'border-b-[8px] border-b-white dark:border-b-gray-800 border-l-transparent border-r-transparent'
                            }`}
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                </div>
            )}

            <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Activity History</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {totalCount} interaction{totalCount !== 1 ? 's' : ''}
                </p>
            </div>
            <div
                className="overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600"
                style={{ maxHeight: `${tooltipPosition.maxHeight - 60}px` }}
            >
                {allActivities.map((item, index) => (
                    <div key={index} className={`rounded-lg border p-3 ${item._type === 'call' ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/40' : 'bg-gray-50 border-gray-100 dark:border-gray-700 dark:bg-gray-900'} transition-colors`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-800 dark:text-white">{item.handledBy || "Unknown"}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item._date ? new Date(item._date).toLocaleString() : "N/A"}
                            </span>
                        </div>
                        {item._type === 'call' ? (
                            <div>
                                <span className={`text-xs font-bold ${callTypeColor(item)}`}>
                                    {callTypeLabel(item)} · {Math.floor(item.duration / 60)}m {item.duration % 60}s
                                </span>
                                {item.remark && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.remark}</p>}
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge size="sm" color={getLeadStatusColor(item.leadStatus || "new")}>
                                        {getLeadStatusLabel(item.leadStatus || "new")}
                                    </Badge>
                                    {item.isUnread && <span className="text-xs text-red-500 dark:text-red-400">Unread</span>}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                    {item.remark || "No remarks"}
                                </p>
                                {item.nextFollowUpDate && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        Next Follow-up: {new Date(item.nextFollowUpDate).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};

export default React.memo(RemarkTooltip);
