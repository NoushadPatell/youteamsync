// src/pages/editor/MyTasks.tsx
import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { EditorOutletContext } from "@/types/context";
import { Video } from "@/components/Video.tsx";
import { Loader2 } from "lucide-react";

type AssignedVideo = {
    id: string;
    title: string;
    description: string;
    tags: string;
    category: string;
    privacyStatus: string;
    filepath: string;
    fileUrl: string;
    thumbNailPath: string;
    thumbNailUrl: string;
    rating: number;
    editedBy: string;
    youtubeId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    creatorEmail: string;
    assignedRole: string;
    taskStatus: string;
    assignedAt: string;
    taskNotes: string;
};

export const MyTasks = () => {
    const { email } = useOutletContext<EditorOutletContext>();
    const [assignedVideos, setAssignedVideos] = useState<AssignedVideo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignedVideos = useCallback(async () => {
        try {
            // ⚠️ EXACT SAME API CALL from EditorPage
            const response = await fetch(`http://localhost:5000/api/videos/editor/${email}`);
            const videos = await response.json();
            console.log('Fetched videos:', videos);
            setAssignedVideos(videos || []);
        } catch (error) {
            console.error("Error fetching assigned videos:", error);
        } finally {
            setLoading(false);
        }
    }, [email]);

    useEffect(() => {
        fetchAssignedVideos();
    }, [fetchAssignedVideos]);

    // ⚠️ EXACT SAME DISPATCH from EditorPage
    const dispatch = useCallback((action: { type: string; payload: any }) => {
        switch (action.type) {
            case 'updateVideoInfo':
                setAssignedVideos(prev =>
                    prev.map(v => v.id === action.payload.id ? { ...v, ...action.payload } : v)
                );
                break;
            case 'deleteVideo':
                setAssignedVideos(prev => prev.filter(v => v.id !== action.payload));
                break;
        }
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <Loader2 className="animate-spin w-16 h-16 text-emerald-600" />
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
                </div>
                <p className="mt-6 text-gray-600 font-medium">Loading your tasks...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Assigned Tasks</h1>
                    <p className="text-gray-600 mt-1">Videos assigned to you by creators</p>
                </div>
                {assignedVideos.length > 0 && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-xl border border-emerald-200">
                        <span className="font-bold text-emerald-900">{assignedVideos.length}</span>
                        <span className="text-sm text-emerald-700">tasks</span>
                    </div>
                )}
            </div>

            {/* Content */}
            {assignedVideos.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-dashed border-emerald-300">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks assigned yet</h3>
                    <p className="text-gray-600">Wait for creators to assign videos to you, or check your creator requests</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {assignedVideos.map((video) => (
                        <div key={video.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-4">
                            {/* Task Info Banner */}
                            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700">Your Role:</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                                            {video.assignedRole?.replace('_', ' ') || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700">Status:</span>
                                        <span className={`px-3 py-1 rounded-full font-bold ${
                                            video.taskStatus === 'completed'
                                                ? 'bg-green-100 text-green-700'
                                                : video.taskStatus === 'in_progress'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {video.taskStatus?.replace('_', ' ') || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-700">Creator:</span>
                                        <span className="text-gray-900">{video.creatorEmail || 'Unknown'}</span>
                                    </div>
                                    {video.taskNotes && (
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="font-semibold text-gray-700">Notes:</span>
                                            <span className="italic text-gray-600">{video.taskNotes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ⚠️ EXACT SAME Video component usage */}
                            <Video
                                video={video}
                                dispatch={dispatch}
                                creatorEmail={video.creatorEmail || ''}
                                userType="editor"
                                editorEmail={email}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};