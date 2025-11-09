import PageBreadcrumb from "../../components/common/PageBreadCrumb.jsx";
import PageMeta from "../../components/common/PageMeta.jsx";
import { useState, useEffect, useContext } from "react";
import ComponentCard from "../../components/common/ComponentCard.jsx";
import Button from "../../components/ui/button/Button.tsx";
import Label from "../../components/form/Label.tsx";
import Select from "../../components/form/Select.tsx";
import MultiSelect from "../../components/form/MultiSelect.tsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { AuthContext } from "../../context/authContext.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    roles: [{ value: "General", text: "General" }],
    isAdmin: false,
    accountStatus: "Pending"
  });

  const roleOptions = [
    { value: "Admin", text: "Admin" },
    { value: "Manager", text: "Manager" },
    { value: "Counsellor", text: "Counsellor" },
    { value: "Marketing", text: "Marketing" },
    { value: "Finance", text: "Finance" },
    { value: "Placement", text: "Placement" },
    { value: "General", text: "General" }
  ];

  const accountStatusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Active", label: "Active" },
    { value: "Suspended", label: "Suspended" },
    { value: "Deactivated", label: "Deactivated" }
  ];

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/users/allusers`,
        { withCredentials: true }
      );
      
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users. Please try again.");
      setLoading(false);
    }
  };

  const handleAssignRoles = (user) => {
    setSelectedUser(user);
    
    // Convert user roles to the format expected by MultiSelect
    const userRoles = user.roles || ["General"];
    const selectedRoles = userRoles.map(role => ({
      value: role,
      text: roleOptions.find(option => option.value === role)?.text || role
    }));
    
    setFormData({
      roles: selectedRoles,
      isAdmin: user.isAdmin || false,
      accountStatus: user.accountStatus || "Pending"
    });
    setShowModal(true);
  };

  const handleRoleChange = (selectedRoles) => {
    setFormData(prev => ({
      ...prev,
      roles: selectedRoles
    }));
  };

  const handleAdminChange = (e) => {
    setFormData(prev => ({
      ...prev,
      isAdmin: e.target.checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Format the data for the backend
      const payload = {
        roles: formData.roles.map(role => role.value),
        isAdmin: formData.isAdmin,
        accountStatus: formData.accountStatus
      };
      
      const response = await axios.patch(
        `${API}/users/assign-roles/${selectedUser._id}`,
        payload,
        { withCredentials: true }
      );
      
      // Update user in the local state
      setUsers(prev => prev.map(user => 
        user._id === selectedUser._id ? { ...user, ...response.data.user } : user
      ));
      
      toast.success("User roles updated successfully");
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast.error(error.response?.data?.message || "Failed to update user roles. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      roles: [{ value: "General", text: "General" }],
      isAdmin: false,
      accountStatus: "Pending"
    });
    setSelectedUser(null);
    setShowModal(false);
  };

  const getRoleBadgeClass = (role) => {
    const baseClass = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (role) {
      case "Admin":
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100`;
      case "Manager":
        return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100`;
      case "Counsellor":
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100`;
      case "Marketing":
        return `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100`;
      case "Finance":
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100`;
      case "Placement":
        return `${baseClass} bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div>
        <PageMeta
          title="Access Denied | DreamCRM"
          description="Access denied"
        />
        <PageBreadcrumb pageTitle="Access Denied" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
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

      <div className="space-y-6">
        <ComponentCard title="User List">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.avatar ? (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" 
                                  src={user.avatar} 
                                  alt={user.fullName} 
                                  onError={(e) => {
                                    e.target.src = "/images/user/user-01.jpg";
                                  }}
                                />
                              ) : (
                                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs font-bold">
                                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.designation || "General"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.map((role, index) => (
                              <span key={index} className={getRoleBadgeClass(role)}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.isAdmin ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.accountStatus === "Active" 
                              ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                              : user.accountStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                          }`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => handleAssignRoles(user)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Assign Roles
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Assign Roles Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={resetForm}></div>
            
            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:max-w-lg sm:w-full dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Assign Roles - {selectedUser.fullName}
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Roles</Label>
                      <MultiSelect
                        label=""
                        options={roleOptions}
                        selectedValues={formData.roles}
                        onChange={handleRoleChange}
                      />
                    </div>
                    
                    <div>
                      <Label>Account Status</Label>
                      <select
                        value={formData.accountStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountStatus: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-700 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        {accountStatusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
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
                        Admin User
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex justify-center w-full px-4 py-2 sm:ml-3 sm:w-auto"
                  >
                    Assign Roles
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

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
};

export default UserManagement;