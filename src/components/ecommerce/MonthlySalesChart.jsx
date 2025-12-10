import Chart from "react-apexcharts";
import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

import API from "../../config/api";

export default function MonthlySalesChart() {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await axios.get(
        `${API}/students/all`,
        { withCredentials: true }
      );

      const students = response.data.students || [];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Get last 12 months data
      const monthlyRevenue = [];
      const monthNames = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        monthNames.push(monthName);

        const monthStudents = students.filter(s => {
          const createdDate = new Date(s.createdAt);
          return createdDate.getMonth() === date.getMonth() &&
            createdDate.getFullYear() === date.getFullYear();
        });

        const monthRevenue = monthStudents.reduce((sum, s) => sum + (s.finalAmount || 0), 0);
        monthlyRevenue.push(monthRevenue / 100000); // Convert to lakhs
      }

      setRevenueData({ months: monthNames, revenue: monthlyRevenue });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setLoading(false);
    }
  };

  const maxRevenue = revenueData.revenue?.length > 0
    ? Math.max(...revenueData.revenue)
    : 10;
  const chartMax = maxRevenue > 0 ? Math.ceil(maxRevenue * 1.2) : 10;

  const options = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: revenueData.months || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      min: 0,
      max: chartMax,
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          return `₹${val.toFixed(1)}L`;
        },
        style: { colors: ["#6B7280"], fontSize: "12px" },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: function (val) {
          return `₹${(val * 100000).toLocaleString('en-IN')}`;
        },
      },
    },
  };

  const series = [
    {
      name: "Revenue",
      data: revenueData.revenue || [],
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Monthly Revenue
        </h3>
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

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading revenue data...</p>
            </div>
          ) : (
            <Chart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}
