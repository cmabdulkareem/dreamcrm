import React from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import {
    ChevronDownIcon,
    ChevronUpIcon,
    PlusIcon,
} from "../../icons";
import { enquirerStatus } from "../../data/DataSets";

/**
 * StudentFilters
 * Header row (title, stats, action buttons) + collapsible filter panel.
 */
const StudentFilters = ({
    // Display
    filteredCount,
    // Filter visibility
    showFilters,
    onToggleFilters,
    // Filter values
    search,
    filterCourse,
    filterStatus,
    filterBatchStatus,
    // Filter setters
    onSearchChange,
    onFilterCourseChange,
    onFilterStatusChange,
    onFilterBatchStatusChange,
    // Options
    courseOptions,
    // Actions
    onAddStudent,
    isUserCounsellor,
}) => {
    return (
        <div className="space-y-4 mb-6">
            {/* Title Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Students</h3>
                    <p className="text-xs text-gray-400">Total: {filteredCount} records</p>
                </div>
                <div className="flex items-center gap-3">
                     {!isUserCounsellor && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={onAddStudent}
                            startIcon={<PlusIcon className="size-5" />}
                            className="h-10"
                        >
                            Add New Student
                        </Button>
                    )}
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Batch Status:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Assigned</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Unassigned</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full sm:w-64">
                         <Input
                            type="text"
                            placeholder="Search by name, ID, email..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-10"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onToggleFilters}
                        startIcon={showFilters ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
                        className="h-10"
                    >
                        {showFilters ? "Hide" : "Filters"}
                    </Button>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
                    <Select
                        options={[{ label: "All Courses", value: "" }, ...courseOptions]}
                        value={filterCourse}
                        placeholder="Filter by course"
                        onChange={onFilterCourseChange}
                    />
                    <Select
                        options={[
                            { label: "All Status", value: "" },
                            ...enquirerStatus.map(s => ({ label: s.label, value: s.value }))
                        ]}
                        value={filterStatus}
                        placeholder="Filter by status"
                        onChange={onFilterStatusChange}
                    />
                    <Select
                        options={[
                            { label: "All Batch Status", value: "" },
                            { label: "Assigned", value: "assigned" },
                            { label: "Unassigned", value: "unassigned" }
                        ]}
                        value={filterBatchStatus}
                        placeholder="Filter by batch status"
                        onChange={onFilterBatchStatusChange}
                    />
                </div>
            )}
        </div>
    );
};

export default React.memo(StudentFilters);
