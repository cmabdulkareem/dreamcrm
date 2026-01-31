import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios directly for login call if not using context
import API from '../../config/api'; // Assuming this exists
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/input/Input';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function StudentLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // We can reuse the main login flow if it supports 'Student' role
            // Assuming context login handles standard auth
            // If specific student login endpoint is needed, we'd use that
            const res = await axios.post(`${API}/users/login`, { email, password }, {
                withCredentials: true
            });

            if (res.data.user && res.data.user.roles.includes('Student')) {
                await login(res.data.user, res.data.role, res.data.token);
                navigate('/student/dashboard');
            } else {
                setError('Access denied. This portal is for students only.');
                // Optionally force logout if they logged in as staff
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Student Login</h1>
                    <p className="text-gray-500 mt-2">Welcome back! Please login to your portal.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={Mail}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        icon={Lock}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full py-2.5 text-lg"
                        loading={loading}
                    >
                        Login
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-500">
                        First time here?{' '}
                        <Link to="/student/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                            Get Credentials
                        </Link>
                    </p>
                    <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600">
                        Forgot Password?
                    </Link>
                </div>
            </div>
        </div>
    );
}
