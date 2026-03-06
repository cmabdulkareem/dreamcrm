import React from 'react';
import { Search, Check } from 'lucide-react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

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

const TeamSelector = ({ teamMembers, selectedTeam, teamSearch, setTeamSearch, onToggleMember, fetchingTeam }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Team Members
                </label>
                {selectedTeam.length > 0 && (
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full">
                        {selectedTeam.length} selected
                    </span>
                )}
            </div>

            {/* Selected Member Chips */}
            {selectedTeam.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    {selectedTeam.map(memberId => {
                        const member = teamMembers.find(m => m._id === memberId);
                        if (!member) return null;
                        return (
                            <div key={memberId} className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 text-sm">
                                <UserAvatar member={member} size="size-5" fontSize="text-[8px]" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{member.fullName.split(' ')[0]}</span>
                                <button
                                    type="button"
                                    onClick={() => onToggleMember(memberId)}
                                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    placeholder="Search members..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                />
            </div>

            {/* Member List */}
            <div className="max-h-[180px] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                {fetchingTeam ? (
                    <div className="flex justify-center py-6"><LoadingSpinner className="size-5 text-brand-500" /></div>
                ) : teamMembers.filter(m => m.fullName.toLowerCase().includes(teamSearch.toLowerCase())).length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">No members found</div>
                ) : (
                    teamMembers
                        .filter(m => m.fullName.toLowerCase().includes(teamSearch.toLowerCase()))
                        .map(member => {
                            const isSelected = selectedTeam.includes(member._id);
                            return (
                                <div
                                    key={member._id}
                                    onClick={() => onToggleMember(member._id)}
                                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                >
                                    <UserAvatar member={member} size="size-8" fontSize="text-sm" />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1 truncate">{member.fullName}</span>
                                    {isSelected && (
                                        <div className="size-5 bg-brand-500 text-white rounded-full flex items-center justify-center shrink-0">
                                            <Check className="size-3" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
};

export default TeamSelector;
