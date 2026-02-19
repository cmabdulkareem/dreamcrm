import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useState, useEffect, useCallback, useRef, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Papa from "papaparse";
import Button from "../../components/ui/button/Button";
import { DownloadIcon, PencilIcon, CloseIcon, BoltIcon, ChevronDownIcon, ChevronUpIcon, FileIcon } from "../../icons";
import ComponentCard from "../common/ComponentCard.jsx";
import Input from "../form/input/InputField";
import PhoneInput from "../form/group-input/PhoneInput.jsx";
import DatePicker from "../form/date-picker.jsx";
import MultiSelect from "../form/MultiSelect.jsx";
import RangeDatePicker from "../form/RangeDatePicker.jsx";
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
import { formatDate, getLeadStatusLabel, getLeadStatusColor, getLatestRemark, hasUnreadRemarks, getContactPointIcon } from "../leadManagement/leadHelpers";

import { downloadLeadsAsPDF } from "../leadManagement/leadPdfExport";
import { fetchCustomers, fetchCampaigns, createNewCampaign, prepareLeadForEdit } from "../leadManagement/leadDataManagement";
import { saveLeadChanges, deleteLead, setLeadReminder, markRemarkAsRead } from "../leadManagement/leadUpdateService";


// Import role helper function
import { isAdmin, isOwner, isManager, isCounsellor as isCounsellorHelper } from "../../utils/roleHelpers";
import LoadingSpinner from "../common/LoadingSpinner";

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

// Helper function to determine lead potential colors and styles
const getLeadPotentialStyles = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return {
        bar: "bg-green-500"
      };
    case "potentialProspect":
      return {
        bar: "bg-blue-500"
      };
    case "weakProspect":
      return {
        bar: "bg-orange-500"
      };
    case "notAProspect":
      return {
        bar: "bg-gray-400"
      };
    default:
      return {
        bar: "bg-transparent"
      };
  }
};

