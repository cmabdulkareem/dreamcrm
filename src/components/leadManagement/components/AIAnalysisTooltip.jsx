import React from "react";
import { createPortal } from "react-dom";
import { BoltIcon } from "../../../icons";

/**
 * AIAnalysisTooltip
 * Portal-based AI analysis tooltip shown on name cell hover.
 */
const AIAnalysisTooltip = ({
    show,
    hoveredLeadId,
    tooltipPosition,
    tooltipRef,
    isAnalyzing,
    analysisCache,
    analysisTimeoutRef,
    onMouseLeave,
}) => {
    if (!hoveredLeadId || !show) return null;

    const isAbove = tooltipPosition.transform?.includes('-100%') || tooltipPosition.transform === 'translateY(-10px)';

    return createPortal(
        <div
            ref={tooltipRef}
            className={`fixed w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-blue-200 dark:border-blue-900/50 z-[100000] transition-all duration-200 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: `${tooltipPosition.transform} ${show ? 'scale(1)' : 'scale(0.95)'}`,
            }}
            onMouseEnter={() => {
                if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
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
                    />
                </div>
            )}

            <div className="p-3 border-b border-blue-50 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <BoltIcon className="size-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Lead Analysis - CDC AI</h4>
                    {isAnalyzing && <div className="size-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-auto" />}
                </div>
            </div>
            <div className="p-4">
                {isAnalyzing ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                    </div>
                ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        "{analysisCache[hoveredLeadId] || "Loading suggestion..."}"
                    </p>
                )}
                <p className="text-[10px] text-gray-400 mt-3 text-right">System suggestion</p>
            </div>
        </div>,
        document.body
    );
};

export default React.memo(AIAnalysisTooltip);
