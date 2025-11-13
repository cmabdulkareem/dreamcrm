import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CalenderIcon, BellIcon } from "../../icons";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function FollowUpsDue() {
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState({
    today: [],
    upcoming: [],
    overdue: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );
      
      const customers = response.data.customers;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayFollowUps = [];
      const upcomingFollowUps = [];
      const overdueFollowUps = [];
      
      customers.forEach(customer => {
        if (customer.followUpDate) {
          const followUpDate = new Date(customer.followUpDate);
          followUpDate.setHours(0, 0, 0, 0);
          
          const diffTime = followUpDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const followUpInfo = {
            _id: customer._id,
            fullName: customer.fullName,
            phone1: customer.phone1,
            followUpDate: customer.followUpDate,
            leadStatus: customer.leadStatus,
            daysDiff: diffDays
          };
          
          if (diffDays === 0) {
            todayFollowUps.push(followUpInfo);
          } else if (diffDays > 0 && diffDays <= 7) {
            upcomingFollowUps.push(followUpInfo);
          } else if (diffDays < 0) {
            overdueFollowUps.push(followUpInfo);
          }
        }
      });
      
      // Sort by date
      todayFollowUps.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
      upcomingFollowUps.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
      overdueFollowUps.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
      
      setFollowUps({
        today: todayFollowUps.slice(0, 5),
        upcoming: upcomingFollowUps.slice(0, 5),
        overdue: overdueFollowUps.slice(0, 5)
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLeadStatusColor = (status) => {
    if (status === 'converted' || status === 'qualified') return "success";
    if (status === 'negotiation' || status === 'contacted') return "info";
    if (status === 'callBackLater' || status === 'new') return "warning";
    if (status === 'lost' || status === 'notInterested') return "error";
    return "light";
  };

  const getLeadStatusLabel = (status) => {
    const statusMap = {
      new: "New Lead",
      contacted: "Contacted",
      qualified: "Qualified",
      negotiation: "In Negotiation",
      converted: "Converted",
      callBackLater: "Call Back Later",
      notInterested: "Not Interested",
      lost: "Lost"
    };
    return statusMap[status] || status;
  };

  const handleViewLead = (leadId) => {
    sessionStorage.setItem('openLeadId', leadId);
    navigate('/lead-management');
  };

  const renderFollowUpList = (title, leads, color, icon) => {
    if (leads.length === 0) return null;
    
    return (
      <div className="mb-6 last:mb-0">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h4 className="font-semibold text-gray-800 dark:text-white/90">{title}</h4>
          <Badge color={color} size="sm">{leads.length}</Badge>
        </div>
        <div className="space-y-2">
          {leads.map((lead) => (
            <div
              key={lead._id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => handleViewLead(lead._id)}
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800 dark:text-white/90">
                  {lead.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lead.phone1} • {formatDate(lead.followUpDate)}
                  {lead.daysDiff !== 0 && (
                    <span className={`ml-2 ${lead.daysDiff < 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {lead.daysDiff < 0 ? `${Math.abs(lead.daysDiff)} days overdue` : `in ${lead.daysDiff} days`}
                    </span>
                  )}
                </p>
              </div>
              <Badge
                size="sm"
                color={getLeadStatusColor(lead.leadStatus)}
              >
                {getLeadStatusLabel(lead.leadStatus)}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Follow-ups Due
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Leads requiring attention
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/lead-management')}
        >
          View All
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading follow-ups...</p>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {followUps.overdue.length > 0 && renderFollowUpList(
            "Overdue",
            followUps.overdue,
            "error",
            <BellIcon className="size-5 text-red-500" />
          )}
          
          {followUps.today.length > 0 && renderFollowUpList(
            "Today",
            followUps.today,
            "warning",
            <CalenderIcon className="size-5 text-orange-500" />
          )}
          
          {followUps.upcoming.length > 0 && renderFollowUpList(
            "Upcoming (7 days)",
            followUps.upcoming,
            "info",
            <CalenderIcon className="size-5 text-blue-500" />
          )}
          
          {followUps.today.length === 0 && 
           followUps.upcoming.length === 0 && 
           followUps.overdue.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No follow-ups scheduled</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

