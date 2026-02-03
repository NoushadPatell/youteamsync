// src/pages/creator/AnalyticsPage.tsx (CREATE NEW FILE)
import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CreatorOutletContext } from '@/types/context';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Video, Clock, Star, Users } from 'lucide-react';

type AnalyticsData = {
    statusDistribution: { status: string; count: number }[];
    videosOverTime: { date: string; count: number }[];
    editorPerformance: { editor: string; videos_completed: number; avg_rating: number; avg_hours: number }[];
    avgTimeToPublish: number;
    taskStats: { task_status: string; count: number }[];
};

const STATUS_COLORS = {
    draft: '#6B7280',     // Keep gray
    editing: '#6A89A7',   // brand main
    review: '#F59E0B',    // warning
    approved: '#8B5CF6',  // info
    published: '#10B981'
};

const TASK_COLORS = {
    assigned: '#F59E0B',    // warning
    in_progress: '#6A89A7', // brand main
    completed: '#10B981'
};

export const AnalyticsPage = () => {
    const { email } = useOutletContext<CreatorOutletContext>();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');

    const fetchAnalytics = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/analytics/creator/${email}?period=${period}`);
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Analytics fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [email, period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600"></div>
            </div>
        );
    }

    if (!analytics) {
        return <div className="text-center py-12">Failed to load analytics</div>;
    }

    // Calculate totals
    const totalVideos = analytics.statusDistribution.reduce((sum, item) => sum + parseInt(item.count.toString()), 0);
    const totalTasks = analytics.taskStats.reduce((sum, item) => sum + parseInt(item.count.toString()), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Insights into your video production workflow</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Videos"
                    value={totalVideos}
                    icon={Video}
                    color="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                />
                <MetricCard
                    title="Avg. Time to Publish"
                    value={`${Math.round(analytics.avgTimeToPublish)} days`}
                    icon={Clock}
                    color="from-purple-500 to-purple-600"
                    bgColor="bg-purple-50"
                    textColor="text-purple-700"
                />
                <MetricCard
                    title="Active Tasks"
                    value={totalTasks}
                    icon={TrendingUp}
                    color="from-emerald-500 to-emerald-600"
                    bgColor="bg-emerald-50"
                    textColor="text-emerald-700"
                />
                <MetricCard
                    title="Team Members"
                    value={analytics.editorPerformance.length}
                    icon={Users}
                    color="from-orange-500 to-orange-600"
                    bgColor="bg-orange-50"
                    textColor="text-orange-700"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Status Distribution */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Video Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.statusDistribution}
                                dataKey="count"
                                nameKey="status"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(entry: { status: any; count: any; }) => `${entry.status}: ${entry.count}`}
                            >
                                {analytics.statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#6B7280'} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Videos Over Time */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Videos Uploaded Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.videosOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={2} name="Videos" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Task Status Breakdown */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Task Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.taskStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="task_status" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" name="Tasks">
                                {analytics.taskStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TASK_COLORS[entry.task_status as keyof typeof TASK_COLORS] || '#6B7280'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Editor Performance */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Editor Performance</h3>
                    {analytics.editorPerformance.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-auto">
                            {analytics.editorPerformance.map((editor, index) => {
                                // ✅ Bulletproof number conversion
                                const safeNumber = (value: any, decimals = 0): string | number => {
                                    if (value === null || value === undefined) return decimals > 0 ? 'N/A' : 0;
                                    const num = Number(value);
                                    if (isNaN(num)) return decimals > 0 ? 'N/A' : 0;
                                    return decimals > 0 ? num.toFixed(decimals) : Math.round(num);
                                };

                                const avgRating = safeNumber(editor.avg_rating, 1);
                                const avgHours = safeNumber(editor.avg_hours);
                                const videosCompleted = safeNumber(editor.videos_completed);

                                return (
                                    <div key={index} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900 truncate">
                                                {editor.editor.split('@')[0]}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                <span className="font-bold text-gray-900">
                                                    {avgRating}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>{videosCompleted} videos</span>
                                            <span>~{avgHours}h avg</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No editor performance data yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Metric Card Component
type MetricCardProps = {
    title: string;
    value: string | number;
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
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );
};