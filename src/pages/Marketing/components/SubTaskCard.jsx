import React, { useState } from 'react';
import { Calendar, Trash2, CheckSquare } from 'lucide-react';
import { CheckIcon } from '../../../icons/index';
import Tooltip from '../../../components/ui/Tooltip';

const UserAvatar = ({ member, size = "h-7 w-7", fontSize = "text-[10px]" }) => {
    const [imgError, setImgError] = useState(false);
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

const SubTaskCard = ({ st, taskId, handleToggleSubTask, handleDeleteSubTask, teamMembers }) => {
    const member = typeof st.assignedTo === 'object' ? st.assignedTo : teamMembers.find(m => String(m._id) === String(st.assignedTo));

    return (
        <div
            className={`group relative flex flex-col p-4 rounded-[12px] border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${st.isCompleted
                ? 'bg-gray-50/50 border-gray-100 dark:bg-gray-800/20 dark:border-gray-800 grayscale-[0.5]'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-900/40 shadow-sm'
                }`}
        >
            <div className="flex items-start gap-3 mb-4">
                <button
                    onClick={() => handleToggleSubTask(taskId, st._id)}
                    className={`mt-0.5 size-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 transform active:scale-90 ${st.isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-500'
                        }`}
                >
                    {st.isCompleted && <CheckIcon className="size-3 stroke-[3]" />}
                </button>
                <div className="flex-1 min-w-0">
                    <input
                        value={st.title}
                        readOnly
                        className={`w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 ${st.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
                    />
                </div>
                <button
                    type="button"
                    onClick={() => handleDeleteSubTask && handleDeleteSubTask(taskId, st._id)}
                    className="size-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>

            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/50">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Calendar className="size-3" />
                        <span className="text-[10px] font-bold">
                            {st.targetDate ? new Date(st.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                    </div>
                    {st.isCompleted && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckSquare className="size-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Done</span>
                        </div>
                    )}
                </div>

                <Tooltip content={member ? member.fullName : 'Assign Member'}>
                    <div className="hover:scale-110 transition-transform cursor-help">
                        <UserAvatar member={member} size="h-[24px] w-[24px]" fontSize="text-[9px]" />
                    </div>
                </Tooltip>
            </div>
        </div>
    );
};

export default SubTaskCard;
