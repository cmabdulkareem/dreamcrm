import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import LoadingSpinner from '../components/common/LoadingSpinner';

import API from "../config/api";

const EventRegistration = () => {
  const { link } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch event details
  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/public/${link}`);
      setEvent(response.data.event);

      // Initialize form data
      const initialData = {};
      response.data.event.registrationFields.forEach(field => {
        initialData[field.fieldName] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found or is no longer active');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [link]);

  // Handle form input changes
  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    event.registrationFields.forEach(field => {
      if (field.isRequired && (!formData[field.fieldName] || formData[field.fieldName].trim() === '')) {
        newErrors[field.fieldName] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const registrationData = [];
      Object.keys(formData).forEach(key => {
        registrationData.push({ fieldName: key, fieldValue: formData[key] });
      });

      // Smart field extraction for name and email
      // Try to find name field (case-insensitive, common variations)
      let registrantName = '';
      const nameFieldVariations = ['full name', 'name', 'your name', 'participant name', 'attendee name'];
      for (const variation of nameFieldVariations) {
        const matchingKey = Object.keys(formData).find(key =>
          key.toLowerCase() === variation.toLowerCase()
        );
        if (matchingKey && formData[matchingKey]) {
          registrantName = formData[matchingKey];
          break;
        }
      }

      // Try to find email field (case-insensitive, check field type)
      let registrantEmail = '';
      const emailFieldVariations = ['email', 'e-mail', 'email address', 'your email'];
      for (const variation of emailFieldVariations) {
        const matchingKey = Object.keys(formData).find(key =>
          key.toLowerCase() === variation.toLowerCase()
        );
        if (matchingKey && formData[matchingKey]) {
          registrantEmail = formData[matchingKey];
          break;
        }
      }

      // Fallback: find first email-type field from event registration fields
      if (!registrantEmail && event.registrationFields) {
        const emailField = event.registrationFields.find(field =>
          field.fieldType === 'email'
        );
        if (emailField && formData[emailField.fieldName]) {
          registrantEmail = formData[emailField.fieldName];
        }
      }

      const response = await axios.post(`${API}/events/register/${link}`, {
        registrantName,
        registrantEmail,
        registrationData
      });

      setRegistered(true);
      setRegistrationId(response.data.registration._id);
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Unavailable</h1>
          <p className="text-gray-600">The event you are looking for is not found or has expired.</p>
        </div>
      </div>
    );
  }

  // --- CALENDAR HELPERS ---

  // 1. Google Calendar Link
  const getGoogleCalendarLink = () => {
    if (!event) return '#';
    const startDate = new Date(event.eventDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(new Date(event.eventDate).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ''); // Default 1 hour duration

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventName)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.eventDescription || '')}&sf=true&output=xml`;
  };

  // 2. Outlook Web Link (Live/Office365)
  const getOutlookCalendarLink = () => {
    if (!event) return '#';
    const startDate = new Date(event.eventDate).toISOString();
    const endDate = new Date(new Date(event.eventDate).getTime() + 60 * 60 * 1000).toISOString();

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startDate}&enddt=${endDate}&subject=${encodeURIComponent(event.eventName)}&body=${encodeURIComponent(event.eventDescription || '')}`;
  };

  // 3. iCal / Outlook Desktop (.ics file)
  const downloadICSFile = () => {
    if (!event) return;

    const startDate = new Date(event.eventDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(new Date(event.eventDate).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CRM Event Org//EN
BEGIN:VEVENT
UID:${registrationId || 'uid'}@crmevent.com
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.eventName}
DESCRIPTION:${event.eventDescription || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.eventName.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Download Ticket as Image
  const downloadTicket = async () => {
    const ticketElement = document.getElementById('ticket-node');
    if (!ticketElement) return;

    try {
      // Add a class to hide elements during capture
      ticketElement.classList.add('capturing-ticket');

      const canvas = await html2canvas(ticketElement, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-print') // Exclude calendar buttons
      });

      // Remove class after capture
      ticketElement.classList.remove('capturing-ticket');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${event.eventName.replace(/\s+/g, '_')}_Ticket.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Ticket downloaded successfully!");
    } catch (error) {
      console.error("Error downloading ticket:", error);
      toast.error("Failed to download ticket.");
      ticketElement.classList.remove('capturing-ticket');
    }
  };

  // --- Success View (Ticket Style) ---
  if (registered) {
    // Generate a random ticket number if one isn't provided by backend
    const ticketNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
    const verificationLink = `${window.location.origin}/events/verify-ticket/${registrationId}`;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          {/* Ticket Container */}
          <div id="ticket-node" className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Top Pattern */}
            <div className="h-32 bg-brand-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="px-8 pt-0 pb-10 relative">
              <div className="mx-auto -mt-16 bg-white p-2 rounded-2xl shadow-lg w-24 h-24 flex items-center justify-center mb-6 ring-4 ring-brand-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">You're Going!</h2>
                <p className="text-gray-500 text-lg mb-8">Registration Confirmed</p>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8 relative overflow-hidden">
                  {/* Ticket visual elements */}
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-brand-700 mb-1">{event.eventName}</h3>
                  <p className="text-gray-600 font-medium mb-4">
                    {new Date(event.eventDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>

                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center my-6">
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                      <QRCode
                        size={128}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={verificationLink}
                        viewBox={`0 0 128 128`}
                      />
                    </div>
                    <span className="text-xs text-gray-400 mt-2 uppercase tracking-wide">Scan at entrance</span>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 border-dashed">
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ticket Number</span>
                    <span className="font-mono text-2xl font-bold text-gray-800 tracking-wider">{ticketNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 no-print">
                  <h4 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Add to Calendar</h4>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Google Calendar */}
                    <a
                      href={getGoogleCalendarLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all group"
                    >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="h-8 w-8 mb-2" />
                      <span className="text-xs font-bold text-gray-700 group-hover:text-brand-700">Google</span>
                    </a>

                    {/* Outlook Web */}
                    <a
                      href={getOutlookCalendarLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <svg className="h-8 w-8 mb-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 8.25V15.75H20.5V8.25H11.5Z" fill="#0078D4" />
                        <path d="M11.5 8.25L16 11.25L20.5 8.25" stroke="#71AFE5" strokeWidth="1.5" />
                        <path d="M2.5 5.25C2.5 3.73122 3.73122 2.5 5.25 2.5H8.75V11.5H2.5V5.25Z" fill="#258BC5" />
                        <path d="M2.5 11.5H8.75V20.5H5.25C3.73122 20.5 2.5 19.2688 2.5 17.75V11.5Z" fill="#005A9E" />
                        <path d="M8.75 16.75V20.5H20.5V16.75H8.75Z" fill="#005A9E" />
                        <path d="M13.75 16.75H11.5V6.25H13.75V16.75Z" fill="#258BC5" />
                        <path d="M13.75 6.25H20.5V16.75H13.75V6.25Z" fill="#0078D4" />
                      </svg>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-blue-700">Outlook</span>
                    </a>

                    {/* iCal / Desktop */}
                    <button
                      onClick={downloadICSFile}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-gray-800 hover:bg-gray-100 transition-all group"
                    >
                      <div className="h-8 w-8 mb-2 flex items-center justify-center bg-gray-800 rounded-lg text-white font-bold text-xs shadow-md">
                        24
                      </div>
                      <span className="text-xs font-bold text-gray-700 group-hover:text-gray-900">iCal</span>
                    </button>
                  </div>
                </div>

                {/* Download Ticket Button */}
                <div className="mt-6 pt-6 border-t border-gray-100 no-print">
                  <button
                    onClick={downloadTicket}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Ticket
                  </button>
                </div>

              </div>
            </div>

            {/* Ticket Rip Effect (Visual) */}
            <div className="relative h-6 bg-gray-50">
              <div className="absolute -top-3 left-0 w-6 h-6 bg-gray-50 rounded-full"></div>
              <div className="absolute -top-3 right-0 w-6 h-6 bg-gray-50 rounded-full"></div>
              <div className="absolute top-0 left-0 right-0 border-t-2 border-dashed border-gray-300"></div>
            </div>
          </div>
          <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
      </div>
    );
  }

  // --- Registration View ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Cinematic Hero Section */}
      <div className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-gray-900">
        {event.bannerImage ? (
          <>
            {/* Blurred Background for Ambiance */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50 blur-3xl scale-110"
              style={{ backgroundImage: `url(${API.replace('/api', '')}${event.bannerImage})` }}
            ></div>

            {/* Main Banner Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={`${API.replace('/api', '')}${event.bannerImage}`}
                alt="Event Banner"
                className="w-full h-full object-cover object-center max-w-7xl mx-auto opacity-90 shadow-2xl"
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-gray-900 pattern-grid-lg opacity-100"></div>
        )}

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>

      {/* Content Container - Floating Upwards */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 mb-20">

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden ring-1 ring-gray-900/5">

          {/* Header / Event Title Area */}
          <div className="px-8 pt-10 pb-8 text-center border-b border-gray-100">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-50 text-brand-600 text-xs font-bold tracking-wider uppercase mb-4">
              Official Registration
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {event.eventName}
            </h1>

            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 mt-6 text-gray-600">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg text-brand-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-lg">
                  {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200"></div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg text-brand-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-lg">
                  {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Description Area */}
          <div className="px-8 py-8 bg-gray-50/50">
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto text-center">
              {event.eventDescription}
            </p>
          </div>

          {/* Form Area */}
          <div className="px-8 py-10 md:px-12 bg-white">
            <div className="max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                Attendee Details
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  {event.registrationFields.map((field, index) => (
                    <div key={index} className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700 ml-1">
                        {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                      </label>

                      {field.fieldType === 'textarea' ? (
                        <textarea
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          rows="3"
                          className={`w-full px-4 py-3 rounded-xl border ${errors[field.fieldName] ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'} focus:ring-4 transition-all shadow-sm resize-y min-h-[100px] outline-none text-gray-800 bg-gray-50 focus:bg-white`}
                          placeholder={`Enter your ${field.fieldName.toLowerCase()}`}
                        />
                      ) : field.fieldType === 'select' ? (
                        <div className="relative">
                          <select
                            value={formData[field.fieldName] || ''}
                            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border appearance-none ${errors[field.fieldName] ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'} focus:ring-4 transition-all shadow-sm outline-none text-gray-800 bg-gray-50 focus:bg-white`}
                          >
                            <option value="">Select option</option>
                            {field.options?.map((option, optIndex) => (
                              <option key={optIndex} value={option}>{option}</option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      ) : (
                        <input
                          type={field.fieldType}
                          value={formData[field.fieldName] || ''}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border ${errors[field.fieldName] ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100'} focus:ring-4 transition-all shadow-sm outline-none text-gray-800 bg-gray-50 focus:bg-white h-[52px]`}
                          placeholder={`Enter your ${field.fieldName.toLowerCase()}`}
                        />
                      )}

                      {errors[field.fieldName] && (
                        <p className="text-sm text-red-500 font-medium ml-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors[field.fieldName]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full group relative flex justify-center py-4 px-4 border border-transparent rounded-xl text-lg font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/30 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 ${submitting ? 'opacity-80 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Confirming Registration...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Secure My Spot
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                  <p className="text-center text-gray-400 text-xs mt-4">
                    By registering, you agree to our terms of service and privacy policy.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
};

export default EventRegistration;
