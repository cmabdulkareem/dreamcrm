import { useDrop } from 'react-dnd';
import { useChat } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import { isAdmin } from '../../utils/roleHelpers';
import LoadingSpinner from '../common/LoadingSpinner';

const GroupParticipants = ({ chat, participants, onAddParticipant, onRemoveParticipant, user }) => {
  const { contacts, deleteGroupChat } = useChat();

  // Add safety check for chat
  if (!chat) {
    return <LoadingSpinner className="h-64" />;
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'participant',
    drop: (item) => onAddParticipant(item.participant),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await deleteGroupChat(chat.id);
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Failed to delete group. Please try again.');
      }
    }
  };

  return (
    <div
      ref={drop}
      className={`flex-1 overflow-y-auto p-2 ${isOver ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          Group Participants
        </h4>
        {user && isAdmin(user) && chat.participants && chat.participants.some(p => (p._id || p.id) === (user._id || user.id)) && (
          <button
            onClick={handleDeleteGroup}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
          >
            Delete Group
          </button>
        )}
      </div>

      {isOver && (
        <div className="text-center py-2 text-blue-500 dark:text-gray-300">
          Drop participant here to add to group
        </div>
      )}

      <div className="space-y-2">
        {participants && participants.map((participant) => (
          <div
            key={participant._id}
            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <div className="flex items-center">
              <img
                src={participant.avatar || '/images/user/user-01.jpg'}
                alt={participant.fullName}
                className="w-8 h-8 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {participant.fullName}
                </p>
                {user && participant._id === user._id && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">You</p>
                )}
                {participant._id === chat.createdBy && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                )}
              </div>
            </div>

            {user && participant._id !== user._id && chat.participants && chat.participants.length > 2 && (
              <button
                onClick={() => onRemoveParticipant(participant._id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Add Participants
        </h4>
        <div className="max-h-40 overflow-y-auto">
          {contacts && contacts
            .filter(contact => !participants.some(p => p._id === contact._id))
            .map((contact) => (
              <div
                key={contact._id}
                onClick={() => onAddParticipant(contact)}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <img
                  src={contact.avatar || '/images/user/user-01.jpg'}
                  alt={contact.fullName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {contact.fullName}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GroupParticipants;