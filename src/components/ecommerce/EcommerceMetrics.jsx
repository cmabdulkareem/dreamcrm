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
import LoadingSpinner from "../common/LoadingSpinner";

import API from "../../config/api";

export default function EcommerceMetrics() {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    currentMonthLeads: 0,
    lastMonthLeads: 0,
    leadsGrowth: 0,
    conversionRate: 0,
    convertedLeads: 0,
    brandConvertedLeads: 0,
    brandConversionRate: 0,
    totalRevenue: 0,
    financialYearRevenue: 0,
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
    totalStudents: 0,
    currentMonthStudents: 0,
    lastMonthStudents: 0,
    studentsGrowth: 0,
    financialYearCollection: 0,
    currentMonthCollection: 0,
    lastMonthCollection: 0,
    collectionGrowth: 0,
    currentMonthConvertedLeads: 0,
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
      const [customersResponse, studentsResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/customers/all`, { withCredentials: true }),
        axios.get(`${API}/students/all`, { withCredentials: true }),
        axios.get(`${API}/payments/stats/monthly-revenue`, { withCredentials: true })
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

      // Calculation helper to avoid NaN and handle zeros correctly
      const calculateGrowth = (current, last) => {
        const c = parseFloat(current) || 0;
        const l = parseFloat(last) || 0;
        if (l === 0) return c > 0 ? 100 : 0;
        return ((c - l) / l) * 100;
      };

      const leadsGrowth = calculateGrowth(currentMonthLeads, lastMonthLeads);

      // Total Conversions = Total Students (Converted from Leads + Direct Walk-ins)
      const convertedLeads = students.length;

      const currentMonthConvertedLeads = students.filter(s => {
        const docDate = new Date(s.enrollmentDate || s.createdAt);
        return docDate.getMonth() === currentMonth &&
          docDate.getFullYear() === currentYear;
      }).length;

      // Adjust Total Leads pool to include direct walk-ins (students without leadId)
      // This ensures conversion rate doesn't exceed 100% and reflects total potential intake
      const directStudents = students.filter(s => !s.leadId).length;
      const effectiveTotalLeads = totalLeads + directStudents;

      const conversionRate = effectiveTotalLeads > 0 ? ((convertedLeads / effectiveTotalLeads) * 100) : 0;

      // Revenue and Collection calculations from stats API
      const {
        financialYearRevenue = 0,
        currentMonthRevenue = 0,
        lastMonthRevenue = 0,
        financialYearCollection = 0,
        currentMonthCollection = 0,
        lastMonthCollection = 0
      } = statsResponse.data;

      const totalRevenueGross = students.reduce((sum, s) => sum + (parseFloat(s.finalAmount) || 0), 0);
      const totalRevenue = totalRevenueGross / 1.18;

      const revenueGrowth = calculateGrowth(currentMonthRevenue, lastMonthRevenue);
      const collectionGrowth = calculateGrowth(currentMonthCollection, lastMonthCollection);

      // Students metrics
      const totalStudents = students.length;

      const currentMonthStudents = students.filter(s => {
        const enrollmentDate = new Date(s.enrollmentDate || s.createdAt);
        return enrollmentDate.getMonth() === currentMonth &&
          enrollmentDate.getFullYear() === currentYear;
      }).length;

      const lastMonthStudents = students.filter(s => {
        const enrollmentDate = new Date(s.enrollmentDate || s.createdAt);
        return enrollmentDate.getMonth() === lastMonth &&
          enrollmentDate.getFullYear() === lastMonthYear;
      }).length;

      const studentsGrowth = calculateGrowth(currentMonthStudents, lastMonthStudents);

      setMetrics({
        totalLeads: effectiveTotalLeads,
        currentMonthLeads,
        lastMonthLeads,
        leadsGrowth: parseFloat(leadsGrowth.toFixed(1)),
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        convertedLeads,
        brandConvertedLeads: convertedLeads,
        brandConversionRate: conversionRate,
        totalRevenue: totalRevenue || 0,
        financialYearRevenue: financialYearRevenue || 0,
        currentMonthRevenue: currentMonthRevenue || 0,
        lastMonthRevenue: lastMonthRevenue || 0,
        revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
        totalStudents,
        currentMonthStudents,
        lastMonthStudents,
        studentsGrowth: parseFloat(studentsGrowth.toFixed(1)),
        financialYearCollection: financialYearCollection || 0,
        currentMonthCollection: currentMonthCollection || 0,
        lastMonthCollection: lastMonthCollection || 0,
        collectionGrowth: parseFloat(collectionGrowth.toFixed(1)),
        currentMonthConvertedLeads,
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
    if (amount === undefined || amount === null) return "₹0";
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Content for the Merged Leads & Conversion card
  const mergedLeadsFrontContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
      <div className="grid grid-cols-[1.5fr_1fr] gap-4 h-full">
        {/* Left Half: Total Leads */}
        <div className="flex flex-col h-full border-r border-gray-100 dark:border-gray-800 pr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/30">
              <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
            </div>
            {!loading && metrics.leadsGrowth !== 0 && (
              <Badge color={metrics.leadsGrowth >= 0 ? "success" : "error"}>
                {metrics.leadsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(metrics.leadsGrowth)}%
              </Badge>
            )}
          </div>
          <div className="mt-5 flex-grow">
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap block">Total Leads</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? <LoadingSpinner className="h-6" size="h-4 w-4" /> : metrics.totalLeads}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {metrics.currentMonthLeads} this month
            </p>
          </div>
        </div>

        {/* Right Half: Conversion Rate */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/30">
            <ShootingStarIcon className="text-green-600 size-6 dark:text-green-400" />
          </div>
          <div className="mt-5 flex-grow">
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap block">Total Conv.</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? <LoadingSpinner className="h-6" size="h-4 w-4" /> : metrics.convertedLeads}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {metrics.currentMonthConvertedLeads} / {metrics.currentMonthLeads} leads
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const mergedLeadsBackContent = (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col justify-center items-center h-full text-center">
      <div className="mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest block">Brand Wide Statistics</span>
      </div>
      <div className="grid grid-cols-[1.5fr_1fr] gap-8 w-full">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-2 font-medium">Total Across Brand</span>
          <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <LoadingSpinner size="h-4 w-4" /> : allLeadsCount}
          </h4>
        </div>
        <div className="flex flex-col items-center border-l border-gray-100 dark:border-gray-800">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase mb-2 font-medium">Brand Conv. Rate</span>
          <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <LoadingSpinner size="h-4 w-4" /> : `${metrics.brandConversionRate?.toFixed(1) || 0}%`}
          </h4>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6 items-stretch">
      {/* Merged Leads & Conversion */}
      <div className="h-full">
        <FlipCard
          frontContent={mergedLeadsFrontContent}
          backContent={mergedLeadsBackContent}
        />
      </div>

      {/* Total Collection */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl dark:bg-emerald-900/30">
            <DollarLineIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          </div>
          {!loading && metrics.collectionGrowth !== 0 && (
            <Badge color={metrics.collectionGrowth >= 0 ? "success" : "error"}>
              {metrics.collectionGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.collectionGrowth)}%
            </Badge>
          )}
        </div>
        <div className="mt-5 flex-grow">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap block">Total Collection</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <LoadingSpinner className="h-6" size="h-4 w-4" /> : formatCurrency(metrics.financialYearCollection)}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formatCurrency(metrics.currentMonthCollection)} this month
          </p>
        </div>
      </div>

      {/* FY Revenue / Sales */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl dark:bg-purple-900/30">
            <DollarLineIcon className="text-purple-600 size-6 dark:text-purple-400" />
          </div>
          {!loading && metrics.revenueGrowth !== 0 && (
            <Badge color={metrics.revenueGrowth >= 0 ? "success" : "error"}>
              {metrics.revenueGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.revenueGrowth)}%
            </Badge>
          )}
        </div>
        <div className="mt-5 flex-grow">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap block">Total Revenue</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <LoadingSpinner className="h-6" size="h-4 w-4" /> : formatCurrency(metrics.financialYearRevenue)}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formatCurrency(metrics.currentMonthRevenue)} this month
          </p>
        </div>
      </div>

      {/* Active Students */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl dark:bg-orange-900/30">
            <BoxIconLine className="text-orange-600 size-6 dark:text-orange-400" />
          </div>
          {!loading && metrics.studentsGrowth !== 0 && (
            <Badge color={metrics.studentsGrowth >= 0 ? "success" : "error"}>
              {metrics.studentsGrowth >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(metrics.studentsGrowth)}%
            </Badge>
          )}
        </div>
        <div className="mt-5 flex-grow">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap block">Active Students</span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? <LoadingSpinner className="h-6" size="h-4 w-4" /> : metrics.totalStudents}
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {metrics.currentMonthStudents} enrolled this month
          </p>
        </div>
      </div>
    </div>
  );
}
