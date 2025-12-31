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
    roles: [{ value: "General", label: "General" }],
    isAdmin: false,
    accountStatus: "Pending",
    brands: []
  });

  const roleOptions = [
    { value: "Owner", label: "Owner" },
    { value: "Admin", label: "Admin" },
    { value: "Center Head / Manager", label: "Center Head / Manager" },
    { value: "Academic Coordinator", label: "Academic Coordinator" },
    { value: "Counsellor", label: "Counsellor" },
    { value: "Marketing / Social Media Executive", label: "Marketing / Social Media Executive" },
    { value: "Faculty / Trainers", label: "Faculty / Trainers" },
    { value: "Placement Officer", label: "Placement Officer" },
    { value: "Lab Assistant", label: "Lab Assistant" },
    { value: "CADD Club Support", label: "CADD Club Support" },
    { value: "Accounts Executive", label: "Accounts Executive" },
    { value: "Front Office / Receptionist", label: "Front Office / Receptionist" },
    { value: "IT Support", label: "IT Support" },
    { value: "Event Coordinator", label: "Event Coordinator" },
    { value: "Housekeeping / Office Assistant", label: "Housekeeping / Office Assistant" },
    { value: "PRO", label: "PRO" },
    // Backward compatibility roles
    { value: "Manager", label: "Manager (Legacy)" },
    { value: "Marketing", label: "Marketing (Legacy)" },
    { value: "Finance", label: "Finance (Legacy)" },
    { value: "Placement", label: "Placement (Legacy)" },
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

    let userBrands = [];
    if (user.brands && Array.isArray(user.brands)) {
      if (user.brands.length > 0 && user.brands[0]._id) {
        userBrands = user.brands.map((brand) => brand._id);
      } else {
        userBrands = user.brands;
      }
    }

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
      roles: user.roles || ["General"],
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

    let userBrands = [];
    if (user.brands && Array.isArray(user.brands)) {
      if (user.brands.length > 0 && user.brands[0]._id) {
        userBrands = user.brands.map((brand) => brand._id);
      } else {
        userBrands = user.brands;
      }
    }

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
      roles: user.roles || ["General"],
      isAdmin: user.isAdmin || false,
      accountStatus: user.accountStatus || "Pending",
      brands: userBrands
    });
    setShowModal(true);
  };

  const handleRoleChange = (selectedRoles) => {
    setFormData((prev) => ({
      ...prev,
      roles: selectedRoles
    }));
  };

  const handleBrandChange = (selectedBrands) => {
    setFormData((prev) => ({
      ...prev,
      brands: selectedBrands
    }));
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
        roles: formData.roles,
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
        roles: [{ value: "General", label: "General" }],
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
      roles: ["General"],
      isAdmin: false,
      accountStatus: "Pending",
      brands: []
    });
    setSelectedUser(null);
    setShowModal(false);
  };

  const getBrandNames = (brands) => {
    if (!brands || brands.length === 0) return "No brands assigned";

    if (brands[0] && brands[0]._id) {
      return (
        <div className="flex flex-col gap-1">
          {brands.map((brand, index) => (
            <span key={index} className="text-sm">
              {brand.name}
            </span>
          ))}
        </div>
      );
    }

    return "Brands assigned";
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
                      Roles
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
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
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
                            {user.roles && user.roles.length > 0
                              ? user.roles.join(", ")
                              : "No roles"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getBrandNames(user.brands)}
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

            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {updateMode ? "Update User Details" : "Assign Roles"} -{" "}
                    {selectedUser.fullName}
                  </h3>

                  <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {updateMode ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                fullName: e.target.value
                              }))
                            }
                            placeholder="Enter full name"
                            required
                          />
                        </div>

                        <div>
                          <Label>Email *</Label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value
                              }))
                            }
                            placeholder="Enter email"
                            required
                          />
                        </div>

                        <div>
                          <Label>Phone *</Label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone: e.target.value
                              }))
                            }
                            placeholder="Enter phone number"
                            required
                          />
                        </div>

                        <div>
                          <Label>Employee Code</Label>
                          <Input
                            type="text"
                            value={formData.employeeCode}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                employeeCode: e.target.value
                              }))
                            }
                            placeholder="Enter employee code"
                          />
                        </div>

                        <div>
                          <Label>Department</Label>
                          <Select
                            options={departmentOptions}
                            value={formData.department}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                department: value
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label>Designation</Label>
                          <Input
                            type="text"
                            value={formData.designation}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                designation: e.target.value
                              }))
                            }
                            placeholder="Enter designation"
                          />
                        </div>

                        <div>
                          <Label>Employment Type</Label>
                          <Select
                            options={employmentTypeOptions}
                            value={formData.employmentType}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentType: value
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label>Joining Date</Label>
                          <input
                            type="date"
                            value={formData.joiningDate}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                joiningDate: e.target.value
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <Label>Company</Label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                company: e.target.value
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Roles *</Label>
                          <MultiSelect
                            label=""
                            options={roleOptions}
                            selectedValues={formData.roles}
                            onChange={handleRoleChange}
                          />
                        </div>

                        {isAdmin(currentUser) && (
                          <div className="mt-4">
                            <Label>Assigned Brands *</Label>
                            <MultiSelect
                              label=""
                              options={brands.map((brand) => ({
                                value: brand._id,
                                label: brand.name
                              }))}
                              selectedValues={formData.brands}
                              onChange={handleBrandChange}
                              placeholder="Select brands..."
                            />
                          </div>
                        )}

                        <div>
                          <Label>Account Status</Label>
                          <Select
                            options={accountStatusOptions}
                            value={formData.accountStatus}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                accountStatus: value
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isAdmin"
                            checked={formData.isAdmin}
                            onChange={handleAdminChange}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <Label htmlFor="isAdmin" className="ml-2 mb-0">
                            Is Admin User
                          </Label>
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
