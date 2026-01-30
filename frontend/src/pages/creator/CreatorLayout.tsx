// src/pages/creator/CreatorLayout.tsx
import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { GetCookie } from "@/utilities/get_set_cookies.ts";
import { Settings, Loader2, Video, Users, ShoppingBag, Home } from "lucide-react";
import { socket } from "@/utilities/socketConnection.ts";
import { getCreatorData } from "@/utilities/api.ts";
import { Toaster } from "@/components/ui/sonner.tsx";

import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationCenter } from '@/components/layout/NotificationCenter';
import { GlobalSearch } from '@/components/layout/GlobalSearch';

import { MobileSidebar } from '@/components/layout/MobileSidebar';

export const CreatorLayout = () => {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [editor, setEditor] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // ⚠️ EXACT SAME LOGIC as CreatorPage - DO NOT MODIFY
    useEffect(() => {
        const cookie = GetCookie('creator');
        if (cookie) {
            const { email } = JSON.parse(cookie);
            setEmail(email as string);

            getCreatorData(email).then((data) => {
                setEditor(data.editor as string);
                setLoading(false);
            }).catch(() => {
                setLoading(false);
            });

            socket.on("connect", () => {
                socket.emit("createMapping", email);
            });
        } else {
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    // Loading state (same as CreatorPage)
    if (loading) {
        return (
            <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
                <div className="relative mb-6">
                    <Loader2 className="animate-spin w-16 h-16 text-purple-600" />
                    <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                </div>
                <p className="text-xl text-gray-700 font-semibold">Loading your workspace...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
            </div>
        );
    }

    // Navigation items
    const navItems = [
        { path: '/creator', label: 'Dashboard', icon: Home },
        { path: '/creator/videos', label: 'Videos', icon: Video },
        { path: '/creator/team', label: 'Team', icon: Users },
        { path: '/creator/marketplace', label: 'Find Editors', icon: ShoppingBag },
        { path: '/creator/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <NotificationProvider userEmail={email}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                {/* Header */}
                <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            {/* 🆕 ADD Mobile Menu */}
                            <div className="flex items-center gap-3">
                                <MobileSidebar navItems={navItems} />

                                <Link to="/creator" className="flex items-center gap-3 px-4 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <svg className="w-6 sm:w-8 h-6 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                                    </svg>
                                    {/* Hide text on mobile */}
                                    <span className="hidden sm:inline font-extrabold text-xl sm:text-2xl text-white tracking-tight">YouTeamSync</span>
                                </Link>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Search - hide on mobile */}
                                <div className="hidden lg:block">
                                    <GlobalSearch userEmail={email} userType="creator" />
                                </div>

                                <NotificationCenter />

                                <div className="hidden sm:flex items-center gap-2 bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700">{email.split('@')[0]}</span>
                                    <span className="text-xs text-gray-500">• Creator</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex">
                    {/* Desktop Sidebar - hide on mobile */}
                    <aside className="hidden md:block w-64 min-h-[calc(100vh-80px)] bg-white border-r border-gray-200 shadow-sm">
                        <nav className="p-4 space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-semibold">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>
                    {/* Main Content - responsive padding */}
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">
                        <Outlet context={{ email, editor, setEditor }} />
                    </main>
                </div>

                <Toaster />
            </div>
        </NotificationProvider>
    );
};