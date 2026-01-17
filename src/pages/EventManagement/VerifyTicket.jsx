import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../../config/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const VerifyTicket = () => {
    const { registrationId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [registrationData, setRegistrationData] = useState(null);

    useEffect(() => {
        const verifyAttendance = async () => {
            try {
                const response = await axios.patch(
                    `${API}/events/attendance/verify/${registrationId}`,
                    {},
                    { withCredentials: true }
                );

                setStatus('success');
                setMessage(response.data.message);
                setRegistrationData(response.data.registration);

                // If already attended, we might want to show a warning style but still "success" in finding record
                if (response.data.alreadyAttended) {
                    setStatus('warning');
                }

            } catch (error) {
                console.error("Verification error:", error);
                setStatus('error');
                setMessage(error.response?.data?.message || "Failed to verify ticket. Invalid or expired.");
            }
        };

        if (registrationId) {
            verifyAttendance();
        }
    }, [registrationId]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

                {/* Header */}
                <div className={`py-6 px-8 text-center ${status === 'verifying' ? 'bg-blue-600' :
                        status === 'success' ? 'bg-green-600' :
                            status === 'warning' ? 'bg-yellow-500' :
                                'bg-red-600'
                    }`}>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
                        Ticket Verification
                    </h1>
                </div>

                {/* Content */}
                <div className="p-8 text-center">

                    {status === 'verifying' && (
                        <div className="py-8">
                            <LoadingSpinner />
                            <p className="mt-4 text-gray-600 font-medium">Verifying ticket details...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="animate-fade-in-up">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Granted</h2>
                            <p className="text-gray-500 mb-6">{message}</p>

                            {registrationData && (
                                <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200">
                                    <div className="mb-2">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Attendee</span>
                                        <p className="text-lg font-bold text-gray-800">{registrationData.registrantName}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-bold">Email</span>
                                        <p className="text-gray-700 break-all">{registrationData.registrantEmail}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'warning' && (
                        <div className="animate-fade-in-up">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
                                <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Scanned</h2>
                            <p className="text-gray-600 mb-6">{message}</p>

                            {registrationData && (
                                <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200 opacity-75">
                                    <div className="mb-2">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Attendee</span>
                                        <p className="text-lg font-bold text-gray-800">{registrationData.registrantName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="animate-fade-in-up">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                            <p className="text-red-500 font-medium mb-6">{message}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="text-gray-600 underline hover:text-gray-800"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    {(status === 'success' || status === 'warning') && (
                        <button
                            onClick={() => navigate('/events')}
                            className="w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Back to Events
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyTicket;
