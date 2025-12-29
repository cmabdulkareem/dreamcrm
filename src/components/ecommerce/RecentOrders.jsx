import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import Button from "../../components/ui/button/Button";
import { DownloadIcon, PencilIcon, CloseIcon, BellIcon } from "../../icons";
import ComponentCard from "../common/ComponentCard.jsx";
import Input from "../form/input/InputField";
import PhoneInput from "../form/group-input/PhoneInput.jsx";
import DatePicker from "../form/date-picker.jsx";
import MultiSelect from "../form/MultiSelect.jsx";
import Label from "../form/Label";
import Select from "../form/Select";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import LeadCard from "../common/LeadCard";
import { AuthContext } from "../../context/AuthContext";
import { useCalendar } from "../../context/calendarContext";
import { useNotifications } from "../../context/NotificationContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  placeOptions,
  countries,
  enquirerGender,
  enquirerStatus,
  enquirerEducation,
  tableData,
  sortOrderList,
  statusOptions,
  courseOptions,
  contactPoints,
  campaigns,
  leadStatusOptions,
  leadPotentialOptions
} from "../../data/DataSets.jsx";

// Import our new modules
import { formatDate, getLeadStatusLabel, getLeadStatusColor, getLatestRemark, hasUnreadRemarks } from "../leadManagement/leadHelpers";
import { downloadLeadsAsPDF } from "../leadManagement/leadPdfExport";
import { fetchCustomers, fetchCampaigns, createNewCampaign, prepareLeadForEdit } from "../leadManagement/leadDataManagement";
import { saveLeadChanges, deleteLead, setLeadReminder, markRemarkAsRead } from "../leadManagement/leadUpdateService";

// Import role helper function
import { isAdmin, isOwner } from "../../utils/roleHelpers";

// Helper function to determine row background color based on due date
const getRowBackgroundColor = (followUpDate) => {
  if (!followUpDate) return "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const dueDate = new Date(followUpDate);
  dueDate.setHours(0, 0, 0, 0);

  // If due date is today or in the past - red background (matching error badge)
  if (dueDate <= today) {
    return "bg-red-50 dark:bg-red-900/30";
  }

  // If due date is tomorrow - orange background (matching warning badge)
  if (dueDate.getTime() === tomorrow.getTime()) {
    return "bg-orange-50 dark:bg-orange-900/30";
  }

  // If due date is day after tomorrow - green background (matching success badge)
  if (dueDate.getTime() === dayAfterTomorrow.getTime()) {
    return "bg-green-50 dark:bg-green-900/30";
  }

  return ""; // No background color for other cases
};

// Helper function to determine lead potential background color for the name cell
const getNameCellBackgroundColor = (leadPotential) => {
  return getLeadPotentialBackgroundColor(leadPotential);
};

// Helper function to determine lead potential background color
const getLeadPotentialBackgroundColor = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "bg-green-100 dark:bg-green-800";

    case "potentialProspect":
      return "bg-blue-100 dark:bg-blue-800";

    case "weakProspect":
      return "bg-yellow-200 dark:bg-yellow-800";

    case "notAProspect":
      return "bg-gray-300 dark:bg-gray-700"; // Neutral grey for NOT a prospect

    default:
      return "";
  }
};

// Helper function to determine due date badge color based on due date
const getDueDateBadgeColor = (followUpDate) => {
  if (!followUpDate) return "light";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const dueDate = new Date(followUpDate);
  dueDate.setHours(0, 0, 0, 0);

  // If due date is today or in the past - red background
  if (dueDate <= today) {
    return "error";
  }

  // If due date is tomorrow - orange background
  if (dueDate.getTime() === tomorrow.getTime()) {
    return "warning";
  }

  // If due date is day after tomorrow - green background
  if (dueDate.getTime() === dayAfterTomorrow.getTime()) {
    return "success";
  }

  return "light"; // Default light background for other dates
};

// Helper function to get due date badge text
const getDueDateBadgeText = (followUpDate) => {
  if (!followUpDate) return "No Date";

  // For all cases, show the actual formatted date
  return formatDate(followUpDate);
};

import API from "../../config/api";

