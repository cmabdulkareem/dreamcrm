import Chart from "react-apexcharts";
import { useState, useEffect } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import LoadingSpinner from "../common/LoadingSpinner";
import ChartTab from "../common/ChartTab";
import API from "../../config/api";

export default function CombinedRevenueLeadsChart() {
    const [activeTab, setActiveTab] = useState("revenue"); // "revenue" or "leads"
    const [period, setPeriod] = useState("monthly"); // For Leads chart
    const [revenueData, setRevenueData] = useState({ months: [], revenue: [] });
    const [leadData, setLeadData] = useState({ categories: [], leads: [], conversions: [] });
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchRevenueData();
        fetchLeadData();
    }, [period]);

    const fetchRevenueData = async () => {
        try {
            const response = await axios.get(
                `${API}/payments/stats/monthly-revenue`,
                { withCredentials: true }
            );
            setRevenueData(response.data.revenueGraph || { months: [], revenue: [] });
            if (activeTab === "revenue") setLoading(false);
        } catch (error) {
            console.error("Error fetching revenue data:", error);
        }
    };

    const fetchLeadData = async () => {
        try {
            const response = await axios.get(
                `${API}/customers/all`,
                { withCredentials: true }
            );

            const customers = response.data.customers || [];
            const processedData = processLeadDataByPeriod(customers, period);
            setLeadData(processedData);
            if (activeTab === "leads") setLoading(false);
        } catch (error) {
            console.error("Error fetching lead data:", error);
        }
    };

    const processLeadDataByPeriod = (customers, selectedPeriod) => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        if (selectedPeriod === "monthly") {
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
        } else if (selectedPeriod === "quarterly") {
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
        } else {
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

    // --- REVENUE CHART OPTIONS (Restored from MonthlySalesChart.jsx) ---
    const maxRevenue = revenueData.revenue?.length > 0 ? Math.max(...revenueData.revenue) : 10;
    const revenueChartMax = maxRevenue > 0 ? Math.ceil(maxRevenue * 1.2) : 10;

    const revenueOptions = {
        colors: ["#465fff"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 310,
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "39%",
                borderRadius: 5,
                borderRadiusApplication: "end",
            },
        },
        dataLabels: { enabled: false },
        stroke: { show: false },
        xaxis: {
            categories: revenueData.months || [],
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        legend: { show: true, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
        yaxis: {
            min: 0,
            max: revenueChartMax,
            tickAmount: 4,
            labels: {
                formatter: (val) => `₹${val.toFixed(1)}L`,
                style: { colors: ["#6B7280"], fontSize: "12px" },
            },
        },
        grid: { yaxis: { lines: { show: true } } },
        fill: { opacity: 1 },
        tooltip: {
            y: { formatter: (val) => `₹${(val * 100000).toLocaleString('en-IN')}` },
        },
    };

    // --- LEADS CHART OPTIONS (Restored from StatisticsChart.jsx) ---
    const leadOptions = {
        legend: { show: false, position: "top", horizontalAlign: "left" },
        colors: ["#465FFF", "#9CB9FF"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            height: 310,
            type: "area",
            toolbar: { show: false },
        },
        stroke: { curve: "straight", width: [2, 2] },
        fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
        markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
        grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        dataLabels: { enabled: false },
        tooltip: { enabled: true },
        xaxis: {
            type: "category",
            categories: leadData.categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false },
        },
        yaxis: {
            tickAmount: 4,
            labels: {
                formatter: (val) => Math.floor(val).toString(),
                style: { fontSize: "12px", colors: ["#6B7280"] }
            },
            title: { text: "", style: { fontSize: "0px" } },
        },
    };

    const revenueSeries = [{ name: "Revenue", data: revenueData.revenue || [] }];
    const leadSeries = [
        { name: "Leads", data: leadData.leads },
        { name: "Conversions", data: leadData.conversions },
    ];

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:p-5 h-full flex flex-col">
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        {activeTab === "revenue" ? "Monthly Revenue" : "Lead vs Conversion"}
                    </h3>
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        {activeTab === "revenue"
                            ? "Performance of revenue over time"
                            : "Analyse your conversions against your leads."
                        }
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Switch Tab (Original Style) */}
                    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                        <button
                            onClick={() => setActiveTab("revenue")}
                            className={`px-3 py-1.5 font-medium rounded-md text-xs transition-all ${activeTab === "revenue"
                                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            Revenue
                        </button>
                        <button
                            onClick={() => setActiveTab("leads")}
                            className={`px-3 py-1.5 font-medium rounded-md text-xs transition-all ${activeTab === "leads"
                                ? "bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            Leads
                        </button>
                    </div>

                    {activeTab === "leads" && (
                        <div className="hidden sm:block">
                            <ChartTab onPeriodChange={setPeriod} defaultPeriod="monthly" />
                        </div>
                    )}

                    <div className="relative inline-block">
                        <button className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
                        </button>
                        <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-40 p-2">
                            <DropdownItem onItemClick={() => setIsOpen(false)}>View More</DropdownItem>
                        </Dropdown>
                    </div>
                </div>
            </div>

            <div className="flex-grow max-w-full overflow-hidden">
                <div className="min-w-[650px] xl:min-w-full h-[310px]">
                    {loading ? (
                        <LoadingSpinner className="h-[310px]" />
                    ) : (
                        <Chart
                            key={activeTab}
                            options={activeTab === "revenue" ? revenueOptions : leadOptions}
                            series={activeTab === "revenue" ? revenueSeries : leadSeries}
                            type={activeTab === "revenue" ? "bar" : "area"}
                            height={310}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
