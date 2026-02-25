import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Badge from "../../components/ui/badge/Badge.jsx";
import Button from "../../components/ui/button/Button.jsx";
import Label from "../../components/form/Label.jsx";
import Input from "../../components/form/input/InputField.jsx";
import Select from "../../components/form/Select.jsx";
import MultiSelect from "../../components/form/MultiSelect";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { AuthContext } from "../../context/AuthContext";
import { isAdmin } from "../../utils/roleHelpers";
import {
  User,
  Briefcase,
  Shield,
  Globe,
  Settings,
  CheckCircle,
  Mail,
  Phone,
  Hash,
  Building,
  Calendar,
  Layers,
  Award
} from "lucide-react";

import "react-toastify/dist/ReactToastify.css";

import API from "../../config/api";

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [updateMode, setUpdateMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    employeeCode: "",
    department: "general",
    designation: "General",
    employmentType: "fullTime",
    joiningDate: "",
    company: "",
    isAdmin: false,
    accountStatus: "Pending",
    brands: []
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const filteredUsers = users.filter((user) => {
    // Search term filter
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeCode && user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()));

    // Role filter is now problematic as roles are brand-specific
    // We'll keep the filter UI for now but it might need adjustment
    const matchesRole = true;

    // Status filter
    const matchesStatus = statusFilter === "all" || user.accountStatus === statusFilter;

    // Department filter
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const roleOptions = [
    { value: "Owner", label: "Owner" },
    { value: "Academic Coordinator", label: "Academic Coordinator" },
    { value: "Brand Manager", label: "Brand Manager" },
    { value: "Counsellor", label: "Counsellor" },
    { value: "Marketing / Social Media Executive", label: "Marketing / Social Media Executive" },
    { value: "Instructor", label: "Instructor" },
    { value: "Placement Officer", label: "Placement Officer" },
    { value: "Lab Assistant", label: "Lab Assistant" },
    { value: "CADD Club Support", label: "CADD Club Support" },
    { value: "Accounts Executive", label: "Accounts Executive" },
    { value: "Front Office / Receptionist", label: "Front Office / Receptionist" },
    { value: "IT Support", label: "IT Support" },
    { value: "Event Coordinator", label: "Event Coordinator" },
    { value: "Housekeeping / Office Assistant", label: "Housekeeping / Office Assistant" },
    { value: "PRO", label: "PRO" },
    { value: "General", label: "General" }
  ];

  const accountStatusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Active", label: "Active" },
    { value: "Suspended", label: "Suspended" },
    { value: "Deactivated", label: "Deactivated" }
  ];

  const departmentOptions = [
    { value: "general", label: "General" },
    { value: "managerial", label: "Managerial" },
    { value: "marketing", label: "Marketing" },
    { value: "placement", label: "Placement" },
    { value: "counselling", label: "Counselling" },
    { value: "finance", label: "Finance" },
    { value: "administration", label: "Administration" },
    { value: "it", label: "IT" },
    { value: "interior", label: "Interior" },
    { value: "fashion", label: "Fashion" },
    { value: "graphic", label: "Graphic" },
    { value: "other", label: "Other" }
  ];

  const employmentTypeOptions = [
    { value: "fullTime", label: "Full Time" },
    { value: "partTime", label: "Part Time" },
    { value: "guest", label: "Guest" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "volunteer", label: "Volunteer" },
    { value: "temporary", label: "Temporary" },
    { value: "seasonal", label: "Seasonal" }
  ];

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await axios.get(`${API}/brands`, {
          withCredentials: true
        });
        setBrands(res.data.brands);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    if (showModal && isAdmin(currentUser)) {
      fetchBrands();
    }
  }, [showModal, currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users/allusers`, {
        withCredentials: true
      });

      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users. Please try again.");
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (currentUser.id === user.id) {
      toast.error("You cannot delete your own account.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API}/users/delete/${user.id}`, {
        withCredentials: true
      });

      setUsers((prev) => prev.filter((u) => u.id !== user.id));

      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to delete user. Please try again."
      );
    }
  };

  const handleUpdateUser = (user) => {
    if (!user || !user.id) {
      toast.error("Invalid user data. Cannot update user.");
      return;
    }

    setSelectedUser(user);
    setUpdateMode(true);

    let userBrands = (user.brands || []).map(b => ({
      brand: b.brand?._id || b.brand || b._id || b,
      roles: b.roles || []
    }));

    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      employeeCode: user.employeeCode || "",
      department: user.department || "general",
      designation: user.designation || "General",
      employmentType: user.employmentType || "fullTime",
      joiningDate: user.joiningDate ? user.joiningDate.split("T")[0] : "",
      company: user.company || "",

      isAdmin: user.isAdmin || false,
      accountStatus: user.accountStatus || "Pending",
      brands: userBrands
    });
    setShowModal(true);
  };

  const handleAssignRoles = (user) => {
    if (!user || !user.id) {
      toast.error("Invalid user data. Cannot assign roles.");
      return;
    }

    setSelectedUser(user);
    setUpdateMode(false);

    let userBrands = (user.brands || []).map(b => ({
      brand: b.brand?._id || b.brand || b._id || b,
      roles: b.roles || []
    }));

    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      employeeCode: user.employeeCode || "",
      department: user.department || "general",
      designation: user.designation || "General",
      employmentType: user.employmentType || "fullTime",
      joiningDate: user.joiningDate ? user.joiningDate.split("T")[0] : "",
      company: user.company || "",

      isAdmin: user.isAdmin || false,
      accountStatus: user.accountStatus || "Pending",
      brands: userBrands
    });
    setShowModal(true);
  };


  const handleBrandChange = (selectedBrandIds) => {
    setFormData((prev) => {
      // Keep existing brand roles if they are still selected
      const updatedBrands = selectedBrandIds.map(brandId => {
        const existing = prev.brands.find(b => (b.brand?._id || b.brand || b) === brandId);
        return existing || { brand: brandId, roles: [] };
      });
      return { ...prev, brands: updatedBrands };
    });
  };

  const handleBrandRoleChange = (brandId, selectedRoles) => {
    setFormData((prev) => {
      const updatedBrands = prev.brands.map(b => {
        const bId = b.brand?._id || b.brand || b;
        if (bId === brandId) {
          return { ...b, roles: selectedRoles };
        }
        return b;
      });
      return { ...prev, brands: updatedBrands };
    });
  };

  const handleAdminChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      isAdmin: e.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser || !selectedUser.id) {
      toast.error("Invalid user data. Cannot update user.");
      return;
    }

    try {
      const updateData = {
        isAdmin: formData.isAdmin,
        accountStatus: formData.accountStatus,
        brands: formData.brands
      };

      if (updateMode) {
        Object.assign(updateData, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          employeeCode: formData.employeeCode,
          department: formData.department,
          designation: formData.designation,
          employmentType: formData.employmentType,
          joiningDate: formData.joiningDate,
          company: formData.company
        });
      }

      let response;
      if (updateMode) {
        response = await axios.put(
          `${API}/users/update/${selectedUser.id}`,
          updateData,
          { withCredentials: true }
        );
      } else {
        response = await axios.patch(
          `${API}/users/assign-roles/${selectedUser.id}`,
          updateData,
          { withCredentials: true }
        );
      }

      toast.success(response.data.message || "User updated successfully");

      fetchUsers();

      setShowModal(false);

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        employeeCode: "",
        department: "general",
        designation: "General",
        employmentType: "fullTime",
        joiningDate: "",
        company: "",
        isAdmin: false,
        accountStatus: "Pending",
        brands: []
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update user");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      employeeCode: "",
      department: "general",
      designation: "General",
      employmentType: "fullTime",
      joiningDate: "",
      company: "",
      isAdmin: false,
      accountStatus: "Pending",
      brands: []
    });
    setSelectedUser(null);
    setShowModal(false);
  };

  const getBrandNames = (userBrands) => {
    if (!userBrands || userBrands.length === 0) return "No brands assigned";

    const allBrands = brands; // Reference to the state variable

    return (
      <div className="flex flex-col gap-2">
        {userBrands.map((b, index) => {
          const bId = b.brand?._id || (typeof b.brand === 'string' ? b.brand : b);
          const brandInfo = allBrands.find(brand => brand._id === bId);
          const brandName = b.brand?.name || brandInfo?.name || (typeof bId === 'string' ? `ID: ${bId.substring(0, 8)}...` : "Unknown Brand");

          const roles = b.roles && b.roles.length > 0 ? b.roles.join(", ") : "No roles";
          return (
            <div key={index} className="text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{brandName}:</span>
              <span className="ml-1 text-gray-600 dark:text-gray-400">({roles})</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!currentUser?.isAdmin) {
    return (
      <div>
        <PageMeta title="Access Denied | DreamCRM" description="Access denied" />
        <PageBreadcrumb pageTitle="Access Denied" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Access Denied
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="User Management | DreamCRM"
        description="Manage users and assign roles"
      />
      <PageBreadcrumb pageTitle="User Management" />

      {/* User List Table */}
      <div className="space-y-6">
        <ComponentCard title="User List">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {/* Filters UI */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <Label>Search Users</Label>
                  <Input
                    type="text"
                    placeholder="Search name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select
                    options={[{ value: "all", label: "All Depts" }, ...departmentOptions]}
                    value={departmentFilter}
                    onChange={(val) => setDepartmentFilter(val)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    options={[{ value: "all", label: "All Statuses" }, ...accountStatusOptions]}
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setRoleFilter("all");
                      setDepartmentFilter("all");
                      setStatusFilter("all");
                    }}
                    className="w-full"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Assigned Brands
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Joined Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Account Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No users found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text:white dark:text-white">
                                  {user.fullName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {user.designation || "No designation"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getBrandNames(user.brands)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.createdAt ? new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              size="sm"
                              color={
                                user.accountStatus === "Active"
                                  ? "success"
                                  : user.accountStatus === "Pending"
                                    ? "warning"
                                    : "error"
                              }
                            >
                              {user.accountStatus}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUpdateUser(user)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleAssignRoles(user)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              Assign Roles
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Assign Roles / Update Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={resetForm}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-4xl sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {updateMode ? "Update User Details" : "Assign Roles"} -{" "}
                    {selectedUser.fullName}
                  </h3>

                  <div className="mt-6 space-y-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                    {/* section: General Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <User size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">General Information</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <User size={14} className="text-gray-400" /> Full Name *
                          </Label>
                          <Input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            placeholder="e.g. John Doe"
                            required
                            className="bg-gray-50/30 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Mail size={14} className="text-gray-400" /> Email Address *
                          </Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@example.com"
                            required
                            className="bg-gray-50/30 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Phone size={14} className="text-gray-400" /> Phone Number *
                          </Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+91 00000 00000"
                            required
                            className="bg-gray-50/30 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Hash size={14} className="text-gray-400" /> Employee Code
                          </Label>
                          <Input
                            type="text"
                            value={formData.employeeCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, employeeCode: e.target.value }))}
                            placeholder="EMP-123"
                            className="bg-gray-50/30 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: Employment Details */}
                    {updateMode && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                          <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Briefcase size={18} />
                          </div>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Employment Details</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
                              <Building size={12} /> Department
                            </Label>
                            <Select
                              options={departmentOptions}
                              value={formData.department}
                              onChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                              className="bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
                              <Award size={12} /> Designation
                            </Label>
                            <Input
                              type="text"
                              value={formData.designation}
                              onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                              placeholder="e.g. Senior Manager"
                              className="bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
                              <Layers size={12} /> Employment Type
                            </Label>
                            <Select
                              options={employmentTypeOptions}
                              value={formData.employmentType}
                              onChange={(value) => setFormData(prev => ({ ...prev, employmentType: value }))}
                              className="bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
                              <Calendar size={12} /> Joining Date
                            </Label>
                            <input
                              type="date"
                              value={formData.joiningDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                              className="w-full rounded-lg border border-gray-300 bg-gray-50/50 py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase">
                              <Globe size={12} /> Company
                            </Label>
                            <Input
                              type="text"
                              value={formData.company}
                              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                              placeholder="Company name"
                              className="bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section: Roles & Access */}
                    {!updateMode && (
                      <div className="space-y-5 pt-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                          <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <Shield size={18} />
                          </div>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Access & Roles</h4>
                        </div>

                        {isAdmin(currentUser) && (
                          <div className="space-y-5">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Assigned Brands *</Label>
                              <MultiSelect
                                label=""
                                options={brands.map((brand) => ({
                                  value: brand._id,
                                  label: brand.name
                                }))}
                                selectedValues={formData.brands.map(b => b.brand?._id || b.brand || b)}
                                onChange={handleBrandChange}
                                placeholder="Select brands..."
                              />
                            </div>

                            {formData.brands.length > 0 && (
                              <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-gray-800/50 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Brand Specific Roles</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {formData.brands.map((b) => {
                                    const bId = b.brand?._id || b.brand || b;
                                    const brandInfo = brands.find(brand => brand._id === bId);
                                    if (!brandInfo) return null;

                                    return (
                                      <div key={bId} className="group relative flex flex-col bg-white dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800/60 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 dark:border-gray-800">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-tighter overflow-hidden">
                                              {brandInfo.name.substring(0, 2)}
                                            </div>
                                            <Label className="text-[12px] font-bold text-gray-800 dark:text-gray-200 leading-none mb-0">{brandInfo.name}</Label>
                                          </div>
                                          {b.roles?.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold">Active</span>
                                          )}
                                        </div>
                                        <div className="relative">
                                          <MultiSelect
                                            options={roleOptions}
                                            selectedValues={b.roles || []}
                                            onChange={(roles) => handleBrandRoleChange(bId, roles)}
                                          />
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {b.roles?.map(role => (
                                              <span key={role} className="text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap">
                                                {role}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-tight">Account Status</Label>
                            <Select
                              options={accountStatusOptions}
                              value={formData.accountStatus}
                              onChange={(value) => setFormData(prev => ({ ...prev, accountStatus: value }))}
                              className="bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                            />
                          </div>

                          <div className="flex items-center space-x-3 bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-100/50 transition-colors cursor-pointer group"
                            onClick={() => handleAdminChange({ target: { checked: !formData.isAdmin } })}>
                            <div className={`flex items-center justify-center p-2 rounded-md ${formData.isAdmin ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 group-hover:text-gray-500'} transition-all`}>
                              <Shield size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">System Admin</span>
                              <span className="text-[10px] text-gray-500 mt-1">Full system-wide access</span>
                            </div>
                            <div className="ml-auto">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.isAdmin ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                {formData.isAdmin && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                  >
                    {updateMode ? "Update User" : "Assign Roles"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        className="!z-[999999]"
        style={{ zIndex: 999999 }}
      />
    </div>
  );
};

export default UserManagement;
