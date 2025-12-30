import { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import ChartTab from "../common/ChartTab";

import API from "../../config/api";

export default function StatisticsChart() {
  const [period, setPeriod] = useState("monthly");
  const [chartData, setChartData] = useState({ categories: [], leads: [], conversions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );

      const customers = response.data.customers;
      const processedData = processDataByPeriod(customers, period);
      setChartData(processedData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setLoading(false);
    }
  };

  const processDataByPeriod = (customers, selectedPeriod) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (selectedPeriod === "monthly") {
      // Last 12 months
      const months = [];
      const leads = [];
      const conversions = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        months.push(monthName);

        const monthCustomers = customers.filter(c => {
          const createdDate = new Date(c.createdAt);
          return createdDate.getMonth() === date.getMonth() &&
            createdDate.getFullYear() === date.getFullYear();
        });

        leads.push(monthCustomers.length);
        conversions.push(monthCustomers.filter(c => c.leadStatus === 'converted').length);
      }

      return { categories: months, leads, conversions };
    }
    else if (selectedPeriod === "quarterly") {
      // Last 8 quarters
      const quarters = [];
      const leads = [];
      const conversions = [];

      for (let i = 7; i >= 0; i--) {
        const quarterDate = new Date(currentYear, currentDate.getMonth() - (i * 3), 1);
        const quarter = Math.floor(quarterDate.getMonth() / 3) + 1;
        const year = quarterDate.getFullYear();
        quarters.push(`Q${quarter} '${year.toString().slice(2)}`);

        const quarterCustomers = customers.filter(c => {
          const createdDate = new Date(c.createdAt);
          const customerQuarter = Math.floor(createdDate.getMonth() / 3) + 1;
          return customerQuarter === quarter && createdDate.getFullYear() === year;
        });

        leads.push(quarterCustomers.length);
        conversions.push(quarterCustomers.filter(c => c.leadStatus === 'converted').length);
      }

      return { categories: quarters, leads, conversions };
    }
    else { // yearly
      // Last 5 years
      const years = [];
      const leads = [];
      const conversions = [];

      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        years.push(year.toString());

        const yearCustomers = customers.filter(c => {
          const createdDate = new Date(c.createdAt);
          return createdDate.getFullYear() === year;
        });

        leads.push(yearCustomers.length);
        conversions.push(yearCustomers.filter(c => c.leadStatus === 'converted').length);
      }

      return { categories: years, leads, conversions };
    }
  };
  const options = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    xaxis: {
      type: "category",
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  const series = [
    { name: "Leads", data: chartData.leads },
    { name: "Conversions", data: chartData.conversions },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Lead vs Conversion
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Analyse your conversions against your leads.
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab onPeriodChange={setPeriod} defaultPeriod="monthly" />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="w-full">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
