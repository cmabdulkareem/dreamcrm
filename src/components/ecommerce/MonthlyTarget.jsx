import Chart from "react-apexcharts";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { AuthContext } from "../../context/AuthContext";
import { isAdmin, isOwner } from "../../utils/roleHelpers";
import { toast } from "react-toastify";

import API from "../../config/api";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyTarget() {
  const { user } = useContext(AuthContext);
  const canEditTargets = isAdmin(user) || isOwner(user);
  
  const [metrics, setMetrics] = useState({
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    targetRevenue: 1000000, // Default target: 10L
    percentage: 0,
    revenueGrowth: 0,
    todayRevenue: 0,
  });
  const [targets, setTargets] = useState([]); // Targets for current + next 3 months
  const [loading, setLoading] = useState(true);
  
  // Edit modal states
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const [editTargets, setEditTargets] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRevenueData();
    fetchMonthlyTargets();
  }, []);

  const fetchMonthlyTargets = async () => {
    try {
      const response = await axios.get(
        `${API}/monthly-targets/all`,
        { withCredentials: true }
      );
      setTargets(response.data.targets || []);
    } catch (error) {
      console.error("Error fetching monthly targets:", error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await axios.get(
        `${API}/students/all`,
        { withCredentials: true }
      );

      const students = response.data.students || [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Get last month's date
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Current month revenue
      const currentMonthRevenue = students
        .filter(s => {
          const createdDate = new Date(s.createdAt);
          return createdDate.getMonth() === currentMonth &&
            createdDate.getFullYear() === currentYear;
        })
        .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      // Last month revenue
      const lastMonthRevenue = students
        .filter(s => {
          const createdDate = new Date(s.createdAt);
          return createdDate.getMonth() === lastMonth &&
            createdDate.getFullYear() === lastMonthYear;
        })
        .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      // Today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRevenue = students
        .filter(s => {
          const createdDate = new Date(s.createdAt);
          createdDate.setHours(0, 0, 0, 0);
          return createdDate.getTime() === today.getTime();
        })
        .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

      // Calculate growth
      const revenueGrowth = lastMonthRevenue === 0
        ? (currentMonthRevenue > 0 ? 100 : 0)
        : (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

      // Get target from API or use calculated default
      const currentTarget = targets.find(t => t.month === currentMonth && t.year === currentYear);
      let targetRevenue = currentTarget?.targetRevenue || 1000000; // Default 10L
      
      // If no target set, calculate default
      if (!currentTarget?.targetRevenue) {
        if (students.length > 0) {
          const last3MonthsRevenue = [];
          for (let i = 1; i <= 3; i++) {
            const month = currentMonth - i < 0 ? 12 + (currentMonth - i) : currentMonth - i;
            const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
            const monthRevenue = students
              .filter(s => {
                const createdDate = new Date(s.createdAt);
                return createdDate.getMonth() === month &&
                  createdDate.getFullYear() === year;
              })
              .reduce((sum, s) => sum + (s.finalAmount || 0), 0);
            last3MonthsRevenue.push(monthRevenue);
          }
          if (last3MonthsRevenue.length > 0) {
            const avgRevenue = last3MonthsRevenue.reduce((a, b) => a + b, 0) / last3MonthsRevenue.length;
            targetRevenue = Math.max(avgRevenue * 1.2, 100000); // At least 1L
          }
        }
      }

      // Calculate percentage
      const percentage = targetRevenue > 0
        ? Math.min((currentMonthRevenue / targetRevenue) * 100, 100)
        : 0;

      setMetrics({
        currentMonthRevenue,
        lastMonthRevenue,
        targetRevenue,
        percentage: parseFloat(percentage.toFixed(2)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        todayRevenue,
      });
      setLoading(false);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setLoading(false);
    }
  };

  // Update metrics when targets change
  useEffect(() => {
    if (targets.length > 0) {
      fetchRevenueData();
    }
  }, [targets]);

  const handleEditClick = () => {
    // Prepare edit targets for current month + next 3 months
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const editTargetsData = [];
    for (let i = 0; i < 4; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentMonth + i >= 12 ? currentYear + 1 : currentYear;
      const existingTarget = targets.find(t => t.month === month && t.year === year);
      
      editTargetsData.push({
        year,
        month,
        monthName: monthNames[month],
        targetRevenue: existingTarget?.targetRevenue || "",
        _id: existingTarget?._id || null
      });
    }
    setEditTargets(editTargetsData);
    openEditModal();
  };

  const handleTargetChange = (index, value) => {
    const updated = [...editTargets];
    updated[index].targetRevenue = value;
    setEditTargets(updated);
  };

  const handleSaveTargets = async () => {
    setSaving(true);
    try {
      // Save each target
      const savePromises = editTargets.map(async (target) => {
        if (!target.targetRevenue || target.targetRevenue <= 0) {
          return; // Skip empty targets
        }
        
        await axios.post(
          `${API}/monthly-targets/set`,
          {
            year: target.year,
            month: target.month,
            targetRevenue: parseFloat(target.targetRevenue)
          },
          { withCredentials: true }
        );
      });

      await Promise.all(savePromises);
      
      toast.success("Monthly targets updated successfully!");
      await fetchMonthlyTargets();
      closeEditModal();
    } catch (error) {
      console.error("Error saving targets:", error);
      toast.error(error.response?.data?.message || "Failed to save targets");
    } finally {
      setSaving(false);
    }
  };

  // Determine color based on percentage
  function getColor(val) {
    if (val <= 5) return "#D92D20";
    if (val <= 10) return "#E23824";
    if (val <= 15) return "#E84328";
    if (val <= 20) return "#EE4E2D";
    if (val <= 25) return "#F45931";
    if (val <= 30) return "#F86436";
    if (val <= 35) return "#FD6F3B";
    if (val <= 40) return "#FF7A3F";
    if (val <= 45) return "#FACC15";
    if (val <= 50) return "#AACC2F";
    if (val <= 55) return "#7fff88ff";
    if (val <= 60) return "#66fff7ff";
    if (val <= 65) return "#008df1ff";
    if (val <= 70) return "#0080ffff";
    if (val <= 75) return "#3330f8ff";
    if (val <= 95) return "#0000FF";
    return "#465FFF";
  }

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

  const series = [metrics.percentage];

  const options = {
    colors: [getColor(metrics.percentage)],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: { size: "80%" },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: (val) => val.toFixed(1) + "%",
          },
        },
      },
    },
    fill: { type: "solid", colors: [getColor(metrics.percentage)] },
    stroke: { lineCap: "round" },
    labels: ["Progress"],
  };

  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                This Month Achievement
              </h3>
              <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                Target we've set for this month
              </p>
            </div>
            <div className="relative inline-block">
              <button className="dropdown-toggle" onClick={toggleDropdown}>
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </button>
              <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
                {canEditTargets && (
                  <DropdownItem onItemClick={() => { closeDropdown(); handleEditClick(); }}>
                    Set Targets
                  </DropdownItem>
                )}
                <DropdownItem onItemClick={closeDropdown}>
                  View More
                </DropdownItem>
              </Dropdown>
            </div>
          </div>

          <div className="relative">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-gray-500">Loading data...</p>
              </div>
            ) : (
              <>
                <div className="max-h-[330px]" id="chartDarkStyle">
                  <Chart options={options} series={series} type="radialBar" height={330} />
                </div>

                {metrics.revenueGrowth !== 0 && (
                  <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
                    {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                  </span>
                )}
              </>
            )}
          </div>

          {!loading && (
            <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
              {metrics.currentMonthRevenue >= metrics.targetRevenue
                ? `We earned ${formatCurrency(metrics.currentMonthRevenue)} this month, exceeding our target! Great work!`
                : `We earned ${formatCurrency(metrics.currentMonthRevenue)} this month, ${formatCurrency(metrics.targetRevenue - metrics.currentMonthRevenue)} away from target. Keep up the good work!`}
            </p>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
          {/* Target */}
          <div>
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Target</p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {loading ? "..." : formatCurrency(metrics.targetRevenue)}
            </p>
          </div>

          <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

          {/* Revenue */}
          <div>
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Achieved</p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {loading ? "..." : formatCurrency(metrics.currentMonthRevenue)}
            </p>
          </div>

          <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

          {/* Today */}
          <div>
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">Today</p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {loading ? "..." : formatCurrency(metrics.todayRevenue)}
            </p>
          </div>
        </div>

        {/* Upcoming Months Targets */}
        {targets.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Upcoming Months Targets</h4>
            <div className="grid grid-cols-2 gap-3">
              {targets.slice(1, 4).map((target, index) => (
                <div key={`${target.year}-${target.month}`} className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{monthNames[target.month]} {target.year}</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {target.targetRevenue ? formatCurrency(target.targetRevenue) : "Not set"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Targets Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        className="max-w-2xl p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Set Monthly Targets
        </h2>

        <div className="space-y-4">
          {editTargets.map((target, index) => (
            <div key={`${target.year}-${target.month}`} className="flex items-center gap-4">
              <div className="w-32">
                <Label>{target.monthName} {target.year}</Label>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  value={target.targetRevenue}
                  onChange={(e) => handleTargetChange(index, e.target.value)}
                  placeholder="Enter target amount"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveTargets} disabled={saving}>
              {saving ? "Saving..." : "Save Targets"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
