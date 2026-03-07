import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import API from "../../../config/api";

/**
 * useTooltipPosition
 * Manages both the remark history tooltip and the AI analysis tooltip.
 * Encapsulates: position calculation, hover timing, resize/scroll listeners, and AI fetch logic.
 */
export function useTooltipPosition() {
    const [hoveredRemarkRow, setHoveredRemarkRow] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const [showAnalysisTooltip, setShowAnalysisTooltip] = useState(false);
    const [hoveredAnalysisLeadId, setHoveredAnalysisLeadId] = useState(null);
    const [analysisCache, setAnalysisCache] = useState({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const hoverTimeoutRef = useRef(null);
    const analysisTimeoutRef = useRef(null);
    const tooltipRef = useRef(null);

    const calculateTooltipPosition = useCallback((rect) => {
        const tooltipWidth = 384;
        const padding = 20;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const headerHeight = 85;

        let left = rect.left;
        let arrowLeft = rect.width / 2;

        if (left + tooltipWidth > viewportWidth - padding) {
            left = viewportWidth - tooltipWidth - padding;
        }
        if (left < padding) {
            left = padding;
        }

        arrowLeft = (rect.left + rect.width / 2) - left;
        arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, arrowLeft));

        const spaceAbove = rect.top - headerHeight - padding;
        const spaceBelow = viewportHeight - rect.bottom - padding;
        const estimatedTooltipHeight = 350;

        let top = 0;
        let transform = "";
        let maxHeight = 0;

        if (spaceAbove > estimatedTooltipHeight || spaceAbove > spaceBelow) {
            top = rect.top;
            transform = "translateY(-100%) translateY(-10px)";
            maxHeight = spaceAbove;
        } else {
            top = rect.bottom;
            transform = "translateY(10px)";
            maxHeight = spaceBelow;
        }

        return { top, left, arrowLeft, transform, maxHeight };
    }, []);

    const handleTooltipEnter = useCallback((e, row) => {
        if (row.remarks && row.remarks.length > 0) {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            const rect = e.currentTarget.getBoundingClientRect();
            const position = calculateTooltipPosition(rect);
            setTooltipPosition(position);
            setHoveredRemarkRow(row._id);
            hoverTimeoutRef.current = setTimeout(() => {
                setShowTooltip(true);
            }, 150);
        }
    }, [calculateTooltipPosition]);

    const handleTooltipLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredRemarkRow(null);
            setShowTooltip(false);
        }, 100);
    }, []);

    const handleAnalysisEnter = useCallback((e, row) => {
        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        const position = calculateTooltipPosition(rect);
        setTooltipPosition(position);
        setHoveredAnalysisLeadId(row._id);

        analysisTimeoutRef.current = setTimeout(async () => {
            setShowAnalysisTooltip(true);
            if (!analysisCache[row._id]) {
                setIsAnalyzing(true);
                try {
                    const response = await axios.get(`${API}/ai/analyze-lead/${row._id}`, { withCredentials: true });
                    setAnalysisCache(prev => ({ ...prev, [row._id]: response.data.analysis }));
                } catch (error) {
                    console.error("AI Analysis Error:", error);
                    setAnalysisCache(prev => ({ ...prev, [row._id]: "Could not load AI suggestions." }));
                } finally {
                    setIsAnalyzing(false);
                }
            }
        }, 400);
    }, [calculateTooltipPosition, analysisCache]);

    const handleAnalysisLeave = useCallback(() => {
        if (analysisTimeoutRef.current) {
            clearTimeout(analysisTimeoutRef.current);
            analysisTimeoutRef.current = null;
        }
        analysisTimeoutRef.current = setTimeout(() => {
            setHoveredAnalysisLeadId(null);
            setShowAnalysisTooltip(false);
        }, 100);
    }, []);

    // Recalculate position on resize/scroll
    useEffect(() => {
        if (!hoveredRemarkRow) return;
        const handleResize = () => {
            const cellElement = document.querySelector(`[data-row-id="${hoveredRemarkRow}"]`);
            if (cellElement) {
                const rect = cellElement.getBoundingClientRect();
                const position = calculateTooltipPosition(rect);
                setTooltipPosition(position);
            }
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
        };
    }, [hoveredRemarkRow, calculateTooltipPosition]);

    return {
        hoveredRemarkRow,
        tooltipPosition,
        showTooltip,
        showAnalysisTooltip,
        hoveredAnalysisLeadId,
        analysisCache,
        isAnalyzing,
        hoverTimeoutRef,
        analysisTimeoutRef,
        tooltipRef,
        handleTooltipEnter,
        handleTooltipLeave,
        handleAnalysisEnter,
        handleAnalysisLeave,
    };
}
