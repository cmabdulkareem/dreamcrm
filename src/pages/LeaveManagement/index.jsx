import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import PageBreadCrumb from '../../components/common/PageBreadCrumb';
import InputField from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import Select from '../../components/form/Select';

import { hasRole } from '../../utils/roleHelpers';
import API from "../../config/api";

const LeaveManagement = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentLeaveId, setCurrentLeaveId] = useState(null);
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'pending'
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch all leave requests
  const fetchLeaves = async () => {
    // Only Owner, HR, Manager can view all leaves
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR') || hasRole(user, 'Manager'))) {
      // If user is not authorized, maybe they shouldn't even be here, or we show empty.
      // But since this component handles both "Manage" and "Requests" (legacy), we should be careful.
      // Actually, "Requests" route seems to be the public one? No, earlier I saw it uses this component for authenticated apply?
      // Wait, "Apply Leave" is a separate component now. "My Leaves" is separate.
      // So this component `LeaveManagement` is ONLY for "Manage Leaves" (Admin view) based on my previous refactor plan.
      // Let's verify routes in App.jsx.
      // Yes: <Route index element={<LeaveManagement />} /> handles "Manage Leaves".
      // So we can enforce strict check.
      // However, isAdmin might be true for some roles. Let's trust role check.

      // If not authorized, don't fetch.
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API}/leaves`, {
        withCredentials: true,
        timeout: 10000
      });

      if (response.data && response.data.leaves) {
        setLeaves(response.data.leaves);
      } else if (response.data && Array.isArray(response.data)) {
        setLeaves(response.data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);

      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else if (error.response.status === 403) {
          toast.error('Access denied. Admin privileges required.');
        } else {
          toast.error(error.response.data?.message || 'Failed to fetch leaves');
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error. Please check your connection.');
      } else {
        // Something else happened
        toast.error('Failed to fetch leaves. Please try again.');
      }

      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      employeeName: '',
      employeeId: '',
      leaveType: 'casual',
      startDate: '',
      endDate: '',
      reason: '',
      status: 'pending'
    });
  };

  // Fetch single leave for editing
  const fetchLeaveForEdit = async (leaveId) => {
    try {
      const response = await axios.get(`${API}/leaves/${leaveId}`, {
        withCredentials: true,
        timeout: 10000
      });

      const leave = response.data?.leave || response.data;

      if (!leave) {
        toast.error('Leave not found');
        return;
      }

      setFormData({
        employeeName: leave.employeeName || '',
        employeeId: leave.employeeId || '',
        leaveType: leave.leaveType || 'casual',
        startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
        endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
        reason: leave.reason || '',
        status: leave.status || 'pending'
      });

      setCurrentLeaveId(leaveId);
      setShowEditForm(true);
    } catch (error) {
      console.error('Error fetching leave for edit:', error);

      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Leave not found');
        } else if (error.response.status === 401) {
          toast.error('Authentication required');
        } else {
          toast.error(error.response.data?.message || 'Failed to load leave details');
        }
      } else {
        toast.error('Failed to load leave details. Please try again.');
      }
    }
  };

  // Handle edit leave
  const handleEditLeave = (leaveId) => {
    fetchLeaveForEdit(leaveId);
  };

  // Create new leave request
  const handleCreateLeave = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.employeeName || !formData.employeeId || !formData.leaveType ||
      !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    if (startDate < today) {
      toast.error('Start date cannot be in the past');
      return;
    }

    try {
      const leaveData = {
        employeeName: formData.employeeName.trim(),
        employeeId: formData.employeeId.trim(),
        leaveType: formData.leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: formData.reason.trim()
      };

      const response = await axios.post(`${API}/leaves/create`, leaveData, {
        timeout: 10000
      });

      if (response.data && response.data.message) {
        toast.success(response.data.message || 'Leave request submitted successfully!');
      } else {
        toast.success('Leave request submitted successfully!');
      }

      resetForm();

      // Refresh the list if we're on the management page
      if (!location.pathname.includes('/leave-management/requests')) {
        fetchLeaves();
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);

      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message ||
          (error.response.data?.errors ? error.response.data.errors.join(', ') : 'Failed to submit leave request');
        toast.error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error. Please check your connection.');
      } else {
        // Something else happened
        toast.error('Failed to submit leave request. Please try again.');
      }
    }
  };

  // Update leave
  const handleUpdateLeave = async (e) => {
    e.preventDefault();

    // Check if user is authorized (Owner or HR)
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) {
      toast.error('Access denied. Owner or HR privileges required.');
      return;
    }

    // Client-side validation
    if (!formData.employeeName || !formData.employeeId || !formData.leaveType ||
      !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    try {
      const leaveData = {
        employeeName: formData.employeeName.trim(),
        employeeId: formData.employeeId.trim(),
        leaveType: formData.leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: formData.reason.trim(),
        status: formData.status
      };

      await axios.put(`${API}/leaves/update/${currentLeaveId}`, leaveData, {
        withCredentials: true,
        timeout: 10000
      });

      toast.success('Leave updated successfully');
      setShowEditForm(false);
      resetForm();
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave:', error);

      if (error.response) {
        toast.error(error.response.data?.message || 'Failed to update leave');
      } else {
        toast.error('Failed to update leave. Please try again.');
      }
    }
  };

  // Update leave status
  const updateLeaveStatus = async (leaveId, status) => {
    // Check if user is authorized (Owner or HR)
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) {
      toast.error('Access denied. Owner or HR privileges required.');
      return;
    }

    try {
      await axios.patch(`${API}/leaves/status/${leaveId}`, { status }, {
        withCredentials: true,
        timeout: 10000
      });
      toast.success(`Leave ${status} successfully`);
      fetchLeaves();
    } catch (error) {
      console.error(`Error ${status}ing leave:`, error);

      if (error.response) {
        toast.error(error.response.data?.message || `Failed to ${status} leave`);
      } else {
        toast.error(`Failed to ${status} leave. Please try again.`);
      }
    }
  };

  // Delete leave
  const deleteLeave = async (leaveId) => {
    // Check if user is authorized (Owner or HR)
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) {
      toast.error('Access denied. Owner or HR privileges required.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      await axios.delete(`${API}/leaves/delete/${leaveId}`, {
        withCredentials: true,
        timeout: 10000
      });
      toast.success('Leave deleted successfully');
      fetchLeaves();
    } catch (error) {
      console.error('Error deleting leave:', error);

      if (error.response) {
        toast.error(error.response.data?.message || 'Failed to delete leave');
      } else {
        toast.error('Failed to delete leave. Please try again.');
      }
    }
  };

  return (
    <>
      <PageMeta title="Leave Management - CRM" />
      <PageBreadCrumb
        items={[
          { name: 'Dashboard', path: '/' },
          { name: 'Leave Management', path: '/leave-management' },
          { name: location.pathname.includes('/leave-management/requests') ? 'Leave Requests' : 'Manage Leaves' }
        ]}
      />
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />

      {!isAdmin && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Access Limited</p>
          <p>You don't have admin privileges. Some features may be unavailable.</p>
        </div>
      )}

      {location.pathname.includes('/leave-management/requests') ? (
        // Leave Requests Content (Public Portal)
        <ComponentCard title="Request Leave">
          <form onSubmit={handleCreateLeave}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeName">Employee Name *</Label>
                  <InputField
                    type="text"
                    id="employeeName"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <InputField
                    type="text"
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select
                    options={[
                      { value: "casual", label: "Casual Leave" },
                      { value: "sick", label: "Sick Leave" },
                      { value: "annual", label: "Annual Leave" },
                      { value: "maternity", label: "Maternity Leave" },
                      { value: "paternity", label: "Paternity Leave" }
                    ]}
                    value={formData.leaveType}
                    onChange={(value) => handleSelectChange('leaveType', value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <InputField
                    type="text"
                    id="status"
                    name="status"
                    value="pending"
                    readOnly
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <InputField
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <InputField
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason *</Label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800 rounded-lg shadow-theme-xs"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="reset"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </form>
        </ComponentCard>
      ) : (
        // Manage Leaves Content (Admin Panel)
        <>
          {showEditForm && isAdmin ? (
            <ComponentCard title="Edit Leave Request">
              <form onSubmit={handleUpdateLeave}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employeeName">Employee Name *</Label>
                      <InputField
                        type="text"
                        id="employeeName"
                        name="employeeName"
                        value={formData.employeeName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <InputField
                        type="text"
                        id="employeeId"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leaveType">Leave Type *</Label>
                      <Select
                        options={[
                          { value: "casual", label: "Casual Leave" },
                          { value: "sick", label: "Sick Leave" },
                          { value: "annual", label: "Annual Leave" },
                          { value: "maternity", label: "Maternity Leave" },
                          { value: "paternity", label: "Paternity Leave" }
                        ]}
                        value={formData.leaveType}
                        onChange={(value) => handleSelectChange('leaveType', value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        options={[
                          { value: "pending", label: "Pending" },
                          { value: "approved", label: "Approved" },
                          { value: "rejected", label: "Rejected" }
                        ]}
                        value={formData.status}
                        onChange={(value) => handleSelectChange('status', value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <InputField
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <InputField
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reason">Reason *</Label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800 rounded-lg shadow-theme-xs"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                    >
                      Update Leave
                    </button>
                  </div>
                </div>
              </form>
            </ComponentCard>
          ) : (
            <ComponentCard title="Manage Leave Requests">
              <div className="container mx-auto px-4 py-8">
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Loading leave requests...</p>
                  </div>
                ) : leaves.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No leave requests found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Employee</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Leave Type</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dates</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                        {leaves.map((leave) => (
                          <tr key={leave._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{leave.employeeName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">ID: {leave.employeeId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white capitalize">{leave.leaveType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${leave.status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : leave.status === 'rejected'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                }`}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {(hasRole(user, 'Owner') || hasRole(user, 'HR')) && (
                                <>
                                  <button
                                    onClick={() => handleEditLeave(leave._id)}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                                  >
                                    Edit
                                  </button>
                                  {leave.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => updateLeaveStatus(leave._id, 'approved')}
                                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => updateLeaveStatus(leave._id, 'rejected')}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-3"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => deleteLeave(leave._id)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </ComponentCard>
          )}
        </>
      )}
    </>
  );
};

export default LeaveManagement;