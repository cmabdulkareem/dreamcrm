import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import ComponentCard from '../components/common/ComponentCard';
import PageMeta from '../components/common/PageMeta';
import InputField from '../components/form/input/InputField';
import Label from '../components/form/Label';

import API from "../config/api";

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
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 py-12">
        <div className="container mx-auto px-4">
          <div className="">
            <div className="rounded-3xl border border-gray-200/60 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl px-10 py-12 dark:border-gray-800 shadow-2xl shadow-gray-200/20 dark:shadow-none">
              <div className="mb-12 text-left">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                  Check Leave Status
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">
                  Enter your ticket number to check the status of your leave request.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mb-12">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-2.5">
                    <Label htmlFor="ticketNumber" className="text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Ticket Number *</Label>
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
                      className="w-full sm:w-auto px-10 py-3.5 bg-blue-950 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-900 shadow-2xl shadow-blue-950/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Checking...
                        </>
                      ) : 'Check Status'}
                    </button>
                  </div>
                </div>
              </form>

              {leave && (
                <div className="mt-12 p-8 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                    Leave Request Details
                  </h3>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Ticket Number</p>
                        <p className="text-lg font-bold text-blue-950 dark:text-white font-mono tracking-tight">{leave.ticketNumber}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</p>
                        <div>
                          <span className={`inline-flex px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${getStatusColor(leave.status)}`}>
                            {getStatusLabel(leave.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Employee Name</p>
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">{leave.employeeName}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Employee ID</p>
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">{leave.employeeId}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Leave Type</p>
                      <p className="text-base font-bold text-gray-800 dark:text-white/90 capitalize">{leave.leaveType} Leave</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Start Date</p>
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">
                          {new Date(leave.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">End Date</p>
                        <p className="text-base font-bold text-gray-800 dark:text-white/90">
                          {new Date(leave.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Reason</p>
                      <div className="p-5 bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800 rounded-2xl">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">"{leave.reason}"</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Submitted On</p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
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
                        <div className="space-y-1.5 text-right sm:text-left">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Last Updated</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
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

              <div className="mt-12 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50 text-center sm:text-left">
                <p className="text-sm text-blue-800/80 dark:text-blue-300 font-medium">
                  <strong>Note:</strong> Don't have a ticket number?{' '}
                  <a
                    href="/leave-request"
                    className="text-blue-950 dark:text-blue-400 font-black hover:underline underline-offset-4 ml-1"
                  >
                    Submit a new leave request
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </>
  );
};

export default LeaveStatusCheck;

