import { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import RangeDatePicker from "../../components/form/RangeDatePicker";
import Select from "../../components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import { DownloadIcon, ChevronDownIcon, ChevronUpIcon, ShootingStarIcon } from "../../icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";
import API from "../../config/api";
import { leadStatusOptions, leadPotentialOptions, callListStatusOptions } from "../../data/DataSets";
import { formatDate } from "../../components/leadManagement/leadHelpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function Reports() {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("leads");
    const [showFilters, setShowFilters] = useState(true);

    // Lead Report States
    const [leadDateRange, setLeadDateRange] = useState([]);
    const [leadStatusFilter, setLeadStatusFilter] = useState("");
    const [leadPotentialFilter, setLeadPotentialFilter] = useState("");
    const [campaignFilter, setCampaignFilter] = useState("");
    const [leads, setLeads] = useState([]);
    const [leadsLoading, setLeadsLoading] = useState(false);

    // Cold Call Report States
    const [callDateRange, setCallDateRange] = useState([]);
    const [callStatusFilter, setCallStatusFilter] = useState("");
    const [assignedUserFilter, setAssignedUserFilter] = useState("");
    const [callLists, setCallLists] = useState([]);
    const [callsLoading, setCallsLoading] = useState(false);

    // Options
    const [campaignOptions, setCampaignOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);

    useEffect(() => {
        fetchCampaigns();
        fetchUsers();
        if (activeTab === "leads") {
            fetchLeads();
        } else {
            fetchCallLists();
        }
    }, [activeTab]);

    const fetchCampaigns = async () => {
        try {
            const response = await axios.get(`${API}/campaigns/active`, { withCredentials: true });
            const options = [
                { value: "", label: "All Campaigns" },
                ...response.data.campaigns.map(c => ({ value: c.value, label: c.name }))
            ];
            setCampaignOptions(options);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API}/users/dropdown`, { withCredentials: true });
            const options = [
                { value: "", label: "All Users" },
                ...response.data.users.map(u => ({ value: u._id, label: u.fullName }))
            ];
            setUserOptions(options);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchLeads = async () => {
        setLeadsLoading(true);
        try {
            const response = await axios.get(`${API}/customers/all`, { withCredentials: true });
            setLeads(response.data.customers);
        } catch (error) {
            console.error("Error fetching leads:", error);
            toast.error("Failed to fetch leads");
        } finally {
            setLeadsLoading(false);
        }
    };

    const fetchCallLists = async () => {
        setCallsLoading(true);
        try {
            const response = await axios.get(`${API}/call-lists`, { withCredentials: true });
            setCallLists(response.data.callLists);
        } catch (error) {
            console.error("Error fetching call lists:", error);
            toast.error("Failed to fetch call lists");
        } finally {
            setCallsLoading(false);
        }
    };

    // Filter leads
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            // Date range filter
            if (leadDateRange && leadDateRange.length === 2) {
                const createdAt = new Date(lead.createdAt);
                const [start, end] = leadDateRange;
                if (createdAt < start || createdAt > end) return false;
            }

            // Status filter
            if (leadStatusFilter && lead.leadStatus !== leadStatusFilter) return false;

            // Potential filter
            if (leadPotentialFilter && lead.leadPotential !== leadPotentialFilter) return false;

            // Campaign filter
            if (campaignFilter && lead.campaign !== campaignFilter) return false;

            return true;
        });
    }, [leads, leadDateRange, leadStatusFilter, leadPotentialFilter, campaignFilter]);

    // Filter call lists
    const filteredCallLists = useMemo(() => {
        return callLists.filter(call => {
            // Date range filter
            if (callDateRange && callDateRange.length === 2) {
                const createdAt = new Date(call.createdAt);
                const [start, end] = callDateRange;
                if (createdAt < start || createdAt > end) return false;
            }

            // Status filter
            if (callStatusFilter && call.status !== callStatusFilter) return false;

            // Assigned user filter
            if (assignedUserFilter) {
                const assignedId = call.assignedTo?._id || call.assignedTo;
                if (assignedId !== assignedUserFilter) return false;
            }

            return true;
        });
    }, [callLists, callDateRange, callStatusFilter, assignedUserFilter]);

    // Lead statistics
    const leadStats = useMemo(() => {
        const total = filteredLeads.length;
        const converted = filteredLeads.filter(l => l.leadStatus === "converted").length;
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(2) : 0;

        return { total, converted, conversionRate };
    }, [filteredLeads]);

    // Call list statistics
    const callStats = useMemo(() => {
        const total = filteredCallLists.length;
        const completed = filteredCallLists.filter(c =>
            c.status && !["pending", "no-answer", "busy", "switched-off"].includes(c.status)
        ).length;
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(2) : 0;

        return { total, completed, completionRate };
    }, [filteredCallLists]);

    // Export to CSV
    const exportToCSV = () => {
        const data = activeTab === "leads" ? filteredLeads : filteredCallLists;

        let csvData;
        if (activeTab === "leads") {
            csvData = data.map(lead => ({
                "Full Name": lead.fullName,
                "Email": lead.email || "N/A",
                "Phone": lead.phone1,
                "Lead Status": lead.leadStatus,
                "Lead Potential": lead.leadPotential,
                "Campaign": lead.campaign || "N/A",
                "Contact Point": lead.contactPoint || "N/A",
                "Created Date": formatDate(lead.createdAt),
                "Follow-up Date": lead.followUpDate ? formatDate(lead.followUpDate) : "N/A"
            }));
        } else {
            csvData = data.map(call => ({
                "Full Name": call.fullName,
                "Phone": call.phone,
                "Status": call.status || "Pending",
                "Assigned To": call.assignedTo?.fullName || "Unassigned",
                "Remarks": call.remarks || "N/A",
                "Created Date": formatDate(call.createdAt)
            }));
        }

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Report exported successfully!");
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        const data = activeTab === "leads" ? filteredLeads : filteredCallLists;

        // Add title
        doc.setFontSize(18);
        doc.text(`${activeTab === "leads" ? "Lead" : "Cold Call"} Report`, 14, 22);

        // Add date
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

        // Add statistics
        if (activeTab === "leads") {
            doc.text(`Total Leads: ${leadStats.total}`, 14, 38);
            doc.text(`Converted: ${leadStats.converted}`, 14, 44);
            doc.text(`Conversion Rate: ${leadStats.conversionRate}%`, 14, 50);
        } else {
            doc.text(`Total Calls: ${callStats.total}`, 14, 38);
            doc.text(`Completed: ${callStats.completed}`, 14, 44);
            doc.text(`Completion Rate: ${callStats.completionRate}%`, 14, 50);
        }

        // Prepare table data
        let tableData;
        let headers;

        if (activeTab === "leads") {
            headers = [["Name", "Phone", "Status", "Potential", "Campaign", "Created"]];
            tableData = data.map(lead => [
                lead.fullName,
                lead.phone1,
                lead.leadStatus,
                lead.leadPotential || "N/A",
                lead.campaign || "N/A",
                formatDate(lead.createdAt)
            ]);
        } else {
            headers = [["Name", "Phone", "Status", "Assigned To", "Created"]];
            tableData = data.map(call => [
                call.fullName,
                call.phone,
                call.status || "Pending",
                call.assignedTo?.fullName || "Unassigned",
                formatDate(call.createdAt)
            ]);
        }

        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 60,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        doc.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success("PDF exported successfully!");
    };

    return (
        <div>
            <PageMeta title="Reports | DreamCRM" description="Generate reports for leads and cold call lists" />

            {/* Breadcrumb with Share Idea Button */}
            <div className="flex items-center justify-between mb-6">
                <PageBreadcrumb pageTitle="Reports" />
                <Link to="/support-dashboard">
                    <Button
                        size="sm"
                        variant="primary"
                        startIcon={<ShootingStarIcon className="size-4" />}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        Share Idea
                    </Button>
                </Link>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("leads")}
                        className={`pb-3 px-4 font-medium transition-colors ${activeTab === "leads"
                            ? "text-brand-500 border-b-2 border-brand-500"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Lead Reports
                    </button>
                    <button
                        onClick={() => setActiveTab("calls")}
                        className={`pb-3 px-4 font-medium transition-colors ${activeTab === "calls"
                            ? "text-brand-500 border-b-2 border-brand-500"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        Cold Call Reports
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {activeTab === "leads" ? (
                    <>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Leads</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{leadStats.total}</p>
                        </div>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Converted</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{leadStats.converted}</p>
                        </div>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</p>
                            <p className="text-3xl font-bold text-brand-500 mt-2">{leadStats.conversionRate}%</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Calls</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{callStats.total}</p>
                        </div>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{callStats.completed}</p>
                        </div>
                        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                            <p className="text-3xl font-bold text-brand-500 mt-2">{callStats.completionRate}%</p>
                        </div>
                    </>
                )}
            </div>

            <ComponentCard
                title={activeTab === "leads" ? "Lead Report" : "Cold Call Report"}
                headerAction={
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            endIcon={showFilters ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                        >
                            {showFilters ? "Hide" : "Show"} Filters
                        </Button>
                        <Button size="sm" variant="outline" onClick={exportToCSV} endIcon={<DownloadIcon className="size-4" />}>
                            Export CSV
                        </Button>
                        <Button size="sm" variant="primary" onClick={exportToPDF} endIcon={<DownloadIcon className="size-4" />}>
                            Export PDF
                        </Button>
                    </div>
                }
            >
                {/* Filters */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                        {activeTab === "leads" ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Date Range</Label>
                                    <RangeDatePicker
                                        value={leadDateRange}
                                        onChange={setLeadDateRange}
                                        placeholder="Select date range"
                                    />
                                </div>
                                <div>
                                    <Label>Lead Status</Label>
                                    <Select
                                        options={[{ value: "", label: "All Statuses" }, ...leadStatusOptions]}
                                        value={leadStatusFilter}
                                        onChange={setLeadStatusFilter}
                                        placeholder="Select status"
                                    />
                                </div>
                                <div>
                                    <Label>Lead Potential</Label>
                                    <Select
                                        options={[{ value: "", label: "All Potentials" }, ...leadPotentialOptions]}
                                        value={leadPotentialFilter}
                                        onChange={setLeadPotentialFilter}
                                        placeholder="Select potential"
                                    />
                                </div>
                                <div>
                                    <Label>Campaign</Label>
                                    <Select
                                        options={campaignOptions}
                                        value={campaignFilter}
                                        onChange={setCampaignFilter}
                                        placeholder="Select campaign"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Date Range</Label>
                                    <RangeDatePicker
                                        value={callDateRange}
                                        onChange={setCallDateRange}
                                        placeholder="Select date range"
                                    />
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Select
                                        options={[{ value: "", label: "All Statuses" }, ...callListStatusOptions]}
                                        value={callStatusFilter}
                                        onChange={setCallStatusFilter}
                                        placeholder="Select status"
                                    />
                                </div>
                                <div>
                                    <Label>Assigned To</Label>
                                    <Select
                                        options={userOptions}
                                        value={assignedUserFilter}
                                        onChange={setAssignedUserFilter}
                                        placeholder="Select user"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Data Table */}
                <div className="max-w-full overflow-x-auto">
                    {activeTab === "leads" ? (
                        leadsLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                    <TableRow>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Name</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Phone</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Status</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Potential</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Campaign</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Created</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                                                No leads found matching the filters
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLeads.map(lead => (
                                            <TableRow key={lead._id}>
                                                <TableCell className="py-3">{lead.fullName}</TableCell>
                                                <TableCell className="py-3">{lead.phone1}</TableCell>
                                                <TableCell className="py-3">
                                                    <Badge size="sm" color="primary">{lead.leadStatus}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3">{lead.leadPotential || "N/A"}</TableCell>
                                                <TableCell className="py-3">{lead.campaign || "N/A"}</TableCell>
                                                <TableCell className="py-3">{formatDate(lead.createdAt)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )
                    ) : (
                        callsLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                    <TableRow>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Name</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Phone</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Status</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Assigned To</TableCell>
                                        <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs">Created</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredCallLists.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                                                No call lists found matching the filters
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCallLists.map(call => (
                                            <TableRow key={call._id}>
                                                <TableCell className="py-3">{call.fullName}</TableCell>
                                                <TableCell className="py-3">{call.phone}</TableCell>
                                                <TableCell className="py-3">
                                                    <Badge size="sm" color="light">{call.status || "Pending"}</Badge>
                                                </TableCell>
                                                <TableCell className="py-3">{call.assignedTo?.fullName || "Unassigned"}</TableCell>
                                                <TableCell className="py-3">{formatDate(call.createdAt)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )
                    )}
                </div>
            </ComponentCard>

            <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
    );
}
