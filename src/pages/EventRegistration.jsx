import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ComponentCard from '../components/common/ComponentCard';

import API from "../config/api";

const EventRegistration = () => {
  const { link } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false); // New state for registration success
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Fetch event details
  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${API}/events/public/${link}`);
      setEvent(response.data.event);

      // Initialize form data with empty values
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
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
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
      // Prepare registration data
      const registrationData = [];
      Object.keys(formData).forEach(key => {
        registrationData.push({
          fieldName: key,
          fieldValue: formData[key]
        });
      });

      // Extract name and email from form data
      const registrantName = formData['Full Name'] || '';
      const registrantEmail = formData['Email'] || '';

      await axios.post(`${API}/events/register/${link}`, {
        registrantName,
        registrantEmail,
        registrationData
      });

      // Set registered state to true instead of resetting form
      setRegistered(true);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ComponentCard className="text-center p-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Event Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">
            The event you're looking for doesn't exist or is no longer active.
          </p>
        </ComponentCard>
      </div>
    );
  }

  // Show thank you message after successful registration
  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <ComponentCard className="shadow-lg text-center p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Thank You for Registering!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You have successfully registered for <span className="font-semibold">{event.eventName}</span>.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We look forward to seeing you at the event.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Event Details</h2>
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-medium">Date:</span> {new Date(event.eventDate).toLocaleDateString()} at {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </ComponentCard>
          <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <ComponentCard className="shadow-lg">
          {/* Banner display for all users (including public) */}
          {event.bannerImage && (
            <div className="mb-8">
              <div className="w-full aspect-video overflow-hidden rounded-lg">
                <img
                  src={`${API.replace('/api', '')}${event.bannerImage}`}
                  alt="Event Banner"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.target.onerror = null;
                    e.target.parentElement.parentElement.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Event Registration Form
            </h1>
          </div>

          {/* Event Details */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {event.eventName}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {event.eventDescription}
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {new Date(event.eventDate).toLocaleDateString()} at {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {event.registrationFields.map((field, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.fieldName}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.fieldType === 'textarea' ? (
                    <textarea
                      value={formData[field.fieldName] || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors[field.fieldName] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder={`Enter your ${field.fieldName.toLowerCase()}`}
                    />
                  ) : field.fieldType === 'select' ? (
                    <select
                      value={formData[field.fieldName] || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors[field.fieldName] ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option, optIndex) => (
                        <option key={optIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.fieldType}
                      value={formData[field.fieldName] || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors[field.fieldName] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder={`Enter your ${field.fieldName.toLowerCase()}`}
                    />
                  )}

                  {errors[field.fieldName] && (
                    <p className="mt-1 text-sm text-red-600">{errors[field.fieldName]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${submitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Register for Event'
                )}
              </button>
            </div>
          </form>
        </ComponentCard>
        <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
      </div>
    </div>
  );
};

export default EventRegistration;