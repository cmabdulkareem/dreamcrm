import React from 'react';
import {
    CalendarIcon,
    PencilIcon,
    VerticalDotsIcon,
    ChatIcon,
    TrashBinIcon,
    ChevronDownIcon
} from '../../../icons/index';
import { CheckSquare, Plus, UserPlus } from 'lucide-react';
import {
    TableRow,
    TableCell
} from '../../../components/ui/table';
import { Dropdown } from '../../../components/ui/dropdown/Dropdown';
import { DropdownItem } from '../../../components/ui/dropdown/DropdownItem';
import Button from '../../../components/ui/button/Button';
import Tooltip from '../../../components/ui/Tooltip';
import DatePicker from '../../../components/form/date-picker';
import { getPriorityColor, getPriorityBadge, getStatusBadge } from '../utils/taskHelpers';
import SubTaskCard from './SubTaskCard';

// Shared UserAvatar
const UserAvatar = ({ member, size = "h-7 w-7", fontSize = "text-[10px]" }) => {
    const [imgError, setImgError] = React.useState(false);
    const initials = member?.fullName?.charAt(0) || '?';

    return (
        <div className={`${size} rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${fontSize} font-bold text-gray-600 dark:text-gray-400 overflow-hidden shadow-sm transition-transform`}>
            {member?.avatar && !imgError ? (
                <img
                    src={member.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                initials
            )}
        </div>
    );
};

const TaskRow = ({
    task,
    expandedTaskId,
    setExpandedTaskId,
    handleEditTask,
    toggleDropdown,
    openDropdownId,
    setOpenDropdownId,
    handleAddRemark,
    handleDeleteTask,
    // Sub-task handlers
    newSubTask,
    setNewSubTask,
    newSubTaskDate,
    setNewSubTaskDate,
    newSubTaskAssignedTo,
    setNewSubTaskAssignedTo,
    handleAddSubTaskToTask,
    handleToggleSubTask,
    handleDeleteSubTask,
    isLoading,
    teamMembers
}) => {
    return (
        <>
            <TableRow className="group transition-all hover:bg-slate-50/80 dark:hover:bg-white/5 odd:bg-transparent even:bg-gray-50/30 dark:even:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                <TableCell className="py-4 pl-8 relative text-start">
                    <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: getPriorityColor(task.priority) }} />
                    <div className="flex flex-col min-w-0">
                        <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 truncate">{task.title}</p>

                        {/* Move Scheduled Date here */}
                        <div className="flex items-center gap-1.5 mt-1 font-bold" style={{ color: getPriorityColor(task.priority) }}>
                            <CalendarIcon className="w-4 h-4" />
                            <span className="text-xs">{task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString() : 'TBD'}</span>
                        </div>

                        <div className="flex items-center gap-1 mt-1 opacity-80">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/50 w-fit">
                                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">By</span>
                                <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{task.createdBy?.fullName || 'System'}</span>
                            </div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-start">
                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            <span>Progress</span>
                            <span>
                                {task.subTasks?.filter(st => st.isCompleted).length || 0} / {task.subTasks?.length || 0}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-brand-500 h-full transition-all duration-500 rounded-full"
                                style={{
                                    width: `${task.subTasks?.length ? (task.subTasks.filter(st => st.isCompleted).length / task.subTasks.length) * 100 : 0}%`
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setExpandedTaskId(expandedTaskId === task._id ? null : task._id)}
                            className="text-[10px] text-brand-600 dark:text-brand-400 font-medium hover:underline text-start w-fit mt-0.5"
                        >
                            {expandedTaskId === task._id ? "Hide details" : (task.subTasks?.length > 0 ? `View ${task.subTasks.length} sub-tasks` : "Add sub-tasks")}
                        </button>
                    </div>
                </TableCell>
                <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-start">
                    <div className="flex -space-x-2">
                        {task.team?.length > 0 ? (
                            task.team.map((member, i) => (
                                <Tooltip key={member._id || i} content={member.fullName}>
                                    <div className="hover:scale-110 transition-transform cursor-help">
                                        <UserAvatar member={member} />
                                    </div>
                                </Tooltip>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-400 italic">Self</span>
                        )}
                    </div>
                </TableCell>

                <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-start">
                    {getStatusBadge(task.status)}
                </TableCell>
                <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50 text-gray-500 text-theme-sm dark:text-gray-400 text-start">
                    {/* Move Description here (Remarks column) */}
                    {task.description ? (
                        <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 max-w-[200px]" title={task.description}>
                            {task.description}
                        </p>
                    ) : (
                        <span className="text-gray-300 dark:text-gray-700 italic text-[10px]">No remarks</span>
                    )}
                </TableCell>
                <TableCell className="py-3 px-4 border-l border-gray-100 dark:border-gray-800/50">
                    <div className="flex items-center justify-center">
                        <button
                            className="mr-2 h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
                            onClick={() => handleEditTask(task)}
                        >
                            <PencilIcon className="size-4.5" />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown(task._id)}
                                className="size-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.05]"
                            >
                                <VerticalDotsIcon className="size-5" />
                            </button>

                            <Dropdown
                                isOpen={openDropdownId === task._id}
                                onClose={() => setOpenDropdownId(null)}
                                className="w-40 right-0"
                            >
                                <DropdownItem
                                    onClick={() => {
                                        setOpenDropdownId(null);
                                        handleAddRemark(task);
                                    }}
                                    className="flex items-center gap-2 text-blue-500"
                                >
                                    <ChatIcon className="size-4" />
                                    Remarks ({task.remarks?.length || 0})
                                </DropdownItem>
                                <DropdownItem
                                    onClick={() => {
                                        setOpenDropdownId(null);
                                        handleDeleteTask(task._id);
                                    }}
                                    className="flex items-center gap-2 text-red-500"
                                >
                                    <TrashBinIcon className="size-4" />
                                    Delete
                                </DropdownItem>
                            </Dropdown>
                        </div>
                    </div>
                </TableCell>
            </TableRow>

            {expandedTaskId === task._id && (
                <TableRow className="bg-gray-50/50 dark:bg-white/[0.01]">
                    <TableCell colSpan={6} className="py-0 px-8">
                        <div className="py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex-1 max-w-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sub-task Progress</span>
                                            <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                                                {task.subTasks?.filter(st => st.isCompleted).length}/{task.subTasks?.length || 0}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {task.subTasks?.length > 0 ? Math.round((task.subTasks.filter(st => st.isCompleted).length / task.subTasks.length) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden text-start">
                                        <div
                                            className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${task.subTasks?.length > 0 ? (task.subTasks.filter(st => st.isCompleted).length / task.subTasks.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Inline Add Subtask Form */}
                                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex-1 min-w-[200px] flex items-center px-3 gap-2">
                                        <Plus className="size-3.5 text-gray-400" />
                                        <input
                                            placeholder="Add a sub-task..."
                                            value={newSubTask}
                                            onChange={(e) => setNewSubTask(e.target.value)}
                                            className="h-8 w-full text-xs bg-transparent border-none focus:ring-0"
                                        />
                                    </div>
                                    <div className="h-4 w-px bg-gray-100 dark:bg-gray-800 hidden sm:block" />
                                    <div className="flex items-center px-1 max-w-[140px] transform scale-90 origin-left">
                                        <DatePicker
                                            id={`new-subtask-date-${task._id}`}
                                            value={newSubTaskDate}
                                            onChange={(dates, dateStr) => setNewSubTaskDate(dateStr)}
                                            placeholder="Date"
                                        />
                                    </div>
                                    <div className="h-4 w-px bg-gray-100 dark:bg-gray-800 hidden sm:block" />
                                    <div className="flex items-center px-2 gap-2 relative text-start">
                                        <UserPlus className="size-3.5 text-gray-400" />
                                        <select
                                            value={newSubTaskAssignedTo}
                                            onChange={(e) => setNewSubTaskAssignedTo(e.target.value)}
                                            className="h-8 pl-1 pr-6 text-[10px] font-bold bg-transparent border-none focus:ring-0 w-32 cursor-pointer text-gray-600 dark:text-gray-400 appearance-none"
                                        >
                                            <option value="">Assign To...</option>
                                            {teamMembers.map(member => (
                                                <option key={member._id} value={member._id}>
                                                    {member.fullName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="size-3 text-gray-400 pointer-events-none absolute right-2" />
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddSubTaskToTask(task._id)}
                                        disabled={!newSubTask.trim() || isLoading}
                                        className="h-8 rounded-lg"
                                    >
                                        Add Sub-task
                                    </Button>
                                </div>
                            </div>

                            {task.subTasks?.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center gap-2">
                                    <CheckSquare className="size-6 text-gray-300" />
                                    <p className="text-xs text-gray-400">No subtasks yet. Add one above to get started.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {task.subTasks?.map((st) => (
                                        <SubTaskCard
                                            key={st._id}
                                            st={st}
                                            taskId={task._id}
                                            handleToggleSubTask={handleToggleSubTask}
                                            handleDeleteSubTask={handleDeleteSubTask}
                                            teamMembers={teamMembers}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default TaskRow;
