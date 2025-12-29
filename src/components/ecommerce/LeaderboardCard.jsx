import { useState, useEffect } from "react";
import axios from "axios";
import ComponentCard from "../common/ComponentCard";
import { getAvatarUrl } from "../../utils/imageHelper";
import { GroupIcon, ShootingStarIcon } from "../../icons";
import Badge from "../ui/badge/Badge";

import API from "../../config/api";

export default function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState({
    topByLeads: [],
    topByConversions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leads"); // "leads" or "conversions"

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/leaderboard`,
        { withCredentials: true }
      );

      setLeaderboard({
        topByLeads: response.data.topByLeads || [],
        topByConversions: response.data.topByConversions || []
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    }
  };

  const getRankBadgeColor = (index) => {
    if (index === 0) return "success"; // Gold
    if (index === 1) return "info"; // Silver
    if (index === 2) return "warning"; // Bronze
    return "light";
  };

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const displayData = activeTab === "leads" ? leaderboard.topByLeads : leaderboard.topByConversions;
  const title = activeTab === "leads" ? "Most Leads This Month" : "Most Conversions This Month";

  return (
    <ComponentCard title="Leaderboard">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "leads"
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <GroupIcon className="size-4" />
              Most Leads
            </div>
          </button>
          <button
            onClick={() => setActiveTab("conversions")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "conversions"
                ? "text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShootingStarIcon className="size-4" />
              Most Conversions
            </div>
          </button>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No data available for this month</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayData.map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {index < 3 ? (
                      <span className="text-lg">{getRankIcon(index)}</span>
                    ) : (
                      <Badge color={getRankBadgeColor(index)} className="text-xs">
                        {index + 1}
                      </Badge>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = "/images/user/user-01.jpg";
                      }}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white/90 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 ml-4">
                  {activeTab === "leads" ? (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {user.totalLeads}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
                      </div>
                      {user.conversions > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-success-600 dark:text-success-400">
                            {user.conversions}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Converted</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-success-600 dark:text-success-400">
                          {user.conversions}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Conversions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                          {user.conversionRate}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ComponentCard>
  );
}

