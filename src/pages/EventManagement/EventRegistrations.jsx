import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ComponentCard from '../../components/common/ComponentCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import useGoBack from '../../hooks/useGoBack';

import API from "../../config/api";

const EventRegistrations = () => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();

  // Fetch event details and registrations
  const fetchEventData = async () => {
    try {
      setLoading(true);

      // Fetch event details
      const eventResponse = await axios.get(`${API}/events/${id}`, { withCredentials: true });
      setEvent(eventResponse.data.event);

      // Fetch registrations
      const regResponse = await axios.get(`${API}/events/${id}/registrations`, { withCredentials: true });
      setRegistrations(regResponse.data.registrations);
    } catch (error) {
      console.error('Error fetching event data:', error);
      toast.error('Failed to fetch event data');
      navigate('/settings/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  // Convert registrant to lead
  const convertToLead = async (registrant) => {
    try {
      // Navigate to new lead page with pre-filled data
      const leadData = {
        fullName: registrant.registrantName,
        email: registrant.registrantEmail
      };

      // Store lead data in session storage to pre-fill the form
      sessionStorage.setItem('prefillLeadData', JSON.stringify(leadData));

      // Navigate to new lead page
      navigate('/new-lead');
    } catch (error) {
      console.error('Error converting to lead:', error);
      toast.error('Failed to convert to lead');
    }
  };

  // Export registrations to CSV
  const exportToCSV = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add headers
    const headers = ['Name', 'Email', 'Registration Date'];

    // Add dynamic field headers
    if (event && event.registrationFields) {
      event.registrationFields.forEach(field => {
        headers.push(field.fieldName);
      });
    }

    csvContent += headers.join(',') + '\n';

    // Add data rows
    registrations.forEach(reg => {
      const row = [
        `"${reg.registrantName}"`,
        `"${reg.registrantEmail}"`,
        `"${new Date(reg.createdAt).toLocaleDateString()}"`
      ];

      // Add dynamic field values
      if (event && event.registrationFields) {
        event.registrationFields.forEach(field => {
          const fieldData = reg.registrationData.find(data => data.fieldName === field.fieldName);
          row.push(`"${fieldData ? fieldData.fieldValue : ''}"`);
        });
      }

      csvContent += row.join(',') + '\n';
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${event?.eventName || 'event'}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Registrations exported successfully');
  };

  if (loading) {
    return (
      <LoadingSpinner />
    );
  }

  return (
    <>
      <PageMeta title={`Registrations - ${event?.eventName || 'Event'} - CRM`} />
      <PageBreadcrumb
        items={[
          { name: 'Home', path: '/' },
          { name: 'Manage Events', path: '/events' },
          { name: event?.eventName || 'Event Registrations' }
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {event?.eventName} - Registrations
          </h1>
          <button
            onClick={exportToCSV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export CSV
          </button>
        </div>

        <ComponentCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Total Registrations</h3>
              <p className="text-3xl font-bold text-brand-500">{registrations.length}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Event Date</h3>
              <p className="text-xl font-semibold text-gray-800 dark:text-white">
                {event?.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Status</h3>
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${event?.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                {event?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </ComponentCard>

        {registrations.length === 0 ? (
          <ComponentCard>
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No registrations yet</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Share the registration link to start collecting registrations.
              </p>
            </div>
          </ComponentCard>
        ) : (
          <ComponentCard>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Registrant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    {event?.registrationFields?.map((field, index) => (
                      <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {field.fieldName}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {registrations.map((registration) => (
                    <tr key={registration._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {registration.registrantName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {registration.registrantEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(registration.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${registration.attended
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {registration.attended ? 'Attended' : 'Registered'}
                        </span>
                      </td>
                      {event?.registrationFields?.map((field, index) => {
                        const fieldData = registration.registrationData.find(
                          data => data.fieldName === field.fieldName
                        );
                        return (
                          <td key={index} className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                              {fieldData ? fieldData.fieldValue : '-'}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => convertToLead(registration)}
                          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Convert to Lead
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        )}
        <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
      </div>
    </>
  );
};

export default EventRegistrations;