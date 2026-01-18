import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../../config/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';

const VerifyTicket = () => {
    const { registrationId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('input_pin'); // input_pin, verifying, success, error, warning
    const [message, setMessage] = useState('');
    const [registrationData, setRegistrationData] = useState(null);
    const [pin, setPin] = useState('');

    // Force refresh: 2026-01-18
    const handleVerify = async (e) => {
        e.preventDefault();

        if (!pin || pin.length !== 4) {
            setMessage("Please enter a valid 4-digit PIN.");
            return;
        }

        setStatus('verifying');
        setMessage('');

        try {
            const response = await axios.patch(
                `${API}/events/attendance/verify/${registrationId}`,
                { pin },
                { withCredentials: true }
            );

            setStatus('success');
            setMessage(response.data.message);
            setRegistrationData(response.data.registration);

            if (response.data.alreadyAttended) {
                setStatus('warning');
            }

        } catch (error) {
            console.error("Verification error:", error);
            setStatus('error');
            setMessage(error.response?.data?.message || "Failed to verify ticket. Invalid PIN or expired.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

                {/* Header */}
                <div className={`py-6 px-8 text-center ${status === 'input_pin' || status === 'verifying' ? 'bg-blue-600' :
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

                    {(status === 'input_pin' || status === 'verifying') && (
                        <div className="animate-fade-in-up">
                            <p className="text-gray-600 mb-6">Please enter the 4-digit Event PIN to verify attendance.</p>

                            <form onSubmit={handleVerify} className="space-y-4">
                                <Input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="Enter PIN (e.g., 1234)"
                                    className="text-center text-2xl tracking-widest"
                                    maxLength={4}
                                    pattern="\d{4}"
                                    autoFocus
                                    disabled={status === 'verifying'}
                                />

                                {status === 'verifying' ? (
                                    <div className="flex justify-center py-2">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="w-full !rounded-xl !py-3 text-lg font-bold shadow-lg shadow-blue-500/20"
                                    >
                                        Verify Attendance
                                    </Button>
                                )}
                            </form>
                            {message && <p className="text-red-500 mt-4 font-medium">{message}</p>}
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
                            <Button
                                onClick={() => { setStatus('input_pin'); setMessage(''); setPin(''); }}
                                variant="outline"
                                className="w-full"
                            >
                                Try Again
                            </Button>
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
                    {(status === 'input_pin' || status === 'error') && (
                        <div className="text-xs text-gray-400">
                            Secure Verification System
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyTicket;
