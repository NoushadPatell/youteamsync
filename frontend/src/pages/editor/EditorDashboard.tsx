// src/pages/editor/EditorDashboard.tsx
import { useOutletContext, Link } from "react-router-dom";
import { EditorOutletContext } from "@/types/context";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";

import { ActivityFeed } from '@/components/ActivityFeed';

type AssignedVideo = {
    id: string;
    title: string;
    creatorEmail: string;
    assignedRole: string;
    taskStatus: string;
    assignedAt: string;
};

type DashboardMetrics = {
    totalTasks: number;
    assigned: number;
    inProgress: number;
    completed: number;
};

export const EditorDashboard = () => {
    const { email } = useOutletContext<EditorOutletContext>();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalTasks: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0
    });
    const [urgentTasks, setUrgentTasks] = useState<AssignedVideo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // ⚠️ USES EXISTING API ENDPOINT
            const response = await fetch(`http://localhost:5000/api/videos/editor/${email}`);
            const videos: AssignedVideo[] = await response.json();

            // Calculate metrics
            const assigned = videos.filter(v => v.taskStatus === 'assigned').length;
            const inProgress = videos.filter(v => v.taskStatus === 'in_progress').length;
            const completed = videos.filter(v => v.taskStatus === 'completed').length;

            setMetrics({
                totalTasks: videos.length,
                assigned,
                inProgress,
                completed
            });

            // Get urgent tasks (assigned or in_progress, sorted by date)
            const urgent = videos
                .filter(v => v.taskStatus === 'assigned' || v.taskStatus === 'in_progress')
                .sort((a, b) => new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime())
                .slice(0, 5);

            setUrgentTasks(urgent);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {email.split('@')[0]}! 👋</h1>
                    <p className="text-gray-600 mt-1">Here's what you're working on today.</p>
                </div>
                <Link to="/editor/tasks">
                    <Button className="bg-gradient-to-r from-success to-brand hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                        <CheckSquare className="w-4 h-4 mr-2" />
                        View All Tasks
                    </Button>
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Tasks"
                    value={metrics.totalTasks}
                    icon={CheckSquare}
                    color="from-blue-500 to-blue-600"
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                />
                <MetricCard
                    title="Assigned"
                    value={metrics.assigned}
                    icon={AlertCircle}
                    color="from-yellow-500 to-yellow-600"
                    bgColor="bg-yellow-50"
                    textColor="text-yellow-700"
                />
                <MetricCard
                    title="In Progress"
                    value={metrics.inProgress}
                    icon={Clock}
                    color="from-purple-500 to-purple-600"
                    bgColor="bg-purple-50"
                    textColor="text-purple-700"
                />
                <MetricCard
                    title="Completed"
                    value={metrics.completed}
                    icon={TrendingUp}
                    color="from-green-500 to-green-600"
                    bgColor="bg-green-50"
                    textColor="text-green-700"
                />
            </div>

            {/* Urgent Tasks Section */}
            {urgentTasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">🔥 Urgent Tasks</h2>
                        <Link to="/editor/tasks">
                            <Button variant="outline" className="rounded-xl">View All</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {urgentTasks.map((task) => (
                            <div 
                                key={task.id}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-warning-light to-error-light border-2 border-warning rounded-xl hover:shadow-md transition-shadow"
                            >
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                                    <p className="text-sm text-gray-600">
                                        Creator: {task.creatorEmail.split('@')[0]} • Role: {task.assignedRole.replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        task.taskStatus === 'assigned' 
                                            ? 'bg-warning-light text-warning-dark'
                                            : 'bg-brand-pale text-brand-dark'
                                    }`}>
                                        {task.taskStatus.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <Link to="/editor/tasks">
                                        <Button size="sm" className="rounded-lg">Work on This</Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/editor/tasks">
                        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                            <CheckSquare className="w-6 h-6" />
                            <span className="font-semibold">My Tasks</span>
                        </Button>
                    </Link>
                    <Link to="/editor/requests">
                        <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <Users className="w-6 h-6" />
                            <span className="font-semibold">Creator Requests</span>
                        </Button>
                    </Link>
                    <Button 
                        variant="outline" 
                        className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-xl border-2 hover:border-purple-500 hover:bg-purple-50 transition-all"
                        disabled
                    >
                        <TrendingUp className="w-6 h-6" />
                        <span className="font-semibold">Portfolio (Coming Soon)</span>
                    </Button>
                </div>
            </div>

            <ActivityFeed userEmail={email} userType="editor" />

            {/* No tasks message */}
            {metrics.totalTasks === 0 && (
                <div className="text-center py-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-dashed border-emerald-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-600 mb-6">Check your creator requests or wait for new assignments</p>
                    <Link to="/editor/requests">
                        <Button className="bg-gradient-to-r from-success to-brand hover:from-emerald-700 hover:to-teal-700">
                            View Creator Requests
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

// Metric Card Component (same as creator)
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