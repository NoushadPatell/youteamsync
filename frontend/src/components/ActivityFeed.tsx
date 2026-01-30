import { useEffect, useState, useCallback } from 'react';
import { Clock, Video, Users, CheckCircle, Upload } from 'lucide-react';
type Activity = {
    id: string;
    type: 'video_upload' | 'video_published' | 'task_assigned' | 'task_completed' | 'team_added';
    title: string;
    description: string;
    timestamp: Date;
    icon: React.ReactNode;
    color: string;
};
export const ActivityFeed = ({ userEmail, userType }: { userEmail: string; userType: 'creator' | 'editor' }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        try {
            // Fetch recent videos and derive activities
            const videosResponse = await fetch(`http://localhost:5000/api/videos/${userEmail}`);
            const videos = await videosResponse.json();

            const recentActivities: Activity[] = [];

            // Get recent video uploads (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            videos.forEach((video: any) => {
                const createdAt = new Date(video.createdAt);
                const updatedAt = new Date(video.updatedAt);

                // Video uploaded
                if (createdAt > weekAgo) {
                    recentActivities.push({
                        id: `upload-${video.id}`,
                        type: 'video_upload',
                        title: 'Video Uploaded',
                        description: `"${video.title}" was uploaded`,
                        timestamp: createdAt,
                        icon: <Upload className="w-4 h-4" />,
                        color: 'bg-blue-100 text-blue-700'
                    });
                }

                // Video published
                if (video.status === 'published' && updatedAt > weekAgo) {
                    recentActivities.push({
                        id: `publish-${video.id}`,
                        type: 'video_published',
                        title: 'Video Published',
                        description: `"${video.title}" is now live on YouTube`,
                        timestamp: updatedAt,
                        icon: <CheckCircle className="w-4 h-4" />,
                        color: 'bg-green-100 text-green-700'
                    });
                }
            });

            // Sort by timestamp
            recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

            setActivities(recentActivities.slice(0, 10)); // Show last 10
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
            </h2>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                                {activity.icon}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                                <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                                {getTimeAgo(activity.timestamp)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};