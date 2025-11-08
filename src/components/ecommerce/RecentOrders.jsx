import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import Button from "../../components/ui/button/Button";
import { DownloadIcon, PencilIcon, CloseIcon, BellIcon } from "../../icons";
import ComponentCard from "../common/ComponentCard.jsx";
import Input from "../form/input/InputField";
import PhoneInput from "../form/group-input/PhoneInput.tsx";
import DatePicker from "../form/date-picker.tsx";
import MultiSelect from "../form/MultiSelect.tsx";
import Label from "../form/Label";
import Select from "../form/Select";
import { Modal } from "../ui/modal";
import { useModal } from "../../hooks/useModal";
import LeadCard from "../common/LeadCard";
import { AuthContext } from "../../context/authContext";
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
  handledBy,
  leadStatusOptions
} from "../../data/DataSets.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";


export default function RecentOrders() {
  const { user } = useContext(AuthContext);
  const { addEvent } = useCalendar();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState(""); // Added for status filter
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);


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
  
  // Campaign modal states
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [newCampaignDiscount, setNewCampaignDiscount] = useState("");
  const [newCampaignCashback, setNewCampaignCashback] = useState("");
  const [newCampaignActive, setNewCampaignActive] = useState(true);

  // Fetch customers from database
  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

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

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        `${API}/customers/all`,
        { withCredentials: true }
      );
      setData(response.data.customers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setLoading(false);
      if (error.response?.status === 401) {
        alert("Please login to view leads.");
      }
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(
        `${API}/campaigns/active`,
        { withCredentials: true }
      );
      const formattedCampaigns = response.data.campaigns.map(c => ({
        value: c.value,
        label: c.name
      }));
      // Add "Add New Campaign" option at the end
      formattedCampaigns.push({
        value: "__add_new__",
        label: "+ Add New Campaign"
      });
      setCampaignOptions(formattedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      // Fallback to hardcoded campaigns if API fails
      const fallbackOptions = [...campaigns, { value: "__add_new__", label: "+ Add New Campaign" }];
      setCampaignOptions(fallbackOptions);
    }
  };

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


  const filteredData = data
    .filter(
      (item) =>
        (item.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          item.phone1?.includes(search)) &&
        (statusFilter ? item.status === statusFilter : true)
    )
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
    if (selectedLeads.length === 0) {
      toast.warning("Please select at least one lead to download.");
      return;
    }

    try {
      // Dynamic import of jsPDF and autotable plugin
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('landscape'); // Set landscape orientation
      
      // Add title
      doc.setFontSize(18);
      doc.text('Lead Report', 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
      
      // Get selected leads data
      const selectedLeadsData = data.filter(lead => selectedLeads.includes(lead._id));
      
      // Prepare table data
      const tableData = selectedLeadsData.map(lead => {
        const latestRemark = lead.remarks && lead.remarks.length > 0 
          ? lead.remarks[lead.remarks.length - 1].remark 
          : "No remarks";
        
        return [
          lead.fullName,
          formatDate(lead.createdAt),
          lead.phone1,
          lead.contactPoint || "N/A",
          lead.campaign || "N/A",
          getLeadStatusLabel(lead.leadStatus),
          latestRemark.substring(0, 30) + (latestRemark.length > 30 ? '...' : ''),
          formatDate(lead.followUpDate)
        ];
      });
      
      // Add table using autoTable
      autoTable(doc, {
        head: [['Name', 'Date Added', 'Mobile', 'Contact Point', 'Campaign', 'Lead Status', 'Latest Remark', 'Follow-up']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [70, 95, 255], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 35 },
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      doc.save(`leads-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success(`PDF downloaded with ${selectedLeads.length} lead(s)!`);
      setSelectedLeads([]); // Clear selection after download
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get lead status label from value
  const getLeadStatusLabel = (value) => {
    if (!value) return "New Lead";
    const option = leadStatusOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleCampaignChange = (value) => {
    if (value === "__add_new__") {
      openCampaignModal();
    } else {
      setCampaign(value);
    }
  };

  const createNewCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast.error("Campaign name is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/campaigns/create`,
        { 
          name: newCampaignName, 
          description: newCampaignDesc,
          discountPercentage: newCampaignDiscount ? parseFloat(newCampaignDiscount) : 0,
          cashback: newCampaignCashback ? parseFloat(newCampaignCashback) : 0,
          isActive: newCampaignActive
        },
        { withCredentials: true }
      );
      
      toast.success("Campaign created successfully!");
      
      // Set the newly created campaign as selected
      setCampaign(response.data.campaign.value);
      
      // Refresh campaigns list
      await fetchCampaigns();
      
      // Close modal and reset fields
      closeCampaignModal();
      setNewCampaignName("");
      setNewCampaignDesc("");
      setNewCampaignDiscount("");
      setNewCampaignCashback("");
      setNewCampaignActive(true);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error(error.response?.data?.message || "Failed to create campaign");
    }
  };

  // ====== Button Handlers ======
  const handleEdit = (row) => {
    setSelectedRow(row);
    setEditName(row.fullName);
    setEditPhone(row.phone1);
    setEditEmail(row.email);
    setEditStatus(row.status);
    setEditFollowUp(row.followUpDate ? new Date(row.followUpDate).toISOString().split("T")[0] : "");
    
    // Populate all fields from row to match dropdown option values
    setFullName(row.fullName);
    setEmail(row.email);
    setPhone1(row.phone1);
    setPhone2(row.phone2 || "");
    setGender(row.gender || "");
    setDob(row.dob ? new Date(row.dob).toISOString().split("T")[0] : "");
    setPlace(row.place || "");
    setOtherPlace(row.otherPlace || "");
    setStatus(row.status || "");
    setEducation(row.education || "");
    setContactPoint(row.contactPoint || "");
    setOtherContactPoint(row.otherContactPoint || "");
    setCampaign(row.campaign || "");
    setHandledByPerson(row.handledBy || "");
    setFollowUpDate(row.followUpDate ? new Date(row.followUpDate).toISOString().split("T")[0] : "");
    setRemarks("");
    setLeadStatus(row.leadStatus || "");
    
    // Map coursePreference from database to match courseOptions format
    const mappedCourses = row.coursePreference?.map(courseName => {
      // Find matching option in courseOptions
      const matchedOption = courseOptions.find(opt => 
        opt.value === courseName || opt.text === courseName
      );
      return matchedOption || { value: courseName, text: courseName };
    }) || [];
    
    setSelectedValues(mappedCourses);
    
    openEditModal();
  };

  const handleDelete = (row) => {
    setSelectedRow(row);
    openDeleteModal();
  };

  const handleAlarm = (row) => {
    setSelectedRow(row);
    openAlarmModal();
  };

  const saveChanges = async () => {
    try {
      // Check if there's a new remark to add
      if (remarks.trim()) {
        const remarkPayload = {
          remark: remarks,
          handledBy: user?.fullName || "Unknown",
          nextFollowUpDate: followUpDate || null,
          leadStatus: leadStatus || "new"
        };
        
        // Add remark via the API endpoint with logged-in user's name and current lead status
        await axios.post(
          `${API}/customers/remark/${selectedRow._id}`,
          remarkPayload,
          { withCredentials: true }
        );
      }

      // Update the lead details
      const updatePayload = {
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
        handledBy: user?.fullName || handledByPerson,
        followUpDate,
        leadStatus,
        coursePreference: selectedValues.map(item => item.value)
      };
      
      const response = await axios.put(
        `${API}/customers/update/${selectedRow._id}`,
        updatePayload,
        { withCredentials: true }
      );
      
      // Refresh data to show updates instantly in the table
      await fetchCustomers();
      
      // Update selectedRow with the latest data from the response to refresh history stack
      if (response.data.customer) {
        setSelectedRow(response.data.customer);
      }
      
      // Clear remarks field after successful update
      setRemarks("");
      
      // Add notification
      addNotification({
        type: 'lead_updated',
        userName: user?.fullName || 'Someone',
        action: 'updated lead',
        entityName: fullName,
        module: 'Lead Management',
      });
      
      // Show success toast notification
      toast.success("Lead updated successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `${API}/customers/delete/${selectedRow._id}`,
        { withCredentials: true }
      );
      
      setData((prev) => prev.filter((item) => item._id !== selectedRow._id));
      closeDeleteModal();
      resetModal();
      
      // Add notification
      addNotification({
        type: 'lead_deleted',
        userName: user?.fullName || 'Someone',
        action: 'deleted lead',
        entityName: selectedRow.fullName,
        module: 'Lead Management',
      });
      
      toast.success("Lead deleted successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const setReminder = () => {
    if (!selectedRow?.followUpDate) {
      toast.error("No follow-up date set for this lead.");
      closeAlarmModal();
      return;
    }

    try {
      // Create calendar event
      const followUpDate = new Date(selectedRow.followUpDate);
      const formattedDate = followUpDate.toISOString().split("T")[0];
      
      // Add event to in-app calendar
      addEvent({
        title: `Follow-up: ${selectedRow.fullName}`,
        start: formattedDate,
        end: formattedDate,
        allDay: true,
        extendedProps: {
          calendar: "Warning",
          leadId: selectedRow._id,
          phone: selectedRow.phone1,
          email: selectedRow.email,
          status: selectedRow.status,
        },
      });
      
      toast.success(`Calendar reminder added for ${selectedRow.fullName}!`);
      closeAlarmModal();
      resetModal();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast.error('Failed to create calendar event.');
    }
  };

  const resetModal = () => {
    setSelectedRow(null);
    setEditName("");
    setEditPhone("");
    setEditEmail("");
    setEditStatus("");
    setEditFollowUp("");
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

          {/* New: Sort by Status */}
          <Select
            className="w-full md:w-1/4"
            options={statusOptions}
            value={statusFilter}
            placeholder="Sort by status"
            onChange={(value) => setStatusFilter(value)}
          />

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
                <TableCell colSpan={10} className="py-8 text-center text-gray-500">
                  No leads found. Create your first lead!
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => {
                const latestRemark = row.remarks && row.remarks.length > 0 
                  ? row.remarks[row.remarks.length - 1].remark 
                  : "No remarks yet";
                
                const getLeadStatusColor = (status) => {
                  if (status === 'converted' || status === 'qualified') return "success";
                  if (status === 'negotiation' || status === 'contacted') return "info";
                  if (status === 'callBackLater' || status === 'new') return "warning";
                  if (status === 'lost' || status === 'notInterested') return "error";
                  return "light";
                };
                
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
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{row.fullName}</p>
                        <p className="text-gray-400 text-xs">{row.coursePreference?.join(", ") || "N/A"}</p>
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
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <p className="text-xs max-w-[200px] truncate">{latestRemark}</p>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.followUpDate)}</TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Button size="sm" variant="outline" className="mr-2" endIcon={<PencilIcon className="size-5" />} onClick={() => handleEdit(row)} />
                    <Button size="sm" variant="outline" className="text-red-500 mr-2" endIcon={<CloseIcon className="size-5" />} onClick={() => handleDelete(row)} />
                    <Button size="sm" variant="outline" className="text-yellow-500" endIcon={<BellIcon className="size-5" />} onClick={() => handleAlarm(row)} />
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
                    />
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
                    />
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
                    />
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
                    />
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
                  <div className="w-full md:w-3/4">
                    <MultiSelect
                      label="Course Preference"
                      options={courseOptions}
                      selectedValues={selectedValues}
                      onChange={setSelectedValues}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <Label>Campaign</Label>
                    <Select
                      options={campaignOptions}
                      value={campaign}
                      placeholder="Campaigns"
                      onChange={handleCampaignChange}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full md:w-1/2">
                    <Label>Lead Status</Label>
                    <Select
                      options={leadStatusOptions}
                      value={leadStatus}
                      placeholder="Select Lead Status"
                      onChange={setLeadStatus}
                    />
                  </div>
                  <div className="w-full md:w-1/2">
                    <DatePicker
                      id="followupDate"
                      label="Next Follow Up Date"
                      placeholder="Select a date"
                      value={followUpDate}
                      onChange={(date, str) => setFollowUpDate(str)}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-stretch">
                  <div className="w-full">
                    <Label htmlFor="remarks">Remarks</Label>
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
                      name={remark.handledBy || "Unknown"}
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
            <Button onClick={createNewCampaign}>
              Create Campaign
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