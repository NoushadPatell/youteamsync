// src/pages/creator/CreatorDashboard.tsx
import { useOutletContext, Link } from "react-router-dom";
import { CreatorOutletContext } from "@/types/context";
import { useEffect, useState } from "react";
import { getCreatorVideos } from "@/utilities/getCreatorVideos";
import { Button } from "@/components/ui/button";
import { Video, Users, Upload, TrendingUp, Clock, CheckCircle } from "lucide-react";

import { ActivityFeed } from '@/components/ActivityFeed';

type DashboardMetrics = {
    totalVideos: number;
    draftVideos: number;
    inReview: number;
    published: number;
};

export const CreatorDashboard = () => {
    const { email, editor } = useOutletContext<CreatorOutletContext>();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalVideos: 0,
        draftVideos: 0,
        inReview: 0,
        published: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ⚠️ USES EXISTING API CALL - no changes
        getCreatorVideos(email).then((videos) => {
            setMetrics({
                totalVideos: videos.length,
                draftVideos: videos.filter((v: { status: string; }) => v.status === 'draft').length,
                inReview: videos.filter((v: { status: string; }) => v.status === 'review').length,
                published: videos.filter((v: { status: string; }) => v.status === 'published').length
            });
            setLoading(false);
        });
    }, [email]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {email.split('@')[0]}! 👋</h1>
                    <p className="text-gray-600 mt-1">Here's what's happening with your videos today.</p>
                </div>
                <Link to="/creator/videos">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Video
                    </Button>
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Videos"
                    value={metrics.totalVideos}
                    icon={Video}
                    color="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                />
                <MetricCard
                    title="Drafts"
                    value={metrics.draftVideos}
                    icon={Clock}
                    color="from-gray-500 to-gray-600"
                    bgColor="bg-gray-50"
                    textColor="text-gray-700"
                />
                <MetricCard
                    title="In Review"
                    value={metrics.inReview}
                    icon={TrendingUp}
                    color="from-yellow-500 to-yellow-600"
                    bgColor="bg-yellow-50"
                    textColor="text-yellow-700"
                />
                <MetricCard
                    title="Published"
                    value={metrics.published}
                    icon={CheckCircle}
                    color="from-green-500 to-green-600"
                    bgColor="bg-green-50"
                    textColor="text-green-700"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/creator/videos">
                        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <Video className="w-6 h-6" />
                            <span className="font-semibold">Manage Videos</span>
                        </Button>
                    </Link>
                    <Link to="/creator/team">
                        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-purple-500 hover:bg-purple-50 transition-all">
                            <Users className="w-6 h-6" />
                            <span className="font-semibold">Manage Team</span>
                        </Button>
                    </Link>
                    <Link to="/creator/marketplace">
                        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                            <TrendingUp className="w-6 h-6" />
                            <span className="font-semibold">Find Editors</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <ActivityFeed userEmail={email} userType="creator" />

            {/* Primary Editor Info */}
            {editor && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Your Primary Editor</h3>
                            <p className="text-gray-600 mt-1">{editor}</p>
                        </div>
                        <Link to="/creator/team">
                            <Button variant="outline" className="rounded-xl">
                                View Details
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

// Metric Card Component
type MetricCardProps = {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    textColor: string;
};

const MetricCard = ({ title, value, icon: Icon, color, bgColor, textColor }: MetricCardProps) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`px-3 py-1 rounded-full ${bgColor} ${textColor} text-xs font-bold`}>
                    ACTIVE
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
            <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
    );
};