import { useState, useEffect, useCallback, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../context/AuthContext";
import { useCalendar } from "../../context/calendarContext";
import { useNotifications } from "../../context/NotificationContext";
import { useModal } from "../../hooks/useModal";
import LoadingSpinner from "../common/LoadingSpinner";
import API from "../../config/api";

// Sub-components
import LeadFilters from "../leadManagement/components/LeadFilters";
import LeadTableRow from "../leadManagement/components/LeadTableRow";
import LeadMobileCard from "../leadManagement/components/LeadMobileCard";
import RemarkTooltip from "../leadManagement/components/RemarkTooltip";
import AIAnalysisTooltip from "../leadManagement/components/AIAnalysisTooltip";
import EditLeadModal from "../leadManagement/components/EditLeadModal";
import DeleteLeadModal from "../leadManagement/components/DeleteLeadModal";
import FollowupModal from "../leadManagement/components/FollowupModal";
import ImmediateFollowupModal from "../leadManagement/components/ImmediateFollowupModal";
import CampaignModal from "../leadManagement/components/CampaignModal";
import ImportLeadsModal from "../leadManagement/components/ImportLeadsModal";
import AssignLeadModal from "../leadManagement/components/AssignLeadModal";

// Hooks
import { useLeadFiltering } from "../leadManagement/hooks/useLeadFiltering";
import { useTooltipPosition } from "../leadManagement/hooks/useTooltipPosition";
import { usePhoneValidation } from "../leadManagement/hooks/usePhoneValidation";

// Services & helpers
import { fetchCustomers, fetchCampaigns, createNewCampaign, prepareLeadForEdit } from "../leadManagement/leadDataManagement";
import { saveLeadChanges, deleteLead, setLeadReminder, markRemarkAsRead, setImmediateFollowup } from "../leadManagement/leadUpdateService";
import { downloadLeadsAsPDF } from "../leadManagement/leadPdfExport";
import { getLeadStatusLabel } from "../leadManagement/leadHelpers";
import { isAdmin, isManager, isCounsellor as isCounsellorHelper } from "../../utils/roleHelpers";
import { campaigns, contactPoints } from "../../data/DataSets";

export default function RecentOrders() {
  const location = useLocation();
  const { user, selectedBrand } = useContext(AuthContext);
  const { addEvent, events, updateEvent } = useCalendar();
  const { addNotification, areToastsEnabled } = useNotifications();

  // ── Filter / Sort state ────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("followup_latest");
  const [statusFilter, setStatusFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [leadPotentialFilter, setLeadPotentialFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const getInitialMonthRange = () => {
    const now = new Date();
    return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)];
  };
  const [dateRange, setDateRange] = useState(getInitialMonthRange());

  // ── Data state ─────────────────────────────────────────────────────────────
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [dynamicCourseOptions, setDynamicCourseOptions] = useState([]);
  const [contactPointOptions, setContactPointOptions] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);

  // ── Permissions ────────────────────────────────────────────────────────────
  const brandIdForRoles = selectedBrand?._id || selectedBrand?.id;
  const hasManagerRole = isManager(user, brandIdForRoles);
  // isCounsellor kept for potential future use
  // const isCounsellor = isCounsellorHelper(user, brandIdForRoles);
  const canDeleteLeads = isAdmin(user, brandIdForRoles) || hasManagerRole;
  const isRegularUser = !isAdmin(user, brandIdForRoles) && !hasManagerRole;
  const canAssignLeads = isAdmin(user, brandIdForRoles) || hasManagerRole;

  // ── Modal states ───────────────────────────────────────────────────────────
  const { isOpen: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: isAlarmOpen, openModal: openAlarmModal, closeModal: closeAlarmModal } = useModal();
  const { isOpen: isImmediateFollowupOpen, openModal: openImmediateFollowupModal, closeModal: closeImmediateFollowupModal } = useModal();
  const { isOpen: isCampaignModalOpen, openModal: openCampaignModal, closeModal: closeCampaignModal } = useModal();
  const { isOpen: isImportOpen, openModal: openImportModal, closeModal: closeImportModal } = useModal();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Selected row ───────────────────────────────────────────────────────────
  const [selectedRow, setSelectedRow] = useState(null);

  // ── Edit form state ────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [place, setPlace] = useState("");
  const [otherPlace, setOtherPlace] = useState("");
  const [status, setStatus] = useState("");
  const [education, setEducation] = useState("");
  const [otherEducation, setOtherEducation] = useState("");
  const [contactPoint, setContactPoint] = useState("");
  const [otherContactPoint, setOtherContactPoint] = useState("");
  const [campaign, setCampaign] = useState("");
  const [handledByPerson, setHandledByPerson] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [selectedValues, setSelectedValues] = useState([]);
  const [leadStatus, setLeadStatus] = useState("");
  const [leadPotential, setLeadPotential] = useState("");
  const [immediateFollowup, setImmediateFollowupValue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(false);

  // ── Campaign modal state ───────────────────────────────────────────────────
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  // ── Assign modal state ─────────────────────────────────────────────────────
  const [assignToUser, setAssignToUser] = useState("");
  const [assignmentRemark, setAssignmentRemark] = useState("");

  // ── Custom hooks ───────────────────────────────────────────────────────────
  const { filteredData, contactPointStats } = useLeadFiltering({
    data, search, sortOrder, statusFilter, leadStatusFilter, leadPotentialFilter,
    assignedUserFilter, campaignFilter, dateRange, user, canAssignLeads,
  });

  const {
    hoveredRemarkRow, tooltipPosition, showTooltip, showAnalysisTooltip,
    hoveredAnalysisLeadId, analysisCache, isAnalyzing,
    hoverTimeoutRef, analysisTimeoutRef, tooltipRef,
    handleTooltipEnter, handleTooltipLeave, handleAnalysisEnter, handleAnalysisLeave,
  } = useTooltipPosition();

  const { phoneExists, checkingPhone, validationErrors } = usePhoneValidation({
    phone1, isEditOpen, excludeId: selectedRow?._id,
  });

  // ── Data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCustomers(setData, setLoading);
    fetchCampaigns(setCampaignOptions, campaigns, user);
    fetchCourseCategories();
    fetchContactPoints();
  }, [user]);

  useEffect(() => {
    if (user && (user?.isAdmin || isAdmin(user, brandIdForRoles) || hasManagerRole)) {
      fetchAvailableUsers(brandIdForRoles);
    }
  }, [user, selectedBrand]);

  useEffect(() => {
    if (canAssignLeads && selectedBrand) {
      fetchAvailableUsers(selectedBrand?._id || selectedBrand?.id);
    }
  }, [selectedBrand, canAssignLeads]);

  // Open lead from calendar link
  useEffect(() => {
    const openLeadId = sessionStorage.getItem('openLeadId');
    if (openLeadId && data.length > 0) {
      const leadToOpen = data.find(lead => lead._id === openLeadId);
      if (leadToOpen) {
        handleEdit(leadToOpen);
        sessionStorage.removeItem('openLeadId');
      }
    }
  }, [data, location]);

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchAvailableUsers = async (brandId = null) => {
    try {
      const url = brandId ? `${API}/users/dropdown?brandId=${brandId}` : `${API}/users/dropdown`;
      const response = await axios.get(url, { withCredentials: true });
      setAvailableUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users for assignment");
    }
  };

  const fetchContactPoints = async () => {
    try {
      const response = await axios.get(`${API}/contact-points/active`, { withCredentials: true });
      const formattedContactPoints = response.data.contactPoints.map(c => ({ value: c.value, label: c.name }));
      formattedContactPoints.push({ value: "other", label: "Other" });
      if (hasManagerRole) {
        formattedContactPoints.push({ value: "__add_new__", label: "+ Add New Contact Point" });
      }
      setContactPointOptions(formattedContactPoints);
    } catch (error) {
      console.error("Error fetching contact points:", error);
      const fallbackOptions = [...contactPoints];
      if (hasManagerRole) fallbackOptions.push({ value: "__add_new__", label: "+ Add New Contact Point" });
      setContactPointOptions(fallbackOptions);
    }
  };

  const fetchCourseCategories = async () => {
    try {
      const response = await axios.get(`${API}/course-categories/all`, { withCredentials: true });
      const categories = response.data.categories.filter(c => c.isActive).map(c => ({ value: c.name, label: c.name }));
      setDynamicCourseOptions(categories);
    } catch (error) {
      console.error("Error fetching course categories:", error);
      setDynamicCourseOptions([{ value: "General", label: "General" }]);
    }
  };

  // ── Event handlers ─────────────────────────────────────────────────────────
  const validateEmail = (value) => {
    const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    setError(!isValidEmail);
    return isValidEmail;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    validateEmail(e.target.value);
  };

  const resetModal = () => {
    setSelectedRow(null);
  };

  const handleSelectLead = useCallback((leadId) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  }, []);

  const handleSelectAll = (e) => {
    setSelectedLeads(e.target.checked ? filteredData.map(l => l._id) : []);
  };

  const downloadPDF = async () => {
    await downloadLeadsAsPDF(selectedLeads, data, toast);
  };

  const toggleDropdown = useCallback((id) => {
    setOpenDropdownId(prev => (prev === id ? null : id));
  }, []);

  const handleEdit = useCallback(async (row) => {
    // Mark unread remarks as read
    if (row.remarks && row.remarks.length > 0) {
      const unreadRemarks = row.remarks.map((remark, index) => ({ remark, index })).filter(({ remark }) => remark.isUnread);
      for (const { index } of unreadRemarks) {
        try { await markRemarkAsRead(row._id, index); } catch (e) { console.error("Error marking remark as read:", e); }
      }
      if (unreadRemarks.length > 0) {
        setData(prev => prev.map(lead => {
          if (lead._id !== row._id) return lead;
          const updatedRemarks = [...lead.remarks];
          unreadRemarks.forEach(({ index }) => { updatedRemarks[index].isUnread = false; });
          return { ...lead, remarks: updatedRemarks };
        }));
      }
    }

    const setters = {
      setSelectedRow, setEditName: () => { }, setEditPhone: () => { }, setEditEmail: () => { },
      setEditStatus: () => { }, setEditFollowUp: () => { },
      setFullName, setEmail, setPhone1, setPhone2, setGender, setDob,
      setPlace, setOtherPlace, setStatus, setEducation, setOtherEducation,
      setContactPoint, setOtherContactPoint, setCampaign, setHandledByPerson,
      setFollowUpDate, setRemarks, setLeadStatus, setLeadPotential, setSelectedValues,
      courseOptions: dynamicCourseOptions, contactPointOptions,
    };
    prepareLeadForEdit(row, setters);
    openEditModal();
  }, [dynamicCourseOptions, contactPointOptions, openEditModal]);

  const handleDelete = useCallback((row) => {
    if (!canDeleteLeads) {
      toast.error("Only managers and admins can delete leads.", { position: "top-center", autoClose: 3000 });
      return;
    }
    setSelectedRow(row);
    openDeleteModal();
  }, [canDeleteLeads, openDeleteModal]);

  const handleAlarm = useCallback((row) => {
    setSelectedRow(row);
    openAlarmModal();
  }, [openAlarmModal]);

  const handleImmediateFollowup = useCallback((row) => {
    setSelectedRow(row);
    setImmediateFollowupValue("");
    openImmediateFollowupModal();
  }, [openImmediateFollowupModal]);

  const saveChanges = async () => {
    if (!leadStatus) { toast.error("Lead Status is required"); return; }
    if (!leadPotential) { toast.error("Lead Potential is required"); return; }
    if (leadStatus !== "converted" && leadStatus !== "lost" && !followUpDate) { toast.error("Next Follow Up Date is required"); return; }
    if (!remarks.trim()) { toast.error("Remarks are required"); return; }

    setIsSubmitting(true);
    try {
      const success = await saveLeadChanges(
        selectedRow, remarks, leadStatus, leadPotential, fullName, phone1, phone2, email,
        gender, dob, place, otherPlace, status, education, otherEducation, contactPoint,
        otherContactPoint, campaign,
        (leadStatus === "converted" || leadStatus === "lost") ? null : followUpDate,
        selectedValues, user, handledByPerson, getLeadStatusLabel,
        addEvent, updateEvent, events,
        () => fetchCustomers(setData, setLoading),
        setSelectedRow, setRemarks, addNotification, areToastsEnabled,
        // Only clear immediate followup if we are in "Action Now" mode (handled by checking if leadId was in session)
        sessionStorage.getItem("openLeadId") === selectedRow?._id ? "" : undefined
      );
      if (success) {
        if (sessionStorage.getItem("openLeadId") === selectedRow?._id) {
          sessionStorage.removeItem("openLeadId");
        }
        closeEditModal();
        resetModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    await deleteLead(selectedRow, canDeleteLeads, closeDeleteModal, resetModal, setData, addNotification, areToastsEnabled, toast);
  };

  const setReminder = async () => {
    await setLeadReminder(selectedRow, closeAlarmModal, resetModal, addEvent, toast);
  };

  const confirmImmediateFollowup = async () => {
    if (!immediateFollowup) { toast.error("Please select a reminder interval"); return; }
    setIsSubmitting(true);
    try {
      const success = await setImmediateFollowup(
        selectedRow._id,
        immediateFollowup,
        user,
        () => fetchCustomers(setData, setLoading),
        addNotification,
        areToastsEnabled,
        toast
      );
      if (success) {
        closeImmediateFollowupModal();
        resetModal();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCampaignChange = (value) => {
    if (value === "__add_new__") { openCampaignModal(); } else { setCampaign(value); }
  };

  const createNewCampaignHandler = async () => {
    await createNewCampaign(
      newCampaignName, newCampaignDesc, newCampaignDiscount, newCampaignCashback, newCampaignActive,
      setCampaign, () => fetchCampaigns(setCampaignOptions, campaigns, user),
      closeCampaignModal,
      setNewCampaignName, setNewCampaignDesc, setNewCampaignDiscount, setNewCampaignCashback, setNewCampaignActive,
      toast
    );
  };

  const openAssignModal = useCallback((row) => {
    setSelectedRow(row);
    setIsAssignModalOpen(true);
    fetchAvailableUsers(row.brand ? (row.brand._id || row.brand) : undefined);
  }, []);

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignToUser("");
    setAssignmentRemark("");
  };

  const handleAssignLead = async () => {
    if (!assignToUser && !assignmentRemark.trim()) { toast.error("Please select a user to assign or add a remark"); return; }
    setIsSubmitting(true);
    try {
      let response;
      if (assignToUser) {
        response = await axios.put(`${API}/customers/assign/${selectedRow._id}`, { assignedTo: assignToUser, assignmentRemark }, { withCredentials: true });
      } else {
        response = await axios.post(`${API}/customers/remark/${selectedRow._id}`, { remark: assignmentRemark, leadStatus: selectedRow.leadStatus || 'new', handledBy: user?.fullName || "System", nextFollowUpDate: selectedRow.followUpDate }, { withCredentials: true });
      }
      if (response.data.customer) {
        setData(prev => prev.map(lead => lead._id === selectedRow._id ? response.data.customer : lead));
        toast.success(assignToUser ? "Lead assigned successfully!" : "Remark added successfully!");
        closeAssignModal();
        if (typeof addNotification === 'function') {
          addNotification({ type: assignToUser ? 'lead_assigned' : 'lead_remark', userName: user?.fullName || 'Someone', avatar: user?.avatar || null, action: assignToUser ? 'assigned lead' : 'added a remark to', entityName: selectedRow.fullName, module: 'Lead Management' });
        }
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error(error.response?.data?.message || (assignToUser ? "Failed to assign lead" : "Failed to add remark"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <LeadFilters
            filteredCount={filteredData.length}
            selectedLeadsCount={selectedLeads.length}
            isRegularUser={isRegularUser}
            contactPointStats={contactPointStats}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            search={search}
            sortOrder={sortOrder}
            leadStatusFilter={leadStatusFilter}
            leadPotentialFilter={leadPotentialFilter}
            campaignFilter={campaignFilter}
            assignedUserFilter={assignedUserFilter}
            onSearchChange={setSearch}
            onSortOrderChange={setSortOrder}
            onLeadStatusChange={setLeadStatusFilter}
            onLeadPotentialChange={setLeadPotentialFilter}
            onCampaignChange={setCampaignFilter}
            onAssignedUserChange={setAssignedUserFilter}
            campaignOptions={campaignOptions}
            availableUsers={availableUsers}
            canAssignLeads={canAssignLeads}
            onOpenImport={openImportModal}
            onDownloadPDF={downloadPDF}
            isPdfDisabled={selectedLeads.length === 0}
          />

          {/* Desktop Table */}
          <div className="hidden md:block overflow-auto max-h-[calc(100vh-320px)] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar">
            <Table className="min-w-full border-collapse">
              <TableHeader className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)] border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest pl-8 bg-inherit">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={filteredData.length > 0 && selectedLeads.length === filteredData.length} onChange={handleSelectAll} className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer" />
                      <div className="size-6 invisible shrink-0" />
                    </div>
                  </TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Name</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Date Added</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Contact Point</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Campaign</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Status & Remark</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-start text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Next Follow-up</TableCell>
                  <TableCell isHeader className="py-4 px-4 font-bold text-gray-700 text-center text-[10.5px] dark:text-gray-400 uppercase tracking-widest bg-inherit border-l border-gray-100 dark:border-gray-800/50">Actions</TableCell>
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
                  filteredData.map((row) => (
                    <LeadTableRow
                      key={row._id}
                      row={row}
                      selectedLeads={selectedLeads}
                      openDropdownId={openDropdownId}
                      onSelect={handleSelectLead}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAlarm={handleAlarm}
                      onImmediateFollowup={handleImmediateFollowup}
                      onAssign={openAssignModal}
                      onToggleDropdown={toggleDropdown}
                      onDropdownClose={() => setOpenDropdownId(null)}
                      onTooltipEnter={handleTooltipEnter}
                      onTooltipLeave={handleTooltipLeave}
                      onAnalysisEnter={handleAnalysisEnter}
                      onAnalysisLeave={handleAnalysisLeave}
                      canAssignLeads={canAssignLeads}
                      user={user}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredData.length === 0 ? (
              <div className="py-12 text-center text-gray-500 bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                {isRegularUser ? "No leads assigned to you." : "No leads found."}
              </div>
            ) : (
              filteredData.map((row) => (
                <LeadMobileCard
                  key={row._id}
                  row={row}
                  openDropdownId={openDropdownId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAlarm={handleAlarm}
                  onImmediateFollowup={handleImmediateFollowup}
                  onAssign={openAssignModal}
                  onToggleDropdown={toggleDropdown}
                  onDropdownClose={() => setOpenDropdownId(null)}
                  canAssignLeads={canAssignLeads}
                />
              ))
            )}
          </div>

          {/* Tooltips */}
          <RemarkTooltip
            hoveredRow={filteredData.find(r => r._id === hoveredRemarkRow)}
            show={showTooltip}
            tooltipPosition={tooltipPosition}
            tooltipRef={tooltipRef}
            hoverTimeoutRef={hoverTimeoutRef}
            onMouseLeave={handleTooltipLeave}
          />
          <AIAnalysisTooltip
            show={showAnalysisTooltip}
            hoveredLeadId={hoveredAnalysisLeadId}
            tooltipPosition={tooltipPosition}
            tooltipRef={tooltipRef}
            isAnalyzing={isAnalyzing}
            analysisCache={analysisCache}
            analysisTimeoutRef={analysisTimeoutRef}
            onMouseLeave={handleAnalysisLeave}
          />

          {/* Modals */}
          <EditLeadModal
            isOpen={isEditOpen} onClose={closeEditModal}
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            phone1={phone1} setPhone1={setPhone1}
            phone2={phone2} setPhone2={setPhone2}
            gender={gender} setGender={setGender}
            dob={dob} setDob={setDob}
            place={place} setPlace={setPlace}
            otherPlace={otherPlace} setOtherPlace={setOtherPlace}
            status={status} setStatus={setStatus}
            education={education} setEducation={setEducation}
            otherEducation={otherEducation} setOtherEducation={setOtherEducation}
            contactPoint={contactPoint} setContactPoint={setContactPoint}
            otherContactPoint={otherContactPoint} setOtherContactPoint={setOtherContactPoint}
            campaign={campaign} setCampaign={setCampaign}
            followUpDate={followUpDate} setFollowUpDate={setFollowUpDate}
            selectedValues={selectedValues} setSelectedValues={setSelectedValues}
            leadStatus={leadStatus} setLeadStatus={setLeadStatus}
            leadPotential={leadPotential} setLeadPotential={setLeadPotential}
            remarks={remarks} setRemarks={setRemarks}
            selectedRow={selectedRow}
            error={error}
            phoneExists={phoneExists}
            checkingPhone={checkingPhone}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            onSave={saveChanges}
            onEmailChange={handleEmailChange}
            onPhone1Change={setPhone1}
            campaignOptions={campaignOptions}
            dynamicCourseOptions={dynamicCourseOptions}
            contactPointOptions={contactPointOptions}
            user={user}
            brandIdForRoles={brandIdForRoles}
            hasManagerRole={hasManagerRole}
            onCampaignChange={handleCampaignChange}
          />

          <DeleteLeadModal
            isOpen={isDeleteOpen} onClose={closeDeleteModal}
            selectedRow={selectedRow} onConfirm={confirmDelete} onReset={resetModal}
          />

          <FollowupModal
            isOpen={isAlarmOpen} onClose={closeAlarmModal}
            selectedRow={selectedRow} onSetReminder={setReminder} onReset={resetModal}
          />

          <ImmediateFollowupModal
            isOpen={isImmediateFollowupOpen}
            onClose={closeImmediateFollowupModal}
            value={immediateFollowup}
            onChange={setImmediateFollowupValue}
            onConfirm={confirmImmediateFollowup}
            isSubmitting={isSubmitting}
            leadName={selectedRow?.fullName}
          />

          <CampaignModal
            isOpen={isCampaignModalOpen} onClose={closeCampaignModal}
            newCampaignName={newCampaignName} newCampaignDesc={newCampaignDesc}
            newCampaignDiscount={newCampaignDiscount} newCampaignCashback={newCampaignCashback}
            newCampaignActive={newCampaignActive}
            onNameChange={setNewCampaignName} onDescChange={setNewCampaignDesc}
            onDiscountChange={setNewCampaignDiscount} onCashbackChange={setNewCampaignCashback}
            onActiveChange={setNewCampaignActive}
            onCreateCampaign={createNewCampaignHandler}
          />

          <ImportLeadsModal
            isOpen={isImportOpen} onClose={closeImportModal}
            isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting}
            setData={setData} setLoading={setLoading}
          />

          <AssignLeadModal
            isOpen={isAssignModalOpen} onClose={closeAssignModal}
            availableUsers={availableUsers}
            assignToUser={assignToUser} assignmentRemark={assignmentRemark}
            isSubmitting={isSubmitting}
            onAssignToChange={setAssignToUser}
            onRemarkChange={setAssignmentRemark}
            onConfirm={handleAssignLead}
          />
        </>
      )}
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}