export default function RecentOrders() {
  const { user } = useContext(AuthContext);
  const { addEvent, events, updateEvent } = useCalendar();
  const { addNotification, areToastsEnabled } = useNotifications();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState(""); // Added for status filter
  const [leadStatusFilter, setLeadStatusFilter] = useState(""); // Filter by lead status
  const [leadPotentialFilter, setLeadPotentialFilter] = useState(""); // Filter by lead potential
  const [assignedUserFilter, setAssignedUserFilter] = useState(""); // Filter by assigned user
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [hoveredRemarkRow, setHoveredRemarkRow] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  // Separate modal states
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isAlarmOpen, openModal: openAlarmModal, closeModal: closeAlarmModal } = useModal();
  const { isOpen: isCampaignModalOpen, openModal: openCampaignModal, closeModal: closeCampaignModal } = useModal();

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("");
  const [otherPlace, setOtherPlace] = useState("");
  const [status, setStatus] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState(false);
  const [education, setEducation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [contactPoint, setContactPoint] = useState("");
  const [otherContactPoint, setOtherContactPoint] = useState("");
  const [campaign, setCampaign] = useState("");
  const [handledByPerson, setHandledByPerson] = useState("");
  const [leadRemarks, setLeadRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);
  const [leadStatus, setLeadStatus] = useState("");
  const [leadPotential, setLeadPotential] = useState(""); // Added lead potential state

  // Campaign modal states
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  // Fetch customers from database
  useEffect(() => {
    fetchCustomers(setData, setLoading);
    fetchCampaigns(setCampaignOptions, campaigns);
  }, []);

  // Fetch available users for admins/managers
  useEffect(() => {
    const checkAndFetchUsers = () => {
      const isAdmin = user?.isAdmin;
      const isManager = user?.roles?.includes('Manager');
      if (isAdmin || isManager) {
        fetchAvailableUsers();
      }
    };

    if (user) {
      checkAndFetchUsers();
    }
  }, [user]);

  // Check if we need to open a specific lead from calendar
  useEffect(() => {
    const openLeadId = sessionStorage.getItem('openLeadId');
    if (openLeadId && data.length > 0) {
      const leadToOpen = data.find(lead => lead._id === openLeadId);
      if (leadToOpen) {
        handleEdit(leadToOpen);
        sessionStorage.removeItem('openLeadId'); // Clear after opening
      }
    }
  }, [data]);

  // Check if user has Manager role
  const isManager = user?.roles?.includes('Manager') || false;
  const isCounsellor = user?.roles?.includes('Counsellor') || false;
  const canDeleteLeads = user?.isAdmin || user?.roles?.includes('Manager');
  const isRegularUser = !user?.isAdmin && !isManager;
  const canAssignLeads = user?.isAdmin || user?.roles?.includes('Manager');

  // Calculate optimal tooltip position
  const calculateTooltipPosition = (rect) => {
    const tooltipWidth = 384; // w-96 = 384px
    const tooltipMaxHeight = window.innerHeight * 0.8; // 80vh
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate horizontal position
    let left = rect.left;
    let arrowLeft = rect.left + rect.width / 2 - left; // Arrow position relative to tooltip

    // Adjust if tooltip would go off right edge
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
      arrowLeft = rect.left + rect.width / 2 - left;
      // Clamp arrow to tooltip bounds
      arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, arrowLeft));
    }

    // Adjust if tooltip would go off left edge
    if (left < padding) {
      left = padding;
      arrowLeft = rect.left + rect.width / 2 - left;
      arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, arrowLeft));
    }

    // Calculate vertical position (above the cell)
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const estimatedTooltipHeight = Math.min(tooltipMaxHeight, 400); // Estimate height

    let top = rect.top;
    let transform = 'translateY(-100%)';

    // If not enough space above, show below
    if (spaceAbove < estimatedTooltipHeight + 50 && spaceBelow > spaceAbove) {
      top = rect.bottom;
      transform = 'translateY(10px)';
    } else {
      top = rect.top;
      transform = 'translateY(-100%)';
    }

    // Ensure tooltip doesn't go off top
    if (top < padding) {
      top = padding;
    }

    return { top, left, arrowLeft, transform };
  };

  // Handle tooltip hover with delay
  const handleTooltipEnter = (e, row) => {
    if (row.remarks && row.remarks.length > 0) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const position = calculateTooltipPosition(rect);

      setTooltipPosition(position);
      setHoveredRemarkRow(row._id);

      // Small delay before showing for better UX
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 150);
    }
  };

  const handleTooltipLeave = () => {
    // Clear timeout if user leaves before tooltip shows
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Delay hiding for smoother transition
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredRemarkRow(null);
      setShowTooltip(false);
    }, 100);
  };

  // Handle window resize to recalculate tooltip position
  useEffect(() => {
    if (!hoveredRemarkRow) return;

    const handleResize = () => {
      // Find the cell element and recalculate position
      const cellElement = document.querySelector(`[data-row-id="${hoveredRemarkRow}"]`);
      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        const position = calculateTooltipPosition(rect);
        setTooltipPosition(position);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [hoveredRemarkRow]);

  const validateEmail = (value) => {
    const isValidEmail =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  // Then your filteredData definition
  const filteredData = data
    .filter((item) => {
      // --- Search match ---
      const matchesSearch =
        item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        item.phone1?.includes(search);

      // --- Status filter (enquirer status) ---
      const matchesStatus = statusFilter ? item.status === statusFilter : true;

      // --- Lead Status filter ---
      const matchesLeadStatus = leadStatusFilter ? item.leadStatus === leadStatusFilter : true;

      // --- Lead Potential filter ---
      const matchesLeadPotential = leadPotentialFilter ? item.leadPotential === leadPotentialFilter : true;

      // --- Assigned User filter (only for admins/managers) ---
      let matchesAssignedUser = true;
      if (canAssignLeads && assignedUserFilter) {
        const assignedId = item.assignedTo?._id?.toString() || item.assignedTo?.toString();
        if (assignedUserFilter === "unassigned") {
          matchesAssignedUser = !assignedId;
        } else {
          matchesAssignedUser = assignedId === assignedUserFilter;
        }
      }

      // --- Role-based visibility ---
      let isUserLead = true;
      if (!canAssignLeads) {
        // Only show leads explicitly assigned to logged-in user
        // Handle both populated object (assignedTo._id) and string ObjectId
        const assignedId = item.assignedTo?._id?.toString() || item.assignedTo?.toString();
        const userId = user?.id?.toString() || user?._id?.toString();

        // if no assignment OR assigned to someone else → hide it
        if (!assignedId || assignedId !== userId) {
          isUserLead = false;
        }
      }

      return matchesSearch && matchesStatus && matchesLeadStatus && matchesLeadPotential && matchesAssignedUser && isUserLead;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });


  const handlePrint = () => {
    window.print();
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredData.map(lead => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  const downloadPDF = async () => {
    await downloadLeadsAsPDF(selectedLeads, data, toast);
  };

  // ====== Button Handlers ======
  const handleEdit = async (row) => {
    // Mark any unread remarks as read
    if (row.remarks && row.remarks.length > 0) {
      const unreadRemarks = row.remarks
        .map((remark, index) => ({ remark, index }))
        .filter(({ remark }) => remark.isUnread);

      // Mark all unread remarks as read
      for (const { index } of unreadRemarks) {
        try {
          await markRemarkAsRead(row._id, index);
        } catch (error) {
          console.error("Error marking remark as read:", error);
        }
      }

      // Update the data to reflect read status
      if (unreadRemarks.length > 0) {
        setData(prevData =>
          prevData.map(lead => {
            if (lead._id === row._id) {
              const updatedRemarks = [...lead.remarks];
              unreadRemarks.forEach(({ index }) => {
                updatedRemarks[index].isUnread = false;
              });
              return { ...lead, remarks: updatedRemarks };
            }
            return lead;
          })
        );
      }
    }

    const setters = {
      setSelectedRow,
      setEditName,
      setEditPhone,
      setEditEmail,
      setEditStatus,
      setEditFollowUp,
      setFullName,
      setEmail,
      setPhone1,
      setPhone2,
      setGender,
      setDob,
      setPlace,
      setOtherPlace,
      setStatus,
      setEducation,
      setContactPoint,
      setOtherContactPoint,
      setCampaign,
      setHandledByPerson,
      setFollowUpDate,
      setRemarks,
      setLeadStatus,
      setLeadPotential, // Add missing lead potential setter
      setSelectedValues
    };

    prepareLeadForEdit(row, setters);
    openEditModal();
  };

  const handleDelete = (row) => {
    // Check if user has Manager or Admin role before allowing delete
    if (!canDeleteLeads) {
      toast.error("Only managers and admins can delete leads.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    setSelectedRow(row);
    openDeleteModal();
  };

  const handleAlarm = (row) => {
    setSelectedRow(row);
    openAlarmModal();
  };

  const saveChanges = async () => {
    // Validate required fields
    if (!leadStatus) {
      toast.error("Lead Status is required");
      return;
    }

    if (!leadPotential) {
      toast.error("Lead Potential is required");
      return;
    }

    // Follow up date is not required when status is converted
    if (leadStatus !== "converted" && !followUpDate) {
      toast.error("Next Follow Up Date is required");
      return;
    }

    if (!remarks.trim()) {
      toast.error("Remarks are required");
      return;
    }

    await saveLeadChanges(
      selectedRow,
      remarks,
      leadStatus,
      leadPotential, // Added lead potential
      fullName,
      phone1,
      phone2,
      email,
      gender,
      dob,
      place,
      otherPlace,
      status,
      education,
      contactPoint,
      otherContactPoint,
      campaign,
      leadStatus === "converted" ? null : followUpDate, // Don't send followUpDate for converted leads
      selectedValues,
      user,
      handledByPerson,
      getLeadStatusLabel,
      addEvent,
      updateEvent,
      events,
      () => fetchCustomers(setData, setLoading), // Pass fetchCustomers with correct parameters
      setSelectedRow,
      setRemarks,
      addNotification,
      areToastsEnabled
    );
  };

  const confirmDelete = async () => {
    await deleteLead(
      selectedRow,
      canDeleteLeads,
      closeDeleteModal,
      resetModal,
      setData,
      addNotification,
      areToastsEnabled,
      toast
    );
  };

  const setReminder = async () => {
    await setLeadReminder(
      selectedRow,
      closeAlarmModal,
      resetModal,
      addEvent,
      toast
    );
  };

  const handleCampaignChange = (value) => {
    if (value === "__add_new__") {
      openCampaignModal();
    } else {
      setCampaign(value);
    }
  };

  const createNewCampaignHandler = async () => {
    await createNewCampaign(
      newCampaignName,
      newCampaignDesc,
      newCampaignDiscount,
      newCampaignCashback,
      newCampaignActive,
      setCampaign,
      () => fetchCampaigns(setCampaignOptions, campaigns), // Pass fetchCampaigns with correct parameters
      closeCampaignModal,
      setNewCampaignName,
      setNewCampaignDesc,
      setNewCampaignDiscount,
      setNewCampaignCashback,
      setNewCampaignActive,
      toast
    );
  };

  const resetModal = () => {
    setSelectedRow(null);
    setEditName("");
    setEditPhone("");
    setEditEmail("");
    setEditStatus("");
    setEditFollowUp("");
  };

  // New state for assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignToUser, setAssignToUser] = useState("");
  const [assignmentRemark, setAssignmentRemark] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);

  // Open assignment modal
  const openAssignModal = (row) => {
    setSelectedRow(row);
    setIsAssignModalOpen(true);
  };

  // Close assignment modal
  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignToUser("");
    setAssignmentRemark("");
  };

  // Fetch available users for assignment
  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get(`${API}/users/dropdown`, { withCredentials: true });
      setAvailableUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users for assignment");
    }
  };

  // Handle lead assignment
  const handleAssignLead = async () => {
    if (!assignToUser) {
      toast.error("Please select a user to assign the lead to");
      return;
    }

    try {
      const response = await axios.put(
        `${API}/customers/assign/${selectedRow._id}`,
        { assignedTo: assignToUser, assignmentRemark },
        { withCredentials: true }
      );

      if (response.data.customer) {
        // Update the data in the table
        setData(prevData =>
          prevData.map(lead =>
            lead._id === selectedRow._id ? response.data.customer : lead
          )
        );

        toast.success("Lead assigned successfully!");
        closeAssignModal();

        // Add notification
        if (typeof addNotification === 'function') {
          addNotification({
            type: 'lead_assigned',
            userName: user?.fullName || 'Someone',
            avatar: user?.avatar || null,
            action: 'assigned lead',
            entityName: selectedRow.fullName,
            module: 'Lead Management',
          });
        }
      }
    } catch (error) {
      console.error("Error assigning lead:", error);
      toast.error(error.response?.data?.message || "Failed to assign lead");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading leads...</p>
        </div>
      ) : (
        <>
          {/* Header with Search / Sort / Status / Print */}
          <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Enquiries</h3>
              {isRegularUser && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Showing only leads assigned to you
                </p>
              )}
              {selectedLeads.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedLeads.length} lead(s) selected
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />

              <Select
                className="w-full md:w-1/4"
                options={sortOrderList}
                value={sortOrder}
                placeholder="Sort by date"
                onChange={(value) => setSortOrder(value)}
              />

              {/* Filter by Lead Status */}
              <Select
                className="w-full md:w-1/4"
                options={[
                  { value: "", label: "All Lead Statuses" },
                  ...leadStatusOptions
                ]}
                value={leadStatusFilter}
                placeholder="Filter by lead status"
                onChange={(value) => setLeadStatusFilter(value)}
              />

              {/* Filter by Lead Potential */}
              <Select
                className="w-full md:w-1/4"
                options={[
                  { value: "", label: "All Lead Potentials" },
                  ...leadPotentialOptions
                ]}
                value={leadPotentialFilter}
                placeholder="Filter by lead potential"
                onChange={(value) => setLeadPotentialFilter(value)}
              />

              {/* Filter by Assigned User (only for admins/managers) */}
              {canAssignLeads && (
                <Select
                  className="w-full md:w-1/4"
                  options={[
                    { value: "", label: "All Users" },
                    { value: "unassigned", label: "Unassigned" },
                    ...availableUsers.map(user => ({
                      value: user._id,
                      label: user.fullName
                    }))
                  ]}
                  value={assignedUserFilter}
                  placeholder="Filter by assigned user"
                  onChange={(value) => setAssignedUserFilter(value)}
                />
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={downloadPDF}
                endIcon={<DownloadIcon className="size-5" />}
                disabled={selectedLeads.length === 0}
              >
                PDF
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="max-w-full overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={filteredData.length > 0 && selectedLeads.length === filteredData.length}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">&nbsp;&nbsp;&nbsp;Alert</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date Added</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Mobile</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Contact Point</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campaign</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Lead Status</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Latest Remark</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Next Follow-up</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-gray-500">
                      {isRegularUser ? "No leads assigned to you." : "No leads found. Create your first lead!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => {
                    const latestRemark = getLatestRemark(row.remarks);
                    const hasUnread = hasUnreadRemarks(row.remarks);

                    return (
                      <TableRow key={row._id}>
                        <TableCell className="py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(row._id)}
                            onChange={() => handleSelectLead(row._id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                        </TableCell>
                        <TableCell className={`py-3 ${getNameCellBackgroundColor(row.leadPotential)}`}>
                          {hasUnread && (
                            <div className="flex justify-center">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`py-3`}>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">&nbsp;{row.fullName}</p>
                              <p className="text-gray-400 text-xs whitespace-pre-wrap break-words">
                                &nbsp;{row.coursePreference?.join(", ") || "N/A"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.createdAt)}</TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.phone1}</TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.contactPoint || "N/A"}</TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.campaign || "N/A"}</TableCell>
                        <TableCell className="py-3">
                          <Badge
                            size="sm"
                            color={getLeadStatusColor(row.leadStatus)}
                          >
                            {getLeadStatusLabel(row.leadStatus)}
                          </Badge>
                          <p className="text-gray-400 text-xs mt-1">Agent: {row.handledBy || "N/A"}</p>
                          {row.assignedTo && (
                            <p className="text-gray-400 text-xs mt-1">Assigned to: {row.assignedTo.fullName}</p>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div
                            className="relative"
                            data-row-id={row._id}
                            onMouseEnter={(e) => handleTooltipEnter(e, row)}
                            onMouseLeave={handleTooltipLeave}
                          >
                            <p className="text-xs max-w-[200px] truncate cursor-help">{latestRemark}</p>
                            {row.assignmentRemark && (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-1 truncate animate-pulse duration-100">
                                Suggestion: {row.assignmentRemark}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={getDueDateBadgeColor(row.followUpDate)}
                          >
                            {getDueDateBadgeText(row.followUpDate)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex items-center">
                            <Button size="sm" variant="outline" className="mr-2" endIcon={<PencilIcon className="size-5" />} onClick={() => handleEdit(row)} />
                            {isOwner(user) && (
                              <Button size="sm" variant="outline" className="text-red-500 mr-2" endIcon={<CloseIcon className="size-5" />} onClick={() => handleDelete(row)} />
                            )}
                            {canAssignLeads && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-500 mr-2"
                                onClick={() => openAssignModal(row)}
                              >
                                Assign
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="text-yellow-500" endIcon={<BellIcon className="size-5" />} onClick={() => handleAlarm(row)} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* History Tooltip - Fixed Position Above Table */}
          {hoveredRemarkRow && showTooltip && (() => {
            const hoveredRow = filteredData.find(row => row._id === hoveredRemarkRow);
            if (!hoveredRow || !hoveredRow.remarks || hoveredRow.remarks.length === 0) return null;

            const isAbove = tooltipPosition.transform.includes('-100%');

            return (
              <div
                ref={tooltipRef}
                className={`fixed w-96 max-w-[90vw] max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] transition-all duration-200 ${showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: tooltipPosition.transform
                }}
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                  }
                }}
                onMouseLeave={handleTooltipLeave}
              >
                {/* Arrow pointing to cell */}
                {tooltipPosition.arrowLeft > 0 && (
                  <div
                    className={`absolute ${isAbove ? 'bottom-0' : 'top-0'} left-0 w-0 h-0`}
                    style={{
                      left: `${tooltipPosition.arrowLeft}px`,
                      transform: isAbove
                        ? `translateY(100%) translateX(-50%)`
                        : `translateY(-100%) translateX(-50%)`
                    }}
                  >
                    <div
                      className={`w-0 h-0 border-l-[8px] border-r-[8px] ${isAbove
                        ? 'border-t-[8px] border-t-white dark:border-t-gray-800 border-l-transparent border-r-transparent'
                        : 'border-b-[8px] border-b-white dark:border-b-gray-800 border-l-transparent border-r-transparent'
                        }`}
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                    />
                  </div>
                )}

                <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-lg">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Remark History</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hoveredRow.remarks.length} remark{hoveredRow.remarks.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
                  {[...hoveredRow.remarks].reverse().map((remark, index) => (
                    <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-800 dark:text-white">
                          {remark.handledBy || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {remark.updatedOn ? new Date(remark.updatedOn).toLocaleString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          size="sm"
                          color={getLeadStatusColor(remark.leadStatus || "new")}
                        >
                          {getLeadStatusLabel(remark.leadStatus || "new")}
                        </Badge>
                        {remark.isUnread && (
                          <span className="text-xs text-red-500 dark:text-red-400">Unread</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {remark.remark || "No remarks"}
                      </p>
                      {remark.nextFollowUpDate && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Next Follow-up: {new Date(remark.nextFollowUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Edit Modal */}
          <Modal
            isOpen={isEditOpen}
            onClose={closeEditModal}
            overlayClassName="bg-black/5 backdrop-blur-none"
            className="max-w-[1480px] p-6 lg:p-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="mb-2 font-semibold text-gray-800 dark:text-white/90 modal-title text-theme-xl lg:text-2xl">Edit Lead</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Left column - Edit Form */}
              <div className="space-y-6">
                {/* Name + Email */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label htmlFor="firstName">Full Name</Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isAdmin(user)}
                    />
                    {!isAdmin(user) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only owners can edit this field
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      error={error}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      hint={error ? "This is an invalid email address." : ""}
                      disabled={!isAdmin(user)}
                    />
                    {!isAdmin(user) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only owners can edit this field
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/2">
                    <Label>Phone</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={setPhone1}
                      disabled={!isAdmin(user)}
                    />
                    {!isAdmin(user) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only owners can edit this field
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-1/2">
                    <Label>Phone (optional)</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone2}
                      onChange={setPhone2}
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/4">
                    <Label>Gender</Label>
                    <Select
                      options={enquirerGender}
                      value={gender}
                      placeholder="Select Gender"
                      onChange={setGender}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <DatePicker
                      id="dob"
                      label="DoB"
                      placeholder="Select a date"
                      value={dob}
                      onChange={(date, str) => setDob(str)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Place</Label>
                    <Select
                      options={placeOptions}
                      value={place}
                      placeholder="Select Place"
                      onChange={setPlace}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="otherPlace">Specify other</Label>
                    <Input
                      type="text"
                      id="otherPlace"
                      value={otherPlace}
                      onChange={(e) => setOtherPlace(e.target.value)}
                      disabled={place !== "Other"}
                    />
                  </div>
                </div>

                {/* Status, Education, Remarks */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full md:w-1/4">
                    <Label>Current Status</Label>
                    <Select
                      options={enquirerStatus}
                      value={status}
                      placeholder="Select Status"
                      onChange={setStatus}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Education</Label>
                    <Select
                      options={enquirerEducation}
                      value={education}
                      placeholder="Select Education"
                      onChange={setEducation}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Contact Point</Label>
                    <Select
                      options={contactPoints}
                      value={contactPoint}
                      placeholder="Contacted Through"
                      onChange={setContactPoint}
                      disabled={!isAdmin(user)}
                    />
                    {!isAdmin(user) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only owners can edit this field
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="otherContactPoint">Specify other</Label>
                    <Input
                      type="text"
                      id="otherContactPoint"
                      value={otherContactPoint}
                      onChange={(e) => setOtherContactPoint(e.target.value)}
                      disabled={contactPoint !== "other"}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full">
                    <MultiSelect
                      label="Course Preference"
                      options={courseOptions}
                      selectedValues={selectedValues}
                      onChange={setSelectedValues}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full md:w-1/4">
                    <Label>Campaign</Label>
                    <Select
                      options={campaignOptions}
                      value={campaign}
                      placeholder="Campaigns"
                      onChange={handleCampaignChange}
                      disabled={!isAdmin(user)}
                    />
                    {!isAdmin(user) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only owners can edit this field
                      </p>
                    )}
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Lead Status *</Label>
                    <Select
                      id="leadStatus"
                      label="Lead Status"
                      options={leadStatusOptions}
                      value={leadStatus}
                      onChange={(value) => {
                        setLeadStatus(value);
                        // Clear followUpDate when status changes to converted
                        if (value === "converted") {
                          setFollowUpDate("");
                        }
                      }}
                      required
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Lead Potential *</Label>
                    <Select
                      options={leadPotentialOptions}
                      value={leadPotential}
                      placeholder="Select Lead Potential"
                      onChange={setLeadPotential}
                    />
                  </div>
                  {leadStatus !== "converted" && (
                    <div className="w-full md:w-1/4">
                      <DatePicker
                        id="followupDate"
                        label="Next Follow Up Date *"
                        value={followUpDate}
                        disablePastDates={true} // Hide past dates completely
                        onChange={(date, str) => setFollowUpDate(str)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full">
                    <Label htmlFor="remarks">Remarks *</Label>
                    <Input
                      type="text"
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveChanges}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Right column - History */}
              <div className="space-y-6">
                <ComponentCard title="History & Remarks">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600">
                    {selectedRow?.remarks && selectedRow.remarks.length > 0 ? (
                      // Sort remarks from latest to oldest (reverse order)
                      [...selectedRow.remarks].reverse().map((remark, index) => (
                        <LeadCard
                          key={index}
                          name={remark.handledBy || user?.fullName || "Unknown"}
                          datetime={remark.updatedOn ? new Date(remark.updatedOn).toLocaleString() : "N/A"}
                          callback={remark.nextFollowUpDate ? new Date(remark.nextFollowUpDate).toLocaleDateString() : ""}
                          note={remark.remark || "No remarks"}
                          status={getLeadStatusLabel(remark.leadStatus || "new")}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No history available yet.</p>
                        <p className="text-sm mt-2">Remarks and updates will appear here.</p>
                      </div>
                    )}
                  </div>
                </ComponentCard>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={isDeleteOpen}
            onClose={closeDeleteModal}
            overlayClassName="bg-black/5 backdrop-blur-none"
            className="max-w-[700px] p-6 lg:p-10" >
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirm Delete</h4>
            <p>Are you sure you want to delete enquiry <strong>{selectedRow?.name}</strong>?</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => { closeDeleteModal(); resetModal(); }}
              > Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isAlarmOpen}
            onClose={closeAlarmModal}
            overlayClassName="bg-black/5 backdrop-blur-none"
            className="max-w-[700px] p-6 lg:p-10"
          >
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Set Follow-up Reminder</h4>
            <p>Set a reminder for <strong>{selectedRow?.fullName}</strong> on {selectedRow ? formatDate(selectedRow.followUpDate) : ""}.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => { closeAlarmModal(); resetModal(); }}
              >
                Close
              </Button>
              <Button
                variant="warning"
                onClick={setReminder}
              >Set Reminder
              </Button>
            </div>
          </Modal>

          {/* Add Campaign Modal */}
          <Modal
            isOpen={isCampaignModalOpen}
            onClose={closeCampaignModal}
            className="max-w-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Add New Campaign
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="newCampaignName">Campaign Name *</Label>
                <Input
                  id="newCampaignName"
                  type="text"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="e.g., Summer Promotion 2024"
                />
              </div>

              <div>
                <Label htmlFor="newCampaignDesc">Description</Label>
                <textarea
                  id="newCampaignDesc"
                  value={newCampaignDesc}
                  onChange={(e) => setNewCampaignDesc(e.target.value)}
                  placeholder="Campaign description (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="newCampaignDiscount">Discount %</Label>
                  <Input
                    id="newCampaignDiscount"
                    type="number"
                    min="0"
                    max="100"
                    value={newCampaignDiscount}
                    onChange={(e) => setNewCampaignDiscount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="newCampaignCashback">Cashback (₹)</Label>
                  <Input
                    id="newCampaignCashback"
                    type="number"
                    min="0"
                    value={newCampaignCashback}
                    onChange={(e) => setNewCampaignCashback(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newCampaignActive"
                  checked={newCampaignActive}
                  onChange={(e) => setNewCampaignActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="newCampaignActive" className="mb-0">Mark as Active</Label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Only active campaigns will appear in dropdowns</p>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={closeCampaignModal}>
                  Cancel
                </Button>
                <Button onClick={createNewCampaignHandler}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </Modal>

          {/* Assignment Modal */}
          <Modal
            isOpen={isAssignModalOpen}
            onClose={closeAssignModal}
            className="max-w-md p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
              Assign Lead
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="assignToUser">Assign To</Label>
                <Select
                  options={availableUsers.map(user => ({ value: user._id, label: user.fullName }))}
                  value={assignToUser}
                  placeholder="Select User"
                  onChange={setAssignToUser}
                />
              </div>

              <div>
                <Label htmlFor="assignmentRemark">Assignment Remark (Optional)</Label>
                <textarea
                  id="assignmentRemark"
                  value={assignmentRemark}
                  onChange={(e) => setAssignmentRemark(e.target.value)}
                  placeholder="Add a remark for the assignment..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={closeAssignModal}>
                  Cancel
                </Button>
                <Button onClick={handleAssignLead}>
                  Assign Lead
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}

// Helper function to get lead potential label
const getLeadPotentialLabel = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "Strong Prospect";
    case "potentialProspect":
      return "Potential Prospect";
    case "weakProspect":
      return "Weak Prospect";
    case "notAProspect":
      return "Not a Prospect";
    default:
      return "N/A";
  }
};

// Helper function to get lead potential class
const getLeadPotentialClass = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "text-green-800 bg-green-200 dark:text-green-200 dark:bg-green-800";
    case "potentialProspect":
      return "text-blue-800 bg-blue-200 dark:text-blue-200 dark:bg-blue-800";
    case "weakProspect":
      return "text-yellow-800 bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-800";
    case "notAProspect":
      return "text-red-800 bg-red-200 dark:text-red-200 dark:bg-red-800";
    default:
      return "text-gray-600 bg-gray-100";
  }
};
