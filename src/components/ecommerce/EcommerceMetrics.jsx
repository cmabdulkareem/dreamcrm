import { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function EcommerceMetrics() {
  const [metrics, setMetrics] = useState({
    currentMonthLeads: 0,
    lastMonthLeads: 0,
    leadsGrowth: 0,
    currentMonthAdmissions: 0,
    lastMonthAdmissions: 0,
    admissionsGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );
      
      const customers = response.data.customers;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Get last month's date
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      // Current month leads
      const currentMonthLeads = customers.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      }).length;
      
      // Last month leads
      const lastMonthLeads = customers.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === lastMonth && 
               createdDate.getFullYear() === lastMonthYear;
      }).length;
      
      // Calculate growth percentage
      const leadsGrowth = lastMonthLeads === 0 
        ? (currentMonthLeads > 0 ? 100 : 0)
        : (((currentMonthLeads - lastMonthLeads) / lastMonthLeads) * 100);
      
      // Current month admissions (converted leads)
      const currentMonthAdmissions = customers.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear &&
               c.leadStatus === 'converted';
      }).length;
      
      // Last month admissions
      const lastMonthAdmissions = customers.filter(c => {
        const createdDate = new Date(c.createdAt);
        return createdDate.getMonth() === lastMonth && 
               createdDate.getFullYear() === lastMonthYear &&
               c.leadStatus === 'converted';
      }).length;
      
      // Calculate admissions growth percentage
      const admissionsGrowth = lastMonthAdmissions === 0 
        ? (currentMonthAdmissions > 0 ? 100 : 0)
        : (((currentMonthAdmissions - lastMonthAdmissions) / lastMonthAdmissions) * 100);
      
      setMetrics({
        currentMonthLeads,
        lastMonthLeads,
        leadsGrowth: parseFloat(leadsGrowth.toFixed(2)),
        currentMonthAdmissions,
        lastMonthAdmissions,
        admissionsGrowth: parseFloat(admissionsGrowth.toFixed(2)),
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setLoading(false);
    }
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Leads
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.currentMonthLeads}
            </h4>
          </div>
          {!loading && (
            <Badge color={metrics.leadsGrowth >= 0 ? "success" : "error"}>
              {metrics.leadsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.leadsGrowth)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Admissions
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.currentMonthAdmissions}
            </h4>
          </div>

          {!loading && (
            <Badge color={metrics.admissionsGrowth >= 0 ? "success" : "error"}>
              {metrics.admissionsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.admissionsGrowth)}%
            </Badge>
          )}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
