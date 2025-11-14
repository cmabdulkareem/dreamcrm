import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../components/common/ComponentCard';
import PageMeta from '../components/common/PageMeta';
import InputField from '../components/form/input/InputField';
import Label from '../components/form/Label';

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const LeaveStatusCheck = () => {
  const [searchParams] = useSearchParams();
  const [ticketNumber, setTicketNumber] = useState('');
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for ticket number in URL parameters
  useEffect(() => {
    const ticketFromUrl = searchParams.get('ticket');
    if (ticketFromUrl) {
      const ticket = ticketFromUrl.toUpperCase();
      setTicketNumber(ticket);
      // Auto-check if ticket is in URL
      if (ticket.trim()) {
        const checkStatus = async () => {
          try {
            setLoading(true);
            const response = await axios.get(`${API}/leaves/status/${ticket}`, {
              timeout: 10000
            });

            if (response.data && response.data.success && response.data.leave) {
              setLeave(response.data.leave);
            } else {
              setLeave(null);
            }
          } catch (error) {
            setLeave(null);
          } finally {
            setLoading(false);
          }
        };
        checkStatus();
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!ticketNumber.trim()) {
      toast.error('Please enter a ticket number');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API}/leaves/status/${ticketNumber.trim()}`, {
        timeout: 10000
      });

      if (response.data && response.data.success && response.data.leave) {
        setLeave(response.data.leave);
      } else {
        toast.error('Leave request not found');
        setLeave(null);
      }
    } catch (error) {
      console.error('Error fetching leave status:', error);
      
      if (error.response) {
        if (error.response.status === 404) {
          toast.error(error.response.data?.message || 'Leave request not found. Please check your ticket number.');
        } else {
          toast.error(error.response.data?.message || 'Failed to fetch leave status');
        }
      } else if (error.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to fetch leave status. Please try again.');
      }
      
      setLeave(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <>
      <PageMeta title="Check Leave Status - CRM" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <ComponentCard title="Check Leave Request Status">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Enter your ticket number to check the status of your leave request.
              </p>
              
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="ticketNumber">Ticket Number</Label>
                    <InputField
                      type="text"
                      id="ticketNumber"
                      name="ticketNumber"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                      placeholder="e.g., LR20241225123456"
                      required
                      className="uppercase"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Checking...' : 'Check Status'}
                    </button>
                  </div>
                </div>
              </form>

              {leave && (
                <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Leave Request Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Number</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{leave.ticketNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                          {getStatusLabel(leave.status)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employee Name</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{leave.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employee ID</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">{leave.employeeId}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Leave Type</p>
                      <p className="text-base font-medium text-gray-900 dark:text-white capitalize">{leave.leaveType}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          {new Date(leave.endDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reason</p>
                      <p className="text-base text-gray-900 dark:text-white">{leave.reason}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Submitted On</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {new Date(leave.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {leave.updatedAt && leave.updatedAt !== leave.createdAt && (
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                          <p className="text-base text-gray-900 dark:text-white">
                            {new Date(leave.updatedAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Don't have a ticket number?{' '}
                  <a 
                    href="/leave-request" 
                    className="underline hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    Submit a new leave request
                  </a>
                </p>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
};

export default LeaveStatusCheck;

