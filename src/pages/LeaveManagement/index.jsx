import React, { useState, useEffect, useContext, useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../components/ui/table';
import { PencilIcon, TrashBinIcon, CheckIcon, CloseIcon } from '../../icons';

import { hasRole } from '../../utils/roleHelpers';
import API from "../../config/api";

const LeaveManagement = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const location = useLocation();

  const isPortal = location.pathname.includes('/leave-management/requests');

  // Derived stats
  const stats = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter(l => l.status === 'pending').length;
    const approved = leaves.filter(l => l.status === 'approved').length;
    const rejected = leaves.filter(l => l.status === 'rejected').length;
    return [
      { label: 'Total', count: total, color: '#64748B' },
      { label: 'Pending', count: pending, color: '#F59E0B' },
      { label: 'Approved', count: approved, color: '#10B981' },
      { label: 'Rejected', count: rejected, color: '#EF4444' },
    ];
  }, [leaves]);

  const fetchLeaves = async () => {
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/leaves`, { withCredentials: true, timeout: 10000 });
      if (response.data && response.data.leaves) {
        setLeaves(response.data.leaves);
      } else if (response.data && Array.isArray(response.data)) {
        setLeaves(response.data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      if (error.response?.status === 401) toast.error('Authentication required. Please log in again.');
      else if (error.response?.status === 403) toast.error('Access denied. Admin privileges required.');
      else toast.error(error.response?.data?.message || 'Failed to fetch leaves');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ employeeName: '', employeeId: '', leaveType: 'casual', startDate: '', endDate: '', reason: '', status: 'pending' });
  };

  const fetchLeaveForEdit = async (leaveId) => {
    try {
      const response = await axios.get(`${API}/leaves/${leaveId}`, { withCredentials: true, timeout: 10000 });
      const leave = response.data?.leave || response.data;
      if (!leave) { toast.error('Leave not found'); return; }
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
      toast.error(error.response?.data?.message || 'Failed to load leave details');
    }
  };

  const handleEditLeave = (leaveId) => fetchLeaveForEdit(leaveId);

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!formData.employeeName || !formData.employeeId || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields'); return;
    }
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (startDate > endDate) { toast.error('Start date cannot be after end date'); return; }
    if (startDate < today) { toast.error('Start date cannot be in the past'); return; }
    try {
      const leaveData = {
        employeeName: formData.employeeName.trim(),
        employeeId: formData.employeeId.trim(),
        leaveType: formData.leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: formData.reason.trim()
      };
      const response = await axios.post(`${API}/leaves/create`, leaveData, { timeout: 10000 });
      toast.success(response.data?.message || 'Leave request submitted successfully!');
      resetForm();
      if (!isPortal) fetchLeaves();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      const msg = error.response?.data?.message || (error.response?.data?.errors ? error.response.data.errors.join(', ') : 'Failed to submit leave request');
      if (error.request && !error.response) toast.error('Network error. Please check your connection.');
      else toast.error(msg);
    }
  };

  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) { toast.error('Access denied.'); return; }
    if (!formData.employeeName || !formData.employeeId || !formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields'); return;
    }
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate > endDate) { toast.error('Start date cannot be after end date'); return; }
    try {
      await axios.put(`${API}/leaves/update/${currentLeaveId}`, {
        employeeName: formData.employeeName.trim(),
        employeeId: formData.employeeId.trim(),
        leaveType: formData.leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: formData.reason.trim(),
        status: formData.status
      }, { withCredentials: true, timeout: 10000 });
      toast.success('Leave updated successfully');
      setShowEditForm(false);
      resetForm();
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave:', error);
      toast.error(error.response?.data?.message || 'Failed to update leave');
    }
  };

  const updateLeaveStatus = async (leaveId, status) => {
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) { toast.error('Access denied.'); return; }
    try {
      await axios.patch(`${API}/leaves/status/${leaveId}`, { status }, { withCredentials: true, timeout: 10000 });
      toast.success(`Leave ${status} successfully`);
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${status} leave`);
    }
  };

  const deleteLeave = async (leaveId) => {
    if (!(hasRole(user, 'Owner') || hasRole(user, 'HR'))) { toast.error('Access denied.'); return; }
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await axios.delete(`${API}/leaves/delete/${leaveId}`, { withCredentials: true, timeout: 10000 });
      toast.success('Leave deleted successfully');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete leave');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      approved: { color: '#10B981', label: 'Approved' },
      rejected: { color: '#EF4444', label: 'Rejected' },
      pending: { color: '#F59E0B', label: 'Pending' }
    };
    const s = config[status] || config.pending;
    return (
      <span
        className="px-2.5 py-1.5 rounded-full text-[12px] font-bold tracking-tight inline-flex items-center gap-1.5 shadow-sm"
        style={{ backgroundColor: `${s.color}15`, color: s.color, border: `1px solid ${s.color}40` }}
      >
        <span className="size-1.5 rounded-full shadow-sm" style={{ backgroundColor: s.color }}></span>
        {s.label}
      </span>
    );
  };

  const renderActions = (leave) => (
    <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
      <button onClick={() => handleEditLeave(leave._id)} className="p-2 text-gray-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-sm hover:shadow" title="Edit">
        <PencilIcon className="size-4" />
      </button>
      {leave.status === 'pending' && (
        <>
          <button onClick={() => updateLeaveStatus(leave._id, 'approved')} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100 shadow-sm hover:shadow" title="Approve">
            <CheckIcon className="size-4" />
          </button>
          <button onClick={() => updateLeaveStatus(leave._id, 'rejected')} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 shadow-sm hover:shadow" title="Reject">
            <CloseIcon className="size-4" />
          </button>
        </>
      )}
      <button onClick={() => deleteLeave(leave._id)} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 shadow-sm hover:shadow" title="Delete">
        <TrashBinIcon className="size-4" />
      </button>
    </div>
  );

  const leaveTypeOptions = [
    { value: "casual", label: "Casual Leave" },
    { value: "sick", label: "Sick Leave" },
    { value: "annual", label: "Annual Leave" },
    { value: "maternity", label: "Maternity Leave" },
    { value: "paternity", label: "Paternity Leave" }
  ];

  const filteredLeaves = leaves.filter(leave => {
    const term = searchTerm.toLowerCase();
    const name = leave.userId?.fullName || leave.employeeName || '';
    const brandName = leave.brand?.name || '';
    return name.toLowerCase().includes(term) || brandName.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <PageMeta title="Leave Management - CDC International" />
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />

      {isPortal ? (
        /* ── Leave Requests Content (Portal view) ── */
        <div className="py-10">
          <div className="rounded-3xl border border-gray-200/60 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl px-10 py-12 dark:border-gray-800 shadow-2xl shadow-gray-200/20 dark:shadow-none">
            <div className="mb-12 text-left">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Request Leave</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">Please fill out the form below to submit a formal leave request.</p>
            </div>

            <form onSubmit={handleCreateLeave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label htmlFor="employeeName" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Name *</Label>
                  <InputField type="text" id="employeeName" name="employeeName" value={formData.employeeName} onChange={handleInputChange} placeholder="Your full name" required />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="employeeId" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Employee ID *</Label>
                  <InputField type="text" id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleInputChange} placeholder="e.g. EMP123" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label htmlFor="leaveType" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Type of Leave *</Label>
                  <Select options={leaveTypeOptions} value={formData.leaveType} onChange={(value) => handleSelectChange('leaveType', value)} />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="status" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</Label>
                  <div className="px-5 py-3.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 dark:text-gray-500 text-sm font-bold uppercase tracking-widest">
                    Pending Analysis
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label htmlFor="startDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Start Date *</Label>
                  <InputField type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="endDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">End Date *</Label>
                  <InputField type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="reason" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Reason for Request *</Label>
                <textarea id="reason" name="reason" value={formData.reason} onChange={handleInputChange} rows="5"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-800 dark:text-white/90 placeholder:text-gray-400 focus:outline-hidden focus:ring-4 focus:ring-blue-950/5 focus:border-blue-950 dark:focus:border-blue-800 transition-all resize-none shadow-theme-xs font-medium"
                  placeholder="Explain your reason for leave..."
                  required></textarea>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                <button type="reset" onClick={resetForm} className="w-full sm:w-auto px-8 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">Reset Form</button>
                <button type="submit" className="w-full sm:w-auto px-12 py-4 bg-blue-950 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 shadow-2xl shadow-blue-950/20 active:scale-95 transition-all font-semibold">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ── Manage Leaves Content (Admin Panel) ── */
        <div className="space-y-5">

          {/* Stats pills */}
          <div className="flex flex-wrap items-center gap-3">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-white/5 rounded-full border border-gray-200/70 dark:border-white/10 h-11 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-white/10">
                <span className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[9px]">{stat.label}:</span>
                <span className="font-black text-[15px] tabular-nums leading-none" style={{ color: stat.color }}>{stat.count}</span>
              </div>
            ))}
          </div>

          {showEditForm && isAdmin ? (
            /* ── Edit Form ── */
            <ComponentCard title="Edit Leave Request">
              <form onSubmit={handleUpdateLeave}>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="employeeName">Employee Name *</Label><InputField type="text" id="employeeName" name="employeeName" value={formData.employeeName} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="employeeId">Employee ID *</Label><InputField type="text" id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="leaveType">Leave Type *</Label><Select options={leaveTypeOptions} value={formData.leaveType} onChange={(value) => handleSelectChange('leaveType', value)} /></div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select options={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} value={formData.status} onChange={(value) => handleSelectChange('status', value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="startDate">Start Date *</Label><InputField type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="endDate">End Date *</Label><InputField type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} required /></div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason *</Label>
                    <textarea id="reason" name="reason" value={formData.reason} onChange={handleInputChange} rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 focus:border-brand-300 dark:border-gray-700 dark:focus:border-brand-800 shadow-theme-xs"
                      required></textarea>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setShowEditForm(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2.5 bg-blue-950 text-white rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-950/20 active:scale-95 font-semibold">Update Leave</button>
                  </div>
                </div>
              </form>
            </ComponentCard>
          ) : (
            /* ── Main Table ── */
            <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Leave Requests</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Total: {leaves.length} records</p>
                </div>
                <div className="relative max-w-xs">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-2 focus:ring-blue-950/10 focus:outline-none transition-all"
                  />
                  <svg className="absolute left-3 top-2.5 text-gray-400 size-4" viewBox="0 0 20 20" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
                  </svg>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50 dark:bg-white/[0.02]">
                    <TableRow>
                      {['Employee', 'Applied On', 'Leave Type', 'Dates', 'Status', 'Actions'].map((h) => (
                        <TableCell key={h} isHeader className={`px-5 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="py-20 text-center text-gray-400 text-sm">Loading leave requests...</TableCell></TableRow>
                    ) : filteredLeaves.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-20 text-center text-gray-400 text-sm">No leave requests found.</TableCell></TableRow>
                    ) : (
                      filteredLeaves.map((leave) => (
                        <TableRow key={leave._id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors border-b border-gray-100/50 dark:border-gray-800/50 last:border-0">
                          <TableCell className="px-5 py-4">
                            <div className="text-sm font-bold text-gray-800 dark:text-white/90">{leave.userId?.fullName || leave.employeeName}</div>
                            <div className="text-[11px] font-medium text-gray-400 mt-0.5">ID: {leave.userId?.employeeCode || leave.employeeId || 'N/A'}</div>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{new Date(leave.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[11px] opacity-70 mt-0.5 text-gray-500">{new Date(leave.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{leave.leaveType}</TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mt-0.5 tracking-tight uppercase">
                              {Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            {getStatusBadge(leave.status)}
                            {leave.actionBy && <div className="text-[11px] text-gray-400 mt-1">By: {leave.actionBy.fullName}</div>}
                          </TableCell>
                          <TableCell className="px-5 py-4">
                            {(hasRole(user, 'Owner') || hasRole(user, 'HR')) && renderActions(leave)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;