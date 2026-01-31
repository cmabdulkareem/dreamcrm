import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    User,
    CalendarCheck,
    LogOut,
    Menu,
    X,
    BookOpen
} from 'lucide-react';
import Button from '../../components/ui/button/Button';

export default function StudentPortalLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/student/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
        { name: 'Request', path: '/student/requests', icon: BookOpen },
        { name: 'Profile', path: '/student/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
                    <BookOpen className="w-6 h-6" />
                    <span>Student Portal</span>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-2 font-bold text-xl text-blue-600">
                        <BookOpen className="w-6 h-6" />
                        <span>Student Portal</span>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="px-4 mb-6">
                            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {user?.fullName?.charAt(0) || 'S'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm truncate" title={user?.fullName}>{user?.fullName}</p>
                                    <p className="text-xs text-blue-500 truncate" title={user?.email}>{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="px-2 space-y-1">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