// Helper function to determine lead potential background color (kept for backward compatibility if needed, but not used in v3.0)
const getLeadPotentialBackgroundColor = (leadPotential) => {
  switch (leadPotential) {
    case "strongProspect":
      return "bg-green-50/30 dark:bg-green-500/5";
    case "potentialProspect":
      return "bg-blue-50/30 dark:bg-blue-500/5";
    case "weakProspect":
      return "bg-yellow-50/30 dark:bg-yellow-500/5";
    case "notAProspect":
      return "bg-gray-50/30 dark:bg-gray-500/5";
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
  const { user, selectedBrand } = useContext(AuthContext);
  const { addEvent, events, updateEvent } = useCalendar();
  const { addNotification, areToastsEnabled } = useNotifications();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("followup_latest");
  const [statusFilter, setStatusFilter] = useState(""); // Added for status filter
  const [leadStatusFilter, setLeadStatusFilter] = useState(""); // Filter by lead status
  const [leadPotentialFilter, setLeadPotentialFilter] = useState(""); // Filter by lead potential
  const [assignedUserFilter, setAssignedUserFilter] = useState(""); // Filter by assigned user
  const [campaignFilter, setCampaignFilter] = useState(""); // Filter by campaign
  const [showFilters, setShowFilters] = useState(false); // Toggle for filter panel

  // Get initial date range (current month)
  const getInitialMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [firstDay, lastDay];
  };

  const [dateRange, setDateRange] = useState(getInitialMonthRange());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [dynamicCourseOptions, setDynamicCourseOptions] = useState([]);
  const [contactPointOptions, setContactPointOptions] = useState([]); // Dynamic contact points
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [hoveredRemarkRow, setHoveredRemarkRow] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, arrowLeft: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAnalysisTooltip, setShowAnalysisTooltip] = useState(false);
  const [hoveredAnalysisLeadId, setHoveredAnalysisLeadId] = useState(null);
  const [analysisCache, setAnalysisCache] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const analysisTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  // Separate modal states
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isAlarmOpen, openModal: openAlarmModal, closeModal: closeAlarmModal } = useModal();
  const { isOpen: isCampaignModalOpen, openModal: openCampaignModal, closeModal: closeCampaignModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();

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
  const [otherEducation, setOtherEducation] = useState("");
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
  const [phoneExists, setPhoneExists] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Campaign modal states
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission flags
  const hasManagerRole = isManager(user);
  const isCounsellor = user?.roles?.includes('Counsellor') || false;
  const canDeleteLeads = isAdmin(user) || isManager(user);
  const isRegularUser = !isAdmin(user) && !hasManagerRole;
  const canAssignLeads = isAdmin(user) || isManager(user);

  // Fetch customers from database
  useEffect(() => {
    fetchCustomers(setData, setLoading);
    fetchCampaigns(setCampaignOptions, campaigns, user);
    fetchCourseCategories();
    fetchContactPoints(); // Fetch dynamic contact points
  }, [user]);

  // Fetch available users for admins/managers
  useEffect(() => {
    const checkAndFetchUsers = () => {
      const currentUserIsAdmin = user?.isAdmin;
      const hasManagerRole = isManager(user);
      if (currentUserIsAdmin || hasManagerRole) {
        fetchAvailableUsers(selectedBrand?._id || selectedBrand?.id);
      }
    };

    if (user) {
      checkAndFetchUsers();
    }
  }, [user, selectedBrand]);

  // Fetch available users for assignment
  const fetchAvailableUsers = async (brandId = null) => {
    try {
      const url = brandId
        ? `${API}/users/dropdown?brandId=${brandId}`
        : `${API}/users/dropdown`;
      const response = await axios.get(url, { withCredentials: true });
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users for assignment");
    }
  };

  // Fetch contact points from API
  const fetchContactPoints = async () => {
    try {
      const response = await axios.get(
        `${API}/contact-points/active`,
        { withCredentials: true }
      );
      const formattedContactPoints = response.data.contactPoints.map(c => ({
        value: c.value,
        label: c.name
      }));

      // Add "Other" option
      formattedContactPoints.push({
        value: "other",
        label: "Other"
      });

      // Add "Add New Contact Point" option at the end if user is manager
      if (isManager(user)) {
        formattedContactPoints.push({
          value: "__add_new__",
          label: "+ Add New Contact Point"
        });
      }

      setContactPointOptions(formattedContactPoints);
    } catch (error) {
      console.error("Error fetching contact points:", error);
      // Fallback to hardcoded contact points if API fails
      const fallbackOptions = [...contactPoints];
      if (isManager(user)) {
        fallbackOptions.push({ value: "__add_new__", label: "+ Add New Contact Point" });
      }
      setContactPointOptions(fallbackOptions);
    }
  };

  // Fetch users when component mounts or brand changes
  useEffect(() => {
    if (canAssignLeads && selectedBrand) {
      fetchAvailableUsers(selectedBrand?._id || selectedBrand?.id);
    }
  }, [selectedBrand, canAssignLeads]);

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



  // Calculate optimal tooltip position
  const calculateTooltipPosition = (rect) => {
    const tooltipWidth = 384; // w-96 = 384px
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const headerHeight = 85;

    // Calculate horizontal position
    let left = rect.left;
    let arrowLeft = rect.width / 2; // Arrow position relative to cell center

    // Adjust if tooltip would go off right edge
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Adjust if tooltip would go off left edge
    if (left < padding) {
      left = padding;
    }

    // Now recalculate arrowLeft relative to the tooltip's left
    arrowLeft = (rect.left + rect.width / 2) - left;
    // Clamp arrow to tooltip bounds
    arrowLeft = Math.max(20, Math.min(tooltipWidth - 20, arrowLeft));

    // Calculate vertical position
    const spaceAbove = rect.top - headerHeight - padding;
    const spaceBelow = viewportHeight - rect.bottom - padding;

    // Default estimated height
    const estimatedTooltipHeight = 350;

    let top = 0;
    let transform = "";
    let maxHeight = 0;

    if (spaceAbove > estimatedTooltipHeight || spaceAbove > spaceBelow) {
      // Show ABOVE
      top = rect.top;
      transform = "translateY(-100%) translateY(-10px)";
      maxHeight = spaceAbove;
    } else {
      // Show BELOW
      top = rect.bottom;
      transform = "translateY(10px)";
      maxHeight = spaceBelow;
    }

    return { top, left, arrowLeft, transform, maxHeight };
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

  const handleAnalysisEnter = (e, row) => {
    // Clear any existing timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const position = calculateTooltipPosition(rect);

    setTooltipPosition(position);
    setHoveredAnalysisLeadId(row._id);

    // Initial timeout to show the "Analyzing..." state
    analysisTimeoutRef.current = setTimeout(async () => {
      setShowAnalysisTooltip(true);

      if (!analysisCache[row._id]) {
        setIsAnalyzing(true);
        try {
          const response = await axios.get(`${API}/ai/analyze-lead/${row._id}`, { withCredentials: true });
          setAnalysisCache(prev => ({ ...prev, [row._id]: response.data.analysis }));
        } catch (error) {
          console.error("AI Analysis Error:", error);
          setAnalysisCache(prev => ({ ...prev, [row._id]: "Could not load AI suggestions." }));
        } finally {
          setIsAnalyzing(false);
        }
      }
    }, 400); // 400ms delay to avoid calling on accidental hover
  };

  const handleAnalysisLeave = () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }

    // Delay hiding
    analysisTimeoutRef.current = setTimeout(() => {
      setHoveredAnalysisLeadId(null);
      setShowAnalysisTooltip(false);
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

  const checkPhoneExistence = async (phone) => {
    if (!phone || phone.length < 10) {
      setPhoneExists(false);
      return;
    }

    setCheckingPhone(true);
    try {
      const excludeId = selectedRow?._id;
      const url = `${API}/customers/check-phone?phone=${phone}${excludeId ? `&excludeId=${excludeId}` : ''}`;

      const response = await axios.get(url, { withCredentials: true });

      if (response.data.exists) {
        setPhoneExists(true);
        setValidationErrors(prev => ({
          ...prev,
          phone1: `Lead exists with this number (${response.data.leadName})`
        }));
      } else {
        setPhoneExists(false);
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone1;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error checking phone existence:", error);
    } finally {
      setCheckingPhone(false);
    }
  };

  // Debounced phone check
  useEffect(() => {
    if (!isEditOpen) {
      setPhoneExists(false);
      setValidationErrors({});
      return;
    }

    const timer = setTimeout(() => {
      if (phone1) {
        checkPhoneExistence(phone1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phone1, isEditOpen]);

  const handlePhone1Change = (value) => {
    setPhone1(value);
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

      // --- Campaign filter ---
      const matchesCampaign = campaignFilter ? item.campaign === campaignFilter : true;

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

      // --- Date range filter ---
      let matchesDateRange = true;
      if (dateRange && dateRange.length > 0) {
        const createdAtDate = new Date(item.createdAt);
        createdAtDate.setHours(0, 0, 0, 0);

        const followUpDateVal = item.followUpDate ? new Date(item.followUpDate) : null;
        if (followUpDateVal) followUpDateVal.setHours(0, 0, 0, 0);

        // Determine relevant conversion date for converted leads
        let convertedAtDate = item.convertedAt ? new Date(item.convertedAt) : null;
        if (!convertedAtDate && item.leadStatus === 'converted' && item.remarks) {
          // Fallback to remarks search for legacy data
          const conversionRemark = item.remarks.find(r =>
            r.leadStatus === 'converted' || r.remark?.includes("Admission taken")
          );
          if (conversionRemark && conversionRemark.updatedOn) {
            convertedAtDate = new Date(conversionRemark.updatedOn);
          }
        }
        if (convertedAtDate) convertedAtDate.setHours(0, 0, 0, 0);

        if (dateRange.length === 2) {
          const startDate = new Date(dateRange[0]);
          const endDate = new Date(dateRange[1]);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(0, 0, 0, 0);

          if (item.leadStatus === 'converted') {
            // STRICT RULE: Converted leads ONLY show in their conversion month
            matchesDateRange = convertedAtDate && convertedAtDate >= startDate && convertedAtDate <= endDate;
          } else {
            // Active leads show in creation OR follow-up month
            const createdInRange = createdAtDate >= startDate && createdAtDate <= endDate;
            const followUpInRange = followUpDateVal && followUpDateVal >= startDate && followUpDateVal <= endDate;
            matchesDateRange = createdInRange || followUpInRange;
          }
        } else if (dateRange.length === 1) {
          const filterDate = new Date(dateRange[0]);
          filterDate.setHours(0, 0, 0, 0);

          if (item.leadStatus === 'converted') {
            matchesDateRange = convertedAtDate && convertedAtDate.getTime() === filterDate.getTime();
          } else {
            const createdMatches = createdAtDate.getTime() === filterDate.getTime();
            const followUpMatches = followUpDateVal && followUpDateVal.getTime() === filterDate.getTime();
            matchesDateRange = createdMatches || followUpMatches;
          }
        }
      }

      return matchesSearch && matchesStatus && matchesLeadStatus && matchesLeadPotential && matchesCampaign && matchesAssignedUser && isUserLead && matchesDateRange;
    })
    .sort((a, b) => {
      // Helper to get potential weight (higher = more urgent)
      const getPotentialWeight = (pot) => {
        const weights = {
          'strongProspect': 4,
          'potentialProspect': 3,
          'weakProspect': 2,
          'notAProspect': 1
        };
        return weights[pot] || 0;
      };

      // Helper to get status priority (lower = more urgent)
      const getStatusPriority = (status) => {
        // These statuses are considered "done" or "inactive" for follow-up purposes
        // Note: 'callBackLater' is intentionally NOT here as it implies a specific follow-up date urgency
        const inactiveStatuses = ['converted', 'lost', 'notInterested'];
        if (inactiveStatuses.includes(status)) return 2;
        return 1;
      };

      if (sortOrder === "followup_latest" || sortOrder === "followup_oldest") {
        const dateA = a.followUpDate ? new Date(a.followUpDate) : null;
        const dateB = b.followUpDate ? new Date(b.followUpDate) : null;

        if (dateA) dateA.setHours(0, 0, 0, 0);
        if (dateB) dateB.setHours(0, 0, 0, 0);

        // 1. Primary Sort: Follow-up Date
        if (dateA?.getTime() !== dateB?.getTime()) {
          if (!dateA && !dateB) return 0;

          // For "Oldest First" (Priority): Dates come before No Dates
          // For "Latest First": Dates come before No Dates (or logic depends on pref, assuming Dates first)
          if (!dateA) return 1; // Put leads without follow-up date last
          if (!dateB) return -1;

          return sortOrder === "followup_latest" ? dateA - dateB : dateB - dateA;
        }

        // 2. Tie-breaker 1: Status Priority (Active leads first)
        const priorityA = getStatusPriority(a.leadStatus);
        const priorityB = getStatusPriority(b.leadStatus);
        if (priorityA !== priorityB) return priorityA - priorityB;

        // 3. Tie-breaker 2: Lead Potential (Higher potential first)
        const weightA = getPotentialWeight(a.leadPotential);
        const weightB = getPotentialWeight(b.leadPotential);
        if (weightA !== weightB) return weightB - weightA;

        // 4. Tie-breaker 3: Creation Date (Newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      // Default sorts (asc/desc by createdAt)
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  // Calculate contact point statistics from filtered data (based on createdAt only)
  const contactPointStats = useMemo(() => {
    const stats = {};

    // Filter leads to only include those added within the date range
    const leadsInDateRange = filteredData.filter(lead => {
      if (!dateRange || dateRange.length === 0) return true;

      const createdAtDate = new Date(lead.createdAt);
      createdAtDate.setHours(0, 0, 0, 0);

      if (dateRange.length === 2) {
        const startDate = new Date(dateRange[0]);
        const endDate = new Date(dateRange[1]);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return createdAtDate >= startDate && createdAtDate <= endDate;
      } else if (dateRange.length === 1) {
        const filterDate = new Date(dateRange[0]);
        filterDate.setHours(0, 0, 0, 0);
        return createdAtDate.getTime() === filterDate.getTime();
      }
      return true;
    });

    // Count contact points from date-filtered leads
    leadsInDateRange.forEach(lead => {
      // Normalize contact point to proper case (first letter capitalized)
      let cp = lead.contactPoint || 'Not Specified';
      if (cp && cp !== 'Not Specified') {
        cp = cp.charAt(0).toUpperCase() + cp.slice(1).toLowerCase();
      }
      stats[cp] = (stats[cp] || 0) + 1;
    });

    // Sort by count (descending)
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }, [filteredData, dateRange]);

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
      setOtherEducation,
      setContactPoint,
      setOtherContactPoint,
      setCampaign,
      setHandledByPerson,
      setFollowUpDate,
      setRemarks,
      setLeadStatus,
      setLeadPotential, // Add missing lead potential setter
      setSelectedValues,
      courseOptions: dynamicCourseOptions,
      contactPointOptions: contactPointOptions // Pass dynamic contact points
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

    // Follow up date is not required when status is converted or lost
    if (leadStatus !== "converted" && leadStatus !== "lost" && !followUpDate) {
      toast.error("Next Follow Up Date is required");
      return;
    }

    if (!remarks.trim()) {
      toast.error("Remarks are required");
      return;
    }

    setIsSubmitting(true);
    try {
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
        otherEducation,
        contactPoint,
        otherContactPoint,
        campaign,
        (leadStatus === "converted" || leadStatus === "lost") ? null : followUpDate, // Don't send followUpDate for converted/lost leads
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
    } finally {
      setIsSubmitting(false);
    }
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
      () => fetchCampaigns(setCampaignOptions, campaigns, user), // Pass fetchCampaigns with correct parameters
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
  // const [availableUsers, setAvailableUsers] = useState([]); // Removed duplicate state

  // Open assignment modal
  const openAssignModal = (row) => {
    setSelectedRow(row);
    setIsAssignModalOpen(true);
    // Fetch users filtered by the lead's brand
    if (row.brand) {
      fetchAvailableUsers(row.brand._id || row.brand);
    } else {
      fetchAvailableUsers();
    }
  };

  // Close assignment modal
  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignToUser("");
    setAssignmentRemark("");
  };

  // fetchAvailableUsers moved up to avoid duplicate and for better accessibility

  const fetchCourseCategories = async () => {
    try {
      const response = await axios.get(
        `${API}/course-categories/all`,
        { withCredentials: true }
      );
      const categories = response.data.categories.filter(c => c.isActive).map(c => ({
        value: c.name,
        label: c.name
      }));
      setDynamicCourseOptions(categories);
    } catch (error) {
      console.error("Error fetching course categories:", error);
      // Fallback
      setDynamicCourseOptions([
        { value: "General", label: "General" }
      ]);
    }
  };

  // Handle lead assignment or remark
  const handleAssignLead = async () => {
    if (!assignToUser && !assignmentRemark.trim()) {
      toast.error("Please select a user to assign or add a remark");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (assignToUser) {
        // Path A: Assignment (with optional remark)
        response = await axios.put(
          `${API}/customers/assign/${selectedRow._id}`,
          { assignedTo: assignToUser, assignmentRemark },
          { withCredentials: true }
        );
      } else {
        // Path B: Remark Only
        response = await axios.post(
          `${API}/customers/remark/${selectedRow._id}`,
          {
            remark: assignmentRemark,
            leadStatus: selectedRow.leadStatus || 'new',
            handledBy: user?.fullName || "System",
            nextFollowUpDate: selectedRow.followUpDate
          },
          { withCredentials: true }
        );
      }

      if (response.data.customer) {
        // Update the data in the table
        setData(prevData =>
          prevData.map(lead =>
            lead._id === selectedRow._id ? response.data.customer : lead
          )
        );

        toast.success(assignToUser ? "Lead assigned successfully!" : "Remark added successfully!");
        closeAssignModal();

        // Add notification
        if (typeof addNotification === 'function') {
          addNotification({
            type: assignToUser ? 'lead_assigned' : 'lead_remark',
            userName: user?.fullName || 'Someone',
            avatar: user?.avatar || null,
            action: assignToUser ? 'assigned lead' : 'added a remark to',
            entityName: selectedRow.fullName,
            module: 'Lead Management',
          });
        }
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error(error.response?.data?.message || (assignToUser ? "Failed to assign lead" : "Failed to add remark"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          {/* Header with Search / Sort / Status / Print */}
          <div className="space-y-4 mb-6">
            {/* Title Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Enquiries</h3>
                {isRegularUser && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Showing only leads assigned to you
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {selectedLeads.length > 0 && (
                    <p className="text-xs text-brand-500 font-medium">
                      {selectedLeads.length} lead(s) selected
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Total: {filteredData.length} records
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lead Potential:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Strong</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Potential</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-orange-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Weak</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Not a prospect</span>
                  </div>
                </div>

                {/* Contact Point Statistics */}
                {Object.keys(contactPointStats).length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">This Month:</span>
                    {Object.entries(contactPointStats).map(([contactPoint, count]) => {
                      const { icon: Icon, color } = getContactPointIcon(contactPoint);
                      return (
                        <div key={contactPoint} className="flex items-center gap-1.5" title={contactPoint}>
                          <Icon className={`size-3.5 ${color}`} />
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-56">
                  <RangeDatePicker
                    id="leadDateFilter"
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates)}
                    placeholder="Filter by date range"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={showFilters ? <ChevronUpIcon className="size-5" /> : <ChevronDownIcon className="size-5" />}
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openImportModal}
                  startIcon={<FileIcon className="size-5" />}
                >
                  Import
                </Button>
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

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50/50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-all duration-300">
                <Input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />

                <Select
                  options={sortOrderList}
                  value={sortOrder}
                  placeholder="Sort by date"
                  onChange={(value) => setSortOrder(value)}
                />

                <Select
                  options={[
                    { value: "", label: "All Lead Statuses" },
                    ...leadStatusOptions
                  ]}
                  value={leadStatusFilter}
                  placeholder="Filter by lead status"
                  onChange={(value) => setLeadStatusFilter(value)}
                />

                <Select
                  options={[
                    { value: "", label: "All Lead Potentials" },
                    ...leadPotentialOptions
                  ]}
                  value={leadPotentialFilter}
                  placeholder="Filter by lead potential"
                  onChange={(value) => setLeadPotentialFilter(value)}
                />

                <Select
                  options={[
                    { value: "", label: "All Campaigns" },
                    ...campaignOptions
                  ]}
                  value={campaignFilter}
                  placeholder="Filter by campaign"
                  onChange={(value) => setCampaignFilter(value)}
                />

                {canAssignLeads && (
                  <Select
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
              </div>
            )}
          </div>

          {/* Table */}
          <div className="hidden md:block max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 pl-8 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={filteredData.length > 0 && selectedLeads.length === filteredData.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <div className="size-6 invisible shrink-0" />
                    </div>
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Date Added</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">Contact Point</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Campaign</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Status & Remark</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Next Follow-up</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                      {isRegularUser ? "No leads assigned to you." : "No leads found. Create your first lead!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row) => {
                    const latestRemark = getLatestRemark(row.remarks);
                    const hasUnread = hasUnreadRemarks(row.remarks);

                    const styles = getLeadPotentialStyles(row.leadPotential);

                    return (
                      <TableRow key={row._id} className="group overflow-hidden transition-colors even:bg-gray-50/40 even:dark:bg-white/[0.01] hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                        <TableCell className="py-4 pl-8 relative">
                          {/* Vertical Status Strip */}
                          <div className={`absolute left-0 top-0 bottom-0 w-[6px] ${styles.bar}`} />
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(row._id)}
                              onChange={() => handleSelectLead(row._id)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            {hasUnread ? (
                              <div className="size-5 shrink-0 rounded-full bg-red-600 flex items-center justify-center shadow-md" title="New Remark">
                                <BoltIcon className="size-3.5 text-white" />
                              </div>
                            ) : (
                              <div className="size-6 invisible shrink-0" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div
                            className="flex flex-col min-w-0 cursor-help"
                            onMouseEnter={(e) => handleAnalysisEnter(e, row)}
                            onMouseLeave={handleAnalysisLeave}
                          >
                            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90 truncate group-hover/name:text-brand-500 transition-colors">{row.fullName}</p>
                            <p className="text-gray-400 text-xs truncate max-w-[180px]">
                              {row.coursePreference?.join(", ") || "N/A"}
                            </p>
                            <a href={`tel:${row.phone1}`} className="text-brand-500 hover:underline text-[12px] font-medium mt-0.5">
                              {row.phone1}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex flex-col gap-0.5">
                            <p>{formatDate(row.createdAt)}</p>
                            <p className="text-gray-400 text-xs truncate max-w-[180px]">
                              By:&nbsp;{row.createdBy?.fullName || row.handledBy || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {(() => {
                              const { icon: Icon, label, color } = getContactPointIcon(row.contactPoint, row.otherContactPoint);
                              return (
                                <div className="group relative" title={label}>
                                  <div className="p-1.5 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100/50 dark:border-gray-700/50 transition-all duration-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 group-hover:scale-110 shadow-sm inline-flex items-center justify-center">
                                    <Icon className={`size-4 ${color}`} />
                                  </div>
                                </div>
                              );
                            })()}
                            {(row.contactPoint?.toLowerCase() === "other" ||
                              row.contactPoint?.toLowerCase() === "reference" ||
                              row.contactPoint?.toLowerCase() === "referance") && row.otherContactPoint && (
                                <p className="text-gray-400 text-[9px] truncate max-w-[120px] italic opacity-60 hover:opacity-100 transition-opacity">
                                  {row.otherContactPoint}
                                </p>
                              )}
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{row.campaign || "N/A"}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <Badge
                                size="sm"
                                color={getLeadStatusColor(row.leadStatus)}
                              >
                                {getLeadStatusLabel(row.leadStatus)}
                              </Badge>
                            </div>

                            <div
                              className="relative group/remark"
                              data-row-id={row._id}
                              onMouseEnter={(e) => handleTooltipEnter(e, row)}
                              onMouseLeave={handleTooltipLeave}
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-[180px] truncate cursor-help leading-relaxed">
                                {latestRemark || "No remarks yet"}
                              </p>
                              {row.assignmentRemark && (
                                <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 truncate animate-pulse duration-100">
                                  Suggestion: {row.assignmentRemark}
                                </p>
                              )}
                            </div>

                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          <div className="flex flex-col gap-1 items-start">
                            <Badge
                              size="sm"
                              color={getDueDateBadgeColor(row.followUpDate)}
                            >
                              {getDueDateBadgeText(row.followUpDate)}
                            </Badge>
                            {row.assignedTo && (
                              <p className="text-gray-400 text-xs truncate max-w-[180px]">
                                Assigned To:&nbsp;{row.assignedTo.fullName}
                              </p>
                            )}
                          </div>
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
                            <Button size="sm" variant="outline" className="text-yellow-500" title="Follow-up Alarm" endIcon={<BoltIcon className="size-5" />} onClick={() => handleAlarm(row)} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredData.length === 0 ? (
              <div className="py-8 text-center text-gray-500 bg-white dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-gray-800">
                {isRegularUser ? "No leads assigned to you." : "No leads found."}
              </div>
            ) : (
              filteredData.map((row) => {
                const latestRemark = getLatestRemark(row.remarks);
                const styles = getLeadPotentialStyles(row.leadPotential);
                const hasUnread = hasUnreadRemarks(row.remarks);

                return (
                  <div key={row._id} className="relative overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                    {/* Vertical Status Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${styles.bar}`} />

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(row._id)}
                          onChange={() => handleSelectLead(row._id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <div
                          className="cursor-help"
                          onMouseEnter={(e) => handleAnalysisEnter(e, row)}
                          onMouseLeave={handleAnalysisLeave}
                        >
                          <h4 className="font-semibold text-gray-800 dark:text-white/90">{row.fullName}</h4>
                          <a href={`tel:${row.phone1}`} className="text-brand-500 text-sm font-medium hover:underline">
                            {row.phone1}
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge size="sm" color={getLeadStatusColor(row.leadStatus)}>
                          {getLeadStatusLabel(row.leadStatus)}
                        </Badge>
                        {hasUnread && (
                          <div className="size-5 rounded-full bg-red-600 flex items-center justify-center shadow-sm">
                            <BoltIcon className="size-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Course Preference:</span>
                        <span className="text-gray-700 dark:text-gray-200 text-right max-w-[150px] truncate">
                          {row.coursePreference?.join(", ") || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Added:</span>
                        <span className="text-gray-700 dark:text-gray-200">
                          {formatDate(row.createdAt)} by {row.createdBy?.fullName || row.handledBy || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Next Follow-up:</span>
                        <Badge size="sm" color={getDueDateBadgeColor(row.followUpDate)}>
                          {getDueDateBadgeText(row.followUpDate)}
                        </Badge>
                      </div>
                      {row.assignedTo && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Assigned To:</span>
                          <span className="text-gray-700 dark:text-gray-200 font-medium">
                            {row.assignedTo.fullName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Latest Remark:</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                        {latestRemark || "No remarks yet"}
                      </p>
                      {row.assignmentRemark && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-2 font-medium">
                          Suggestion: {row.assignmentRemark}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <Button size="sm" variant="outline" className="p-2" onClick={() => handleAlarm(row)}>
                        <BoltIcon className="size-5 text-yellow-500" />
                      </Button>
                      {canAssignLeads && (
                        <Button size="sm" variant="outline" className="text-blue-500 px-3" onClick={() => openAssignModal(row)}>
                          Assign
                        </Button>
                      )}
                      {isOwner(user) && (
                        <Button size="sm" variant="outline" className="p-2 text-red-500" onClick={() => handleDelete(row)}>
                          <CloseIcon className="size-5" />
                        </Button>
                      )}
                      <Button size="sm" variant="primary" className="px-3" onClick={() => handleEdit(row)}>
                        <PencilIcon className="size-4 mr-2" /> Edit
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* History Tooltip - Rendered via Portal at Body Level */}
          {hoveredRemarkRow && showTooltip && createPortal((() => {
            const hoveredRow = filteredData.find(row => row._id === hoveredRemarkRow);
            if (!hoveredRow || !hoveredRow.remarks || hoveredRow.remarks.length === 0) return null;

            const isAbove = tooltipPosition.transform.includes('-100%') || tooltipPosition.transform === 'translateY(-10px)';

            return (
              <div
                ref={tooltipRef}
                className={`fixed w-96 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-[100000] transition-all duration-200 ${showTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  maxHeight: `${tooltipPosition.maxHeight}px`,
                  transform: `${tooltipPosition.transform} ${showTooltip ? 'scale(1)' : 'scale(0.95)'}`
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
                <div className="overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600" style={{ maxHeight: `${tooltipPosition.maxHeight - 60}px` }}>
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
          })(), document.body)}
          {/* AI Analysis Tooltip */}
          {hoveredAnalysisLeadId && showAnalysisTooltip && createPortal((() => {
            const isAbove = tooltipPosition.transform.includes('-100%') || tooltipPosition.transform === 'translateY(-10px)';

            return (
              <div
                ref={tooltipRef}
                className={`fixed w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-blue-200 dark:border-blue-900/50 z-[100000] transition-all duration-200 ${showAnalysisTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: `${tooltipPosition.transform} ${showAnalysisTooltip ? 'scale(1)' : 'scale(0.95)'}`
                }}
                onMouseEnter={() => {
                  if (analysisTimeoutRef.current) {
                    clearTimeout(analysisTimeoutRef.current);
                  }
                }}
                onMouseLeave={handleAnalysisLeave}
              >
                {/* Arrow */}
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
                    />
                  </div>
                )}

                <div className="p-3 border-b border-blue-50 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <BoltIcon className="size-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Lead Analysis - CDC AI</h4>
                    {isAnalyzing && <div className="size-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-auto" />}
                  </div>
                </div>
                <div className="p-4">
                  {isAnalyzing ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{analysisCache[hoveredAnalysisLeadId] || "Loading suggestion..."}"
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-3 text-right">System suggestion</p>
                </div>
              </div>
            );
          })(), document.body)}

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
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="firstName">Full Name *</Label>
                    <Input
                      type="text"
                      id="firstName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isAdmin(user) && !isManager(user)}
                    />

                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      error={error}
                      onChange={handleEmailChange}
                      placeholder="Enter email"
                      hint={error ? "This is an invalid email address." : ""}
                      disabled={!isAdmin(user) && !isManager(user)}
                    />

                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Phone *</Label>
                    <PhoneInput
                      selectPosition="end"
                      countries={countries}
                      placeholder="+91 98765 43210"
                      value={phone1}
                      onChange={handlePhone1Change}
                      error={!!validationErrors.phone1 || phoneExists}
                      hint={validationErrors.phone1}
                      disabled={!isAdmin(user) && !isManager(user)}
                    />
                    {checkingPhone && <p className="text-xs text-gray-400 mt-1">Checking uniqueness...</p>}

                  </div>
                  <div className="w-full md:w-1/4">
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
                    <Label>Place *</Label>
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
                    <Label>Education *</Label>
                    <Select
                      options={enquirerEducation}
                      value={education}
                      placeholder="Select Education"
                      onChange={setEducation}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="otherEducation">Specify other</Label>
                    <Input
                      type="text"
                      id="otherEducation"
                      value={otherEducation}
                      onChange={(e) => setOtherEducation(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="mb-0">Contact Point</Label>
                      {contactPoint && (
                        (() => {
                          const { icon: Icon, color } = getContactPointIcon(contactPoint);
                          return <Icon className={`size-4 ${color}`} />;
                        })()
                      )}
                    </div>
                    <Select
                      options={isManager(user) ? contactPointOptions : contactPointOptions.filter(cp => cp.value !== "__add_new__")}
                      value={contactPoint}
                      onChange={setContactPoint}
                      disabled={!isManager(user)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label htmlFor="otherContactPoint">Specify other</Label>
                    <Input
                      type="text"
                      id="otherContactPoint"
                      value={otherContactPoint}
                      onChange={(e) => setOtherContactPoint(e.target.value)}
                      disabled={contactPoint !== "other" && contactPoint?.toLowerCase() !== "reference" && contactPoint?.toLowerCase() !== "referance"}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full">
                    <MultiSelect
                      label="Course Preference"
                      options={dynamicCourseOptions}
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
                      disabled={!isManager(user)}
                    />

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
                        if (value === "converted" || value === "lost") {
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
                  {leadStatus !== "converted" && leadStatus !== "lost" && (
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
                    loading={isSubmitting}
                    disabled={phoneExists}
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shadow-theme-xs"
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

              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="newCampaignActive"
                    checked={newCampaignActive}
                    onChange={(e) => setNewCampaignActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <Label htmlFor="newCampaignActive" className="mb-0">Active</Label>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <Button variant="outline" onClick={closeCampaignModal}>Cancel</Button>
                <Button variant="primary" onClick={createNewCampaignHandler}>Create Campaign</Button>
              </div>
            </div>
          </Modal>

          {/* Import Leads Modal */}
          <Modal
            isOpen={isImportOpen}
            onClose={closeImportModal}
            className="max-w-xl p-0 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Import Leads
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload a CSV file to bulk import your leads into the system.
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Step 1: Download Template */}
                <div className="bg-brand-50/50 dark:bg-brand-500/5 p-4 rounded-xl border border-brand-100 dark:border-brand-500/20 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400">Step 1: Get the template</h4>
                    <p className="text-xs text-brand-600/80 dark:text-brand-400/60 mt-0.5">Use our CSV template to ensure correct data formatting.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white dark:bg-gray-900"
                    onClick={() => {
                      const headers = ["Full Name", "Phone", "Email", "Place", "Education", "Course Preference", "Contact Point", "Campaign", "Next Follow Up Date", "Remarks", "Lead Potential"];
                      const sampleData = [
                        ["John Doe", "9876543210", "john@example.com", "New York", "Bachelor's", "Python;Java", "Website", "Summer 2024", "2024-07-15", "Interested in backend", "strongProspect"],
                        ["Jane Smith", "9123456789", "jane@test.com", "London", "Master's", "AWS", "LinkedIn", "Winter Sale", "2024-07-20", "Wants to switch career", "potentialProspect"]
                      ];
                      const csvContent = "data:text/csv;charset=utf-8," +
                        [headers, ...sampleData].map(e => e.join(",")).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "lead_import_template.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Download Sample
                  </Button>
                </div>

                {/* Step 2: Upload File */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Step 2: Upload your file</h4>
                  <div
                    className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-brand-300 dark:hover:border-brand-800 transition-colors cursor-pointer group"
                    onClick={() => document.getElementById('csv-upload').click()}
                  >
                    <div className="size-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-brand-50 dark:group-hover:bg-brand-500/10 transition-colors">
                      <DownloadIcon className="size-6 text-gray-400 group-hover:text-brand-500 rotate-180" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">Only CSV files are supported (max 5MB)</p>
                    <input
                      type="file"
                      id="csv-upload"
                      className="hidden"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
                            toast.error("Please upload a valid CSV file");
                            return;
                          }
                          // Mock processing
                          toast.info(`Processing ${file.name}...`);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Note Section */}
                <div className="flex gap-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="size-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] text-white font-bold">i</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Important Notes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure dates are in YYYY-MM-DD format.</li>
                      <li>"Full Name" and "Phone" are required fields.</li>
                      <li>"Course Preference" can be multiple items separated by semi-colons.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={closeImportModal}>
                Cancel
              </Button>
              <Button variant="primary" loading={isSubmitting} onClick={() => {
                const fileInput = document.getElementById('csv-upload');
                if (fileInput.files.length === 0) {
                  toast.error("Please select a file first");
                  return;
                }

                setIsSubmitting(true);
                const file = fileInput.files[0];

                Papa.parse(file, {
                  header: true,
                  skipEmptyLines: true,
                  complete: async (results) => {
                    // Helper to find case-insensitive key
                    const findKey = (keys, candidates) => {
                      if (!keys) return null;
                      const lowerKeys = keys.map(k => k.toLowerCase().trim());
                      for (const candidate of candidates) {
                        const index = lowerKeys.indexOf(candidate.toLowerCase());
                        if (index !== -1) return keys[index];
                      }
                      return null;
                    };

                    const headers = results.meta.fields || [];
                    console.log("Details found in CSV:", headers);

                    // Map keys
                    const nameKey = findKey(headers, ["Full Name", "Name", "Student Name", "Lead Name", "Enquiry Name"]);
                    const phoneKey = findKey(headers, ["Phone", "Phone Number", "Mobile", "Contact", "Phone 1", "Contact Number"]);
                    const emailKey = findKey(headers, ["Email", "Email Address", "Email ID"]);
                    const placeKey = findKey(headers, ["Place", "City", "Location", "Address"]);
                    const educationKey = findKey(headers, ["Education", "Qualification"]);
                    const courseKey = findKey(headers, ["Course Preference", "Course", "Interest", "Subject"]);
                    const contactPointKey = findKey(headers, ["Contact Point", "Source"]);
                    const campaignKey = findKey(headers, ["Campaign"]);
                    const followupKey = findKey(headers, ["Next Follow Up Date", "Follow Up Date", "Follow Up", "Date"]);
                    const remarksKey = findKey(headers, ["Remarks", "Note", "Comment"]);
                    const potentialKey = findKey(headers, ["Lead Potential", "Potential", "Status"]);
                    const dateCreatedKey = findKey(headers, ["Date Created", "Created At", "Creation Date", "Date Added"]);

                    if (!nameKey || !phoneKey) {
                      console.error("Missing headers. Found:", headers);
                      toast.error(`Missing required columns! Found: ${headers.join(", ")}. Need at least 'Name' and 'Phone'.`, { autoClose: 10000 });
                      setIsSubmitting(false);
                      return;
                    }

                    const parsedLeads = results.data.map(row => {
                      return {
                        fullName: row[nameKey],
                        phone1: row[phoneKey],
                        email: emailKey ? row[emailKey] : "",
                        place: placeKey ? row[placeKey] : "",
                        education: educationKey ? row[educationKey] : "Other",
                        coursePreference: courseKey ? row[courseKey] : "",
                        contactPoint: contactPointKey ? row[contactPointKey] : "Other",
                        campaign: campaignKey ? row[campaignKey] : "",
                        nextFollowUpDate: followupKey ? row[followupKey] : "",
                        remarks: remarksKey ? row[remarksKey] : "",
                        leadStatus: "new",
                        leadPotential: potentialKey ? (row[potentialKey] || "potentialProspect") : "potentialProspect",
                        createdAt: dateCreatedKey ? row[dateCreatedKey] : null
                      };
                    });

                    // Remove entries that are completely empty or missing required fields locally first?
                    // Let's filter minimal validity
                    const validLeads = parsedLeads.filter(l => l.fullName && l.phone1);

                    if (validLeads.length === 0) {
                      toast.error("No valid leads found in file. Check Name and Phone columns.");
                      setIsSubmitting(false);
                      return;
                    }

                    try {
                      const response = await axios.post(
                        `${API}/customers/import-leads`,
                        { leads: validLeads },
                        { withCredentials: true }
                      );

                      const { summary } = response.data;
                      if (summary.success > 0) {
                        toast.success(`Successfully imported ${summary.success} leads!`);
                        fetchCustomers(setData, setLoading); // Refresh table
                      }

                      if (summary.failed > 0) {
                        toast.warn(`${summary.failed} leads failed to import. Check console for details.`);
                        console.warn("Import Errors:", summary.errors);
                      }

                      closeImportModal();
                    } catch (error) {
                      console.error("Import failed:", error);
                      toast.error(error.response?.data?.message || "Import failed. Please try again.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  },
                  error: (error) => {
                    console.error("CSV Parse Error:", error);
                    toast.error("Failed to parse CSV file.");
                    setIsSubmitting(false);
                  }
                });
              }}>
                Confirm Import
              </Button>
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
                <Button loading={isSubmitting} onClick={handleAssignLead}>
                  {!assignToUser && assignmentRemark.trim() ? "Add Remark" : (assignToUser && assignmentRemark.trim() ? "Assign & Add Remark" : "Assign Lead")}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )
      }
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div >
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
