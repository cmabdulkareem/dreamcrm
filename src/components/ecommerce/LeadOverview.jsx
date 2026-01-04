import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useState, useEffect } from "react";
import axios from "axios";
import Button from "../ui/button/Button";
import { PencilIcon, BellIcon } from "../../icons";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";

import API from "../../config/api";

export default function LeadOverview() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestLeads();
  }, []);

  const fetchLatestLeads = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );

      // Get latest 5 leads sorted by creation date
      const latestLeads = response.data.customers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setLeads(latestLeads);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leads:", error);
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

  const getLeadStatusLabel = (value) => {
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
    return statusMap[value] || "New Lead";
  };

  const getLeadStatusColor = (status) => {
    if (status === 'converted' || status === 'qualified') return "success";
    if (status === 'negotiation' || status === 'contacted') return "info";
    if (status === 'callBackLater' || status === 'new') return "warning";
    if (status === 'lost' || status === 'notInterested') return "error";
    return "light";
  };

  const handleViewAll = () => {
    navigate('/lead-management');
  };

  const handleQuickEdit = (leadId) => {
    // Store leadId and navigate to lead management
    sessionStorage.setItem('openLeadId', leadId);
    navigate('/lead-management');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Enquiries</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Latest 5 leads</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewAll}
            >
              View All
            </Button>
          </div>

          {/* Table */}
          <div className="max-w-full overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Mobile</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lead Status</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Next Follow-up</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                      No leads found.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.fullName}</p>
                            <p className="text-gray-400 text-xs">{row.coursePreference?.join(", ") || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.phone1}</TableCell>
                      <TableCell className="py-3">
                        <Badge
                          size="sm"
                          color={getLeadStatusColor(row.leadStatus)}
                        >
                          {getLeadStatusLabel(row.leadStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.followUpDate)}</TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          endIcon={<PencilIcon className="size-5" />}
                          onClick={() => handleQuickEdit(row._id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
