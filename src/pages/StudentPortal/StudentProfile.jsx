import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

export default function StudentProfile() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="h-32 bg-blue-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6">
                        <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg inline-block">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl">
                                    {user.fullName.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                    <p className="text-gray-500">{user.email}</p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3 text-gray-700">
                            <User className="w-5 h-5 text-gray-400" />
                            <span>User ID: {user.employeeCode || user.id}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span>{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span>{user.location || user.state || 'Location not set'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            <span>{user.designation}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                        <label className="block text-gray-500 mb-1">Date of Birth</label>
                        <p className="font-medium">{user.dob ? new Date(user.dob).toLocaleDateString() : 'Not provided'}</p>
                    </div>
                    <div>
                        <label className="block text-gray-500 mb-1">Gender</label>
                        <p className="font-medium capitalize">{user.gender}</p>
                    </div>
                    <div>
                        <label className="block text-gray-500 mb-1">Blood Group</label>
                        <p className="font-medium">{user.bloodGroup || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
