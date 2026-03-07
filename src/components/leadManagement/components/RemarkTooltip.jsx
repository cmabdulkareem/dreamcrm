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
    if (!hoveredRow.remarks || hoveredRow.remarks.length === 0) return null;

    const isAbove = tooltipPosition.transform?.includes('-100%') || tooltipPosition.transform === 'translateY(-10px)';

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
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Remark History</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {hoveredRow.remarks.length} remark{hoveredRow.remarks.length !== 1 ? 's' : ''}
                </p>
            </div>
            <div
                className="overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600"
                style={{ maxHeight: `${tooltipPosition.maxHeight - 60}px` }}
            >
                {[...hoveredRow.remarks].reverse().map((remark, index) => (
                    <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-800 dark:text-white">{remark.handledBy || "Unknown"}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {remark.updatedOn ? new Date(remark.updatedOn).toLocaleString() : "N/A"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge size="sm" color={getLeadStatusColor(remark.leadStatus || "new")}>
                                {getLeadStatusLabel(remark.leadStatus || "new")}
                            </Badge>
                            {remark.isUnread && <span className="text-xs text-red-500 dark:text-red-400">Unread</span>}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {remark.remark || "No remarks"}
                        </p>
                        {remark.nextFollowUpDate && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                Next Follow-up: {new Date(remark.nextFollowUpDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
};

export default React.memo(RemarkTooltip);
