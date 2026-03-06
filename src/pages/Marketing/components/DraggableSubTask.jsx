import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Calendar, Trash2 } from 'lucide-react';
import { CheckIcon } from '../../../icons/index';
import Tooltip from '../../../components/ui/Tooltip';
import DatePicker from '../../../components/form/date-picker';

// Simple Avatar component for internal use or can be imported if extracted
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

const DraggableSubTask = ({ st, index, moveSubTask, handleSubTaskChange, handleRemoveSubTask, teamMembers }) => {
    const DND_TYPE = 'SUBTASK';
    const ref = useRef(null);

    const [{ handlerId }, drop] = useDrop({
        accept: DND_TYPE,
        collect(monitor) {
            return { handlerId: monitor.getHandlerId() };
        },
        hover(item, monitor) {
            if (!ref.current) return;
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) return;
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            const clientOffset = monitor.getClientOffset();
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
            moveSubTask(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: () => ({ id: index, index }),
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    });

    drag(drop(ref));

    const member = typeof st.assignedTo === 'object' ? st.assignedTo : teamMembers.find(m => String(m._id) === String(st.assignedTo));

    return (
        <div
            ref={ref}
            data-handler-id={handlerId}
            className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 group transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:shadow-sm ${isDragging ? 'opacity-30' : ''}`}
        >
            <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                <GripVertical className="size-3.5" />
            </div>
            <div
                className={`size-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${st.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200 dark:border-gray-700 hover:border-brand-500 bg-white dark:bg-gray-800'}`}
                onClick={() => handleSubTaskChange(index, 'isCompleted', !st.isCompleted)}
            >
                {st.isCompleted && <CheckIcon className="size-3" />}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3">
                <input
                    className={`flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0 transition-all ${st.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}
                    value={st.title}
                    onChange={(e) => handleSubTaskChange(index, 'title', e.target.value)}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-white dark:group-hover:bg-gray-900 group-hover:border-brand-200 dark:group-hover:border-brand-500/30">
                    <Tooltip content={member?.fullName || 'Unassigned'}>
                        <div className="hover:scale-110 transition-transform cursor-help">
                            <UserAvatar member={member} size="h-[22px] w-[22px]" fontSize="text-[8px]" />
                        </div>
                    </Tooltip>
                    <select
                        className="bg-transparent border-none p-0 text-[10px] font-bold text-gray-600 dark:text-gray-400 focus:ring-0 w-20 cursor-pointer appearance-none"
                        value={typeof st.assignedTo === 'object' ? st.assignedTo?._id : (st.assignedTo || '')}
                        onChange={(e) => handleSubTaskChange(index, 'assignedTo', e.target.value)}
                    >
                        <option value="">Assign...</option>
                        {teamMembers.map(m => (
                            <option key={m._id} value={m._id}>
                                {m.fullName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center px-1 transform scale-90 origin-left max-w-[130px]">
                    <DatePicker
                        id={`edit-subtask-date-${index}`}
                        value={st.targetDate ? new Date(st.targetDate).toISOString().split('T')[0] : ''}
                        onChange={(dates, dateStr) => handleSubTaskChange(index, 'targetDate', dateStr)}
                        placeholder="Date"
                    />
                </div>
            </div>
            <button
                type="button"
                onClick={() => handleRemoveSubTask(index)}
                className="size-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="size-3.5" />
            </button>
        </div>
    );
};

export default DraggableSubTask;
