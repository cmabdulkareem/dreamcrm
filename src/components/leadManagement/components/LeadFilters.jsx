import React from "react";
import Input from "../../form/input/InputField";
import Select from "../../form/Select";
import Button from "../../ui/button/Button";
import RangeDatePicker from "../../form/RangeDatePicker";
import {
    DownloadIcon,
    FileIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "../../../icons";
import { getContactPointIcon } from "../leadHelpers";
import {
    sortOrderList,
    leadStatusOptions,
    leadPotentialOptions,
} from "../../../data/DataSets";

/**
 * LeadFilters
 * Header row (title, stats, action buttons) + collapsible filter panel.
 */
const LeadFilters = ({
    // Display
    filteredCount,
    selectedLeadsCount,
    isRegularUser,
    contactPointStats,
    // Date range
    dateRange,
    onDateRangeChange,
    // Filter visibility
    showFilters,
    onToggleFilters,
    // Filter values
    search,
    sortOrder,
    leadStatusFilter,
    leadPotentialFilter,
    campaignFilter,
    assignedUserFilter,
    // Filter setters
    onSearchChange,
    onSortOrderChange,
    onLeadStatusChange,
    onLeadPotentialChange,
    onCampaignChange,
    onAssignedUserChange,
    // Options
    campaignOptions,
    availableUsers,
    canAssignLeads,
    // Actions
    onOpenImport,
    onDownloadPDF,
    isPdfDisabled,
}) => {
    return (
        <div className="space-y-4 mb-6">
            {/* Title Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Enquiries</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">Total: {filteredCount} records</p>
                        {selectedLeadsCount > 0 && (
                            <>
                                <span className="text-gray-300 dark:text-gray-700 font-light">|</span>
                                <p className="text-xs text-brand-500 font-medium">{selectedLeadsCount} selected</p>
                            </>
                        )}
                    </div>
                    {isRegularUser && (
                        <p className="text-[10px] text-gray-400 mt-1 italic">* Showing only leads assigned to you</p>
                    )}
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Lead Potential Legend */}
                    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Potential:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Strong</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Potential</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Weak</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-gray-400" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">None</span>
                        </div>
                    </div>

                    {/* Contact Point Stats */}
                    {Object.keys(contactPointStats).length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 dark:bg-white/5 rounded-full border border-slate-200/50 dark:border-white/10 h-10">
                            <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">This Month:</span>
                            <div className="flex items-center gap-3">
                                {Object.entries(contactPointStats).map(([contactPoint, count]) => {
                                    const { icon: Icon, label, color } = getContactPointIcon(contactPoint);
                                    return (
                                        <div key={contactPoint} className="flex items-center gap-1" title={label}>
                                            <Icon className={`size-3 ${color}`} />
                                            <span className="font-black text-gr-600 dark:text-brand-400 text-xs tabular-nums leading-none">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-full sm:w-56">
                        <RangeDatePicker
                            id="leadDateFilter"
                            value={dateRange}
                            onChange={onDateRangeChange}
                            placeholder="Filter by date range"
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
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenImport}
                        startIcon={<FileIcon className="size-5" />}
                        className="h-10"
                    >
                        Import
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onDownloadPDF}
                        endIcon={<DownloadIcon className="size-5" />}
                        disabled={isPdfDisabled}
                        className="h-10"
                    >
                        PDF
                    </Button>
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
                    <Input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    />
                    <Select
                        options={sortOrderList}
                        value={sortOrder}
                        placeholder="Sort by date"
                        onChange={onSortOrderChange}
                    />
                    <Select
                        options={[{ value: "", label: "All Lead Statuses" }, ...leadStatusOptions]}
                        value={leadStatusFilter}
                        placeholder="Filter by lead status"
                        onChange={onLeadStatusChange}
                    />
                    <Select
                        options={[{ value: "", label: "All Lead Potentials" }, ...leadPotentialOptions]}
                        value={leadPotentialFilter}
                        placeholder="Filter by lead potential"
                        onChange={onLeadPotentialChange}
                    />
                    <Select
                        options={[{ value: "", label: "All Campaigns" }, ...campaignOptions]}
                        value={campaignFilter}
                        placeholder="Filter by campaign"
                        onChange={onCampaignChange}
                    />
                    {canAssignLeads && (
                        <Select
                            options={[
                                { value: "", label: "All Users" },
                                { value: "unassigned", label: "Unassigned" },
                                ...availableUsers.map(u => ({ value: u._id, label: u.fullName })),
                            ]}
                            value={assignedUserFilter}
                            placeholder="Filter by assigned user"
                            onChange={onAssignedUserChange}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default React.memo(LeadFilters);
