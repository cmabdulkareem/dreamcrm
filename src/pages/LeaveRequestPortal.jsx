import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../components/common/ComponentCard';
import PageMeta from '../components/common/PageMeta';
import InputField from '../components/form/input/InputField';
import Label from '../components/form/Label';
import Select from '../components/form/Select';

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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
    <>
      <PageMeta title="Leave Request Portal - CRM" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ComponentCard title="Leave Request Portal">
              {submittedTicket ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Leave Request Submitted Successfully!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Your leave request has been submitted. Please save your ticket number for future reference.
                    </p>
                  </div>

                  <div className="bg-brand-50 dark:bg-brand-500/20 border-2 border-brand-200 dark:border-brand-800 rounded-lg p-6 mb-6">
                    <p className="text-sm text-brand-800 dark:text-brand-200 mb-2">Your Ticket Number</p>
                    <p className="text-3xl font-bold text-brand-500 dark:text-brand-400 font-mono tracking-wider">
                      {submittedTicket}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Important:</strong> Please save this ticket number. You can use it to check the status of your leave request.
                      </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <a
                        href={`/leave-status-check?ticket=${submittedTicket}`}
                        className="px-6 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                      >
                        Check Status Now
                      </a>
                      <button
                        onClick={handleNewRequest}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Please fill out the form below to submit your leave request. All fields marked with * are required.
                  </p>
                  
                  <form onSubmit={handleSubmit}>
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
                    <div></div> {/* Empty div for spacing */}
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
                    <Label htmlFor="reason">Reason for Leave *</Label>
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

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already submitted a request?{' '}
                    <a 
                      href="/leave-status-check" 
                      className="text-brand-500 dark:text-brand-400 hover:underline"
                    >
                      Check your leave status
                    </a>
                  </p>
              </div>
                </>
              )}
            </ComponentCard>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
};

export default LeaveRequestPortal;