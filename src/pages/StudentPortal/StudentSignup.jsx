import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../../config/api';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import Label from '../../components/form/Label';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function StudentSignup() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await axios.post(`${API}/student-portal/signup`, { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                    <p className="text-gray-600 mb-8">
                        We've sent your login credentials to <strong>{email}</strong>.
                    </p>
                    <div className="space-y-3">
                        <Link to="/student/login">
                            <Button variant="primary" className="w-full">
                                Proceed to Login
                            </Button>
                        </Link>
                        <button
                            onClick={() => setSuccess(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Use different email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Portal Access</h1>
                    <p className="text-gray-500 mt-2">Enter your registered email to get started</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Email Address <span className="text-red-500">*</span></Label>
                        <div className="relative mt-2">
                            <Input
                                type="email"
                                placeholder="student@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="pl-11"
                            />
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-2.5 text-lg"
                        loading={loading}
                    >
                        Get Login Credentials
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Already have a password?{' '}
                        <Link to="/student/login" className="font-semibold text-blue-600 hover:text-blue-700">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
