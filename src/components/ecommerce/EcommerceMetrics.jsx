import { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
  ShootingStarIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import FlipCard from "./FlipCard";

import API from "../../config/api";

export default function EcommerceMetrics() {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    currentMonthLeads: 0,
    lastMonthLeads: 0,
    leadsGrowth: 0,
    conversionRate: 0,
    convertedLeads: 0,
    brandConvertedLeads: 0,  // Start with 0 instead of copying user data
    brandConversionRate: 0,  // Start with 0 instead of copying user data
    totalRevenue: 0,
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
    totalStudents: 0,
    currentMonthStudents: 0,
    lastMonthStudents: 0,
    studentsGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allLeadsCount, setAllLeadsCount] = useState(0);

  useEffect(() => {
    fetchMetrics();
    fetchAllLeadsCount();
    fetchBrandConversionMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [customersResponse, studentsResponse] = await Promise.all([
        axios.get(`${API}/customers/all`, { withCredentials: true }),
        axios.get(`${API}/students/all`, { withCredentials: true })
      ]);

      const customers = customersResponse.data.customers;
      const students = studentsResponse.data.students || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get last month's date
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Total leads
      const totalLeads = customers.length;

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

      // Conversion rate (converted leads / total leads)
      const convertedLeads = customers.filter(c => c.leadStatus === 'converted').length;
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100) : 0;

      // Revenue calculations from students
      const totalRevenue = students.reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      const currentMonthRevenue = students
        .filter(s => {
          const createdDate = new Date(s.createdAt);
          return createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear;
        })
        .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      const lastMonthRevenue = students
        .filter(s => {
          const createdDate = new Date(s.createdAt);
          return createdDate.getMonth() === lastMonth &&
            createdDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      const revenueGrowth = lastMonthRevenue === 0
        ? (currentMonthRevenue > 0 ? 100 : 0)
        : (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

      // Students metrics
      const totalStudents = students.length;

      const currentMonthStudents = students.filter(s => {
        const createdDate = new Date(s.createdAt);
        return createdDate.getMonth() === currentMonth &&
          createdDate.getFullYear() === currentYear;
      }).length;

      const lastMonthStudents = students.filter(s => {
        const createdDate = new Date(s.createdAt);
        return createdDate.getMonth() === lastMonth &&
          createdDate.getFullYear() === lastMonthYear;
      }).length;

      const studentsGrowth = lastMonthStudents === 0
        ? (currentMonthStudents > 0 ? 100 : 0)
        : (((currentMonthStudents - lastMonthStudents) / lastMonthStudents) * 100);

      setMetrics({
        totalLeads,
        currentMonthLeads,
        lastMonthLeads,
        leadsGrowth: parseFloat(leadsGrowth.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        convertedLeads,
        brandConvertedLeads: convertedLeads, // Will be updated by fetchBrandConversionMetrics
        brandConversionRate: conversionRate, // Will be updated by fetchBrandConversionMetrics
        totalRevenue,
        currentMonthRevenue,
        lastMonthRevenue,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        totalStudents,
        currentMonthStudents,
        lastMonthStudents,
        studentsGrowth: parseFloat(studentsGrowth.toFixed(2)),
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setLoading(false);
    }
  };

  // Fetch total leads count across all users
  const fetchAllLeadsCount = async () => {
    try {
      const response = await axios.get(`${API}/customers/all-leads-count`, { withCredentials: true });
      setAllLeadsCount(response.data.count);
    } catch (error) {
      console.error("Error fetching all leads count:", error);
    }
  };

  // Fetch brand-wide conversion metrics
  const fetchBrandConversionMetrics = async () => {
    try {
      const response = await axios.get(`${API}/customers/brand-conversion-metrics`, { withCredentials: true });
      const { convertedLeads, conversionRate } = response.data;

      setMetrics(prevMetrics => ({
        ...prevMetrics,
        brandConvertedLeads: convertedLeads,
        brandConversionRate: parseFloat(conversionRate.toFixed(2))
      }));
    } catch (error) {
      console.error("Error fetching brand conversion metrics:", error);
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  // Front content for the Total Leads card
  const totalLeadsFrontContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
        <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
      </div>

      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total Leads
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? "..." : metrics.totalLeads}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {metrics.currentMonthLeads} this month
          </p>
        </div>
        {!loading && metrics.leadsGrowth !== 0 && (
          <Badge color={metrics.leadsGrowth >= 0 ? "success" : "error"}>
            {metrics.leadsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(metrics.leadsGrowth)}%
          </Badge>
        )}
      </div>
    </div>
  );

  // Back content for the Total Leads card (shows all leads across brand)
  const totalLeadsBackContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col items-center justify-center text-center">
      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
        <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
      </div>

      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total Leads Across Brand
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {loading ? "..." : allLeadsCount}
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leads from all users
        </p>
      </div>
    </div>
  );

  // Front content for the Conversion Rate card
  const conversionRateFrontContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
        <ShootingStarIcon className="text-green-600 size-6 dark:text-green-400" />
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Conversion Rate
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? "..." : `${metrics.conversionRate.toFixed(1)}%`}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {loading ? "..." : `${metrics.convertedLeads} / ${metrics.totalLeads} Leads`}
          </p>
        </div>
      </div>
    </div>
  );

  // Back content for the Conversion Rate card (shows total conversions across all users)
  const conversionRateBackContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col items-center justify-center text-center">
      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
        <ShootingStarIcon className="text-green-600 size-6 dark:text-green-400" />
      </div>

      <div className="mt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Brand Conversion Rate
        </span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {loading ? "..." : `${metrics.brandConversionRate?.toFixed(1) || 0}%`}
        </h4>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {loading ? "..." : `${metrics.brandConvertedLeads || 0} / ${allLeadsCount} Leads`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Total Leads with Flip Card */}
      <div>
        <FlipCard
          frontContent={totalLeadsFrontContent}
          backContent={totalLeadsBackContent}
        />
      </div>

      {/* Conversion Rate with Flip Card */}
      <div>
        <FlipCard
          frontContent={conversionRateFrontContent}
          backContent={conversionRateBackContent}
        />
      </div>

      {/* Total Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-900/30">
          <DollarLineIcon className="text-purple-600 size-6 dark:text-purple-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : formatCurrency(metrics.totalRevenue)}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(metrics.currentMonthRevenue)} this month
            </p>
          </div>
          {!loading && metrics.revenueGrowth !== 0 && (
            <Badge color={metrics.revenueGrowth >= 0 ? "success" : "error"}>
              {metrics.revenueGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.revenueGrowth)}%
            </Badge>
          )}
        </div>
      </div>

      {/* Active Students */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30">
          <BoxIconLine className="text-orange-600 size-6 dark:text-orange-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Students
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : metrics.totalStudents}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {metrics.currentMonthStudents} enrolled this month
            </p>
          </div>
          {!loading && metrics.studentsGrowth !== 0 && (
            <Badge color={metrics.studentsGrowth >= 0 ? "success" : "error"}>
              {metrics.studentsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.studentsGrowth)}%
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}