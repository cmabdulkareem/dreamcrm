import React from 'react';
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { ChevronDownIcon, ChevronUpIcon } from '../../../icons/index';
import { STATUS_FILTER_OPTIONS, PRIORITY_FILTER_OPTIONS } from '../constants/taskConstants';

const TaskFilters = ({
    showFilters,
    setShowFilters,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter
}) => {
    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-800 h-10">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Priority:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Urgent</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-orange-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">High</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-blue-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Medium</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px]">Low</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        startIcon={showFilters ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
                        className="h-10"
                    >
                        {showFilters ? "Hide" : "Filters"}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300 text-start">
                    <Input
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                    <Select
                        options={STATUS_FILTER_OPTIONS}
                        value={statusFilter}
                        placeholder="Filter by status"
                        onChange={(value) => setStatusFilter(value)}
                    />
                    <Select
                        options={PRIORITY_FILTER_OPTIONS}
                        value={priorityFilter}
                        placeholder="Filter by priority"
                        onChange={(value) => setPriorityFilter(value)}
                    />
                </div>
            )}
        </div>
    );
};

export default TaskFilters;
