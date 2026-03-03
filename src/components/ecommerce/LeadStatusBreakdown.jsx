import { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import LoadingSpinner from "../common/LoadingSpinner";

import API from "../../config/api";

export default function LeadStatusBreakdown() {
  const [statusData, setStatusData] = useState({ categories: [], values: [], colors: [] });
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchStatusData();
  }, []);

  const fetchStatusData = async () => {
    try {
      const [customersRes, studentsRes] = await Promise.all([
        axios.get(`${API}/customers/all`, { withCredentials: true }),
        axios.get(`${API}/students/all`, { withCredentials: true })
      ]);

      const customers = customersRes.data.customers || [];
      const students = studentsRes.data.students || [];

      // Status mapping with colors
      // Status mapping with premium colors
      const statusMap = {
        new: { label: "New Lead", color: "#4F46E5" }, // Indigo
        contacted: { label: "Contacted", color: "#0EA5E9" }, // Sky
        qualified: { label: "Qualified", color: "#10B981" }, // Emerald
        negotiation: { label: "Negotiation", color: "#8B5CF6" }, // Violet
        converted: { label: "Converted", color: "#059669" }, // Green
        callBackLater: { label: "Call Back", color: "#F59E0B" }, // Amber
        notInterested: { label: "Not Interested", color: "#94A3B8" }, // Slate
        lost: { label: "Lost", color: "#E11D48" } // Rose
      };

      // Count leads by status
      const statusCounts = {};

      // 1. Process Customers
      customers.forEach(customer => {
        // Priority: if admission taken, it's 'converted'
        const status = customer.isAdmissionTaken ? 'converted' : (customer.leadStatus || 'new');
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // 2. Add Direct Students (those without leadId) to 'converted'
      const directStudentsCount = students.filter(s => !s.leadId).length;
      statusCounts['converted'] = (statusCounts['converted'] || 0) + directStudentsCount;

      // Convert to arrays for chart
      const categories = [];
      const values = [];
      const colors = [];

      Object.entries(statusCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .forEach(([status, count]) => {
          if (statusMap[status]) {
            categories.push(statusMap[status].label);
            values.push(count);
            colors.push(statusMap[status].color);
          }
        });

      setStatusData({ categories, values, colors });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching status data:", error);
      setLoading(false);
    }
  };

  const options = {
    colors: statusData.colors.length > 0 ? statusData.colors : ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 300,
      toolbar: { show: false },
    },
    labels: statusData.categories,
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      fontSize: "12px",
      markers: { radius: 12, size: 6 },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["#fff"],
    },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              fontWeight: 500,
              offsetY: -10,
              color: "#64748B",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              offsetY: 10,
              color: "#1E293B",
              formatter: function (val) {
                return val;
              },
            },
            total: {
              show: true,
              label: "TOTAL LEADS",
              fontSize: "11px",
              fontWeight: 600,
              color: "#94A3B8",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false, // Disabled to prevent overlapping on small slices
    },
    states: {
      hover: {
        filter: { type: "none" },
      },
    },
    tooltip: {
      enabled: true,
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const value = series[seriesIndex];
        const label = w.globals.labels[seriesIndex];
        const color = w.globals.colors[seriesIndex];
        const total = series.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);

        return `
          <div className="p-3 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-xl min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
              <span className="text-xs font-semibold text-gray-800 dark:text-white">${label}</span>
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white/90">
              ${value} <span className="text-xs font-normal text-gray-500 ml-1">leads</span>
            </div>
            <div className="mt-1 text-[10px] text-gray-400 font-medium">
              ${percentage}% of total distribution
            </div>
          </div>
        `;
      }
    },
  };

  const series = statusData.values;

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Lead Status Breakdown
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Distribution of leads by status
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="h-[300px]" />
      ) : series.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500">No lead data available</p>
        </div>
      ) : (
        <Chart options={options} series={series} type="donut" height={300} />
      )}
    </div>
  );
}

