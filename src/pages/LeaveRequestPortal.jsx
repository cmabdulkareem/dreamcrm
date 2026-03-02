import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../components/common/ComponentCard';
import PageMeta from '../components/common/PageMeta';
import InputField from '../components/form/input/InputField';
import Label from '../components/form/Label';
import Select from '../components/form/Select';

import API from "../config/api";

const LeaveRequestPortal = () => {
  const [formData, setFormData] = useState({
    employeeName: '',
    employeeId: '',
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);

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
      reason: ''
    });
  };

  // Handle new request (clear ticket)
  const handleNewRequest = () => {
    setSubmittedTicket(null);
    resetForm();
  };

  // Submit leave request
  const handleSubmit = async (e) => {
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

      if (response.data && response.data.ticketNumber) {
        setSubmittedTicket(response.data.ticketNumber);
        toast.success(response.data.message || 'Leave request submitted successfully!');
      } else if (response.data && response.data.message) {
        toast.success(response.data.message || 'Leave request submitted successfully!');
      } else {
        toast.success('Leave request submitted successfully!');
      }

      resetForm();
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageMeta title="Leave Request Portal - CDC Insights" />
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="">
            <div className="rounded-3xl border border-gray-200/60 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl px-10 py-12 dark:border-gray-800 shadow-2xl shadow-gray-200/20 dark:shadow-none">
              {submittedTicket ? (
                <div className="text-center py-8">
                  <div className="mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                      <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3">
                      Request Submitted!
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
                      Your leave request has been logged. Please save your ticket number for status tracking.
                    </p>
                  </div>

                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-2xl p-8 mb-10">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-3">Your Ticket Number</p>
                    <p className="text-4xl font-black text-blue-950 dark:text-white font-mono tracking-[0.2em]">
                      {submittedTicket}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href={`/leave-status-check?ticket=${submittedTicket}`}
                      className="px-10 py-4 bg-blue-950 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 shadow-xl shadow-blue-950/20 active:scale-95 transition-all"
                    >
                      Check Status Now
                    </a>
                    <button
                      onClick={handleNewRequest}
                      className="px-10 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                      New Request
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-12 text-left">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                      Leave Request Portal
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
                      Please provide your details below to submit a formal leave request.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label htmlFor="employeeName" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Full Name *</Label>
                        <InputField
                          type="text"
                          id="employeeName"
                          name="employeeName"
                          value={formData.employeeName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="employeeId" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Employee ID *</Label>
                        <InputField
                          type="text"
                          id="employeeId"
                          name="employeeId"
                          value={formData.employeeId}
                          onChange={handleInputChange}
                          placeholder="e.g. EMP123"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label htmlFor="leaveType" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Type of Leave *</Label>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <Label htmlFor="startDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Start Date *</Label>
                        <InputField
                          type="date"
                          id="startDate"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="endDate" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">End Date *</Label>
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

                    <div className="space-y-2.5">
                      <Label htmlFor="reason" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Reason for Request *</Label>
                      <textarea
                        id="reason"
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        rows="5"
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-800 dark:text-white/90 placeholder:text-gray-400 focus:outline-hidden focus:ring-4 focus:ring-blue-950/5 focus:border-blue-950 dark:focus:border-blue-800 transition-all resize-none shadow-theme-xs font-medium"
                        placeholder="Briefly explain your reason for leave..."
                        required
                      ></textarea>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="reset"
                        onClick={resetForm}
                        className="w-full sm:w-auto px-8 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                      >
                        Reset Form
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-12 py-4 bg-blue-950 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 shadow-2xl shadow-blue-950/20 active:scale-95 transition-all"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>

                  <div className="mt-10 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-gray-800 text-center sm:text-left">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Already submitted a request?{' '}
                      <a
                        href="/leave-status-check"
                        className="text-blue-950 dark:text-blue-400 font-black hover:underline underline-offset-4 ml-1"
                      >
                        Check your status
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
};

export default LeaveRequestPortal;