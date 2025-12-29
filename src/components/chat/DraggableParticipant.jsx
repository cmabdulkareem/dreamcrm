import { useDrag } from 'react-dnd';
import { useChat } from '../../context/ChatContext';
import { getAvatarUrl } from '../../utils/imageHelper';

const DraggableParticipant = ({ participant }) => {
  const { activeChat, isUserOnline } = useChat();
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'participant',
    item: { participant },
    canDrag: activeChat && activeChat.type === 'group',
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const isOnline = isUserOnline(participant._id);

  return (
    <div
      ref={drag}
      className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="relative">
        <img
          src={getAvatarUrl(participant.avatar)}
          alt={participant.fullName}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            e.target.src = '/images/user/user-01.jpg';
          }}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></span>
        )}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{participant.fullName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};

export default DraggableParticipant;