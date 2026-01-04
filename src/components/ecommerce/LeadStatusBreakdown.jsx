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
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );

      const customers = response.data.customers;

      // Status mapping with colors
      const statusMap = {
        new: { label: "New Lead", color: "#FFA500" },
        contacted: { label: "Contacted", color: "#3B82F6" },
        qualified: { label: "Qualified", color: "#10B981" },
        negotiation: { label: "Negotiation", color: "#8B5CF6" },
        converted: { label: "Converted", color: "#059669" },
        callBackLater: { label: "Call Back", color: "#F59E0B" },
        notInterested: { label: "Not Interested", color: "#EF4444" },
        lost: { label: "Lost", color: "#DC2626" }
      };

      // Count leads by status
      const statusCounts = {};
      customers.forEach(customer => {
        const status = customer.leadStatus || 'new';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

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
    },
    labels: statusData.categories,
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      fontSize: "12px",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: "16px",
              fontWeight: 700,
              formatter: function (val) {
                return val;
              },
            },
            total: {
              show: true,
              label: "Total Leads",
              fontSize: "14px",
              fontWeight: 600,
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0);
        const percentage = ((val / total) * 100).toFixed(1);
        return percentage + '%';
      },
    },
    tooltip: {
      y: {
        formatter: function (val, opts) {
          const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0);
          const percentage = ((val / total) * 100).toFixed(1);
          return `${val} leads (${percentage}%)`;
        },
      },
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

