import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Download, Trash2, Edit, Play, CheckCircle, UploadCloud } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TaskAssignment } from "@/components/TaskAssignment";

type videoInfoType = {
    filepath: string,
    fileUrl: string,
    id: string,
    title: string,
    description: string,
    tags: string,
    category: string,
    privacyStatus: string,
    thumbNailUrl: string,
    thumbNailPath: string,
    rating: number,
    editedBy: string,
    youtubeId: string,
    status: string,
    createdAt: string,
    updatedAt: string
}

type videoMetaInfoType = {
    title: string,
    description: string,
    tags: string,
    category: string,
    privacyStatus: string
}

const YOUTUBE_CATEGORIES = [
    { value: "1", label: "Film & Animation" },
    { value: "2", label: "Autos & Vehicles" },
    { value: "10", label: "Music" },
    { value: "15", label: "Pets & Animals" },
    { value: "17", label: "Sports" },
    { value: "19", label: "Travel & Events" },
    { value: "20", label: "Gaming" },
    { value: "22", label: "People & Blogs" },
    { value: "23", label: "Comedy" },
    { value: "24", label: "Entertainment" },
    { value: "25", label: "News & Politics" },
    { value: "26", label: "Howto & Style" },
    { value: "27", label: "Education" },
    { value: "28", label: "Science & Technology" }
];

const STATUS_CONFIG: { [key: string]: { bg: string, text: string, label: string } } = {
    'draft': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'DRAFT' },
    'editing': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'IN PROGRESS' },
    'review': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'IN REVIEW' },
    'approved': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'APPROVED' },
    'published': { bg: 'bg-green-100', text: 'text-green-700', label: 'PUBLISHED' }
};

type TaskAssignment = {
    id: number;
    editor_email: string;
    role: string;
    task_status: string;
    notes: string;
};

const ROLE_ICONS: { [key: string]: string } = {
    'video_editor': '🎬',
    'thumbnail_designer': '🖼️',
    'metadata_manager': '📝'
};

export const Video = memo(({ video, dispatch, creatorEmail, userType, editorEmail }: {
    creatorEmail: string,
    editorEmail: string,
    dispatch: React.Dispatch<{ type: string, payload: any }>,
    userType: string,
    video: videoInfoType,
}) => {
    const thumbNailRef = useRef<HTMLInputElement>(null);
    const videoFileRef = useRef<HTMLInputElement>(null);
    const promptInfo = useRef<HTMLButtonElement>(null);
    const streamDialog = useRef<HTMLButtonElement>(null);
    const replaceDialog = useRef<HTMLButtonElement>(null);

    const [videoInfo, setVideoInfo] = useState<videoMetaInfoType>({
        title: video.title,
        description: video.description,
        tags: video.tags,
        category: video.category,
        privacyStatus: video.privacyStatus
    });
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [replacingVideo, setReplacingVideo] = useState(false);

    const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    const updateVideoInfoFunc = useCallback(async () => {
        try {
            let thumbNailUrl = video.thumbNailUrl;
            let thumbNailPath = video.thumbNailPath;
            let thumbnailUpdated = false;

            if (thumbNailRef.current?.files?.[0]) {
                const file = thumbNailRef.current.files[0];
                const fileName = file.name;
                const arr = fileName.split('.');
                const fileExt = arr[arr.length - 1];
                const currDateTime = (new Date().getTime()).toString();
                const hash = btoa(currDateTime + creatorEmail).replace(/[^a-zA-Z0-9]/g, '');
                thumbNailPath = hash + "." + fileExt;

                const formData = new FormData();
                formData.append('file', file);
                formData.append('filename', thumbNailPath);
                formData.append('editorEmail', userType === 'editor' ? editorEmail : creatorEmail);
                formData.append('videoId', video.id);

                const thumbnailResponse = await fetch(
                    `http://localhost:5000/api/thumbnail/upload?editorEmail=${userType === 'editor' ? editorEmail : creatorEmail}&videoId=${video.id}`,
                    {
                        method: 'POST',
                        body: formData
                    }
                );

                if (!thumbnailResponse.ok) {
                    const error = await thumbnailResponse.json();
                    throw new Error(error.error || 'Thumbnail upload failed');
                }

                thumbNailUrl = thumbNailPath;
                thumbnailUpdated = true;
            }

            const metadataChanged =
                videoInfo.title !== video.title ||
                videoInfo.description !== video.description ||
                videoInfo.tags !== video.tags ||
                videoInfo.category !== video.category ||
                videoInfo.privacyStatus !== video.privacyStatus;

            if (metadataChanged || thumbnailUpdated) {
                let newStatus = video.status;
                if (userType === 'editor' && video.status === 'draft') {
                    newStatus = 'editing';
                }

                const updateData = {
                    ...videoInfo,
                    thumbNailPath,
                    thumbNailUrl,
                    status: newStatus,
                    editedBy: userType === 'editor' ? editorEmail : video.editedBy,
                    editorEmail: userType === 'editor' ? editorEmail : creatorEmail
                };

                const response = await fetch(
                    `http://localhost:5000/api/videos/${creatorEmail}/${video.id}?editorEmail=${userType === 'editor' ? editorEmail : creatorEmail}`,
                    {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Update failed');
                }

                dispatch({
                    type: 'updateVideoInfo',
                    payload: {
                        ...video,
                        ...videoInfo,
                        thumbNailPath,
                        thumbNailUrl,
                        status: newStatus,
                        editedBy: userType === 'editor' ? editorEmail : video.editedBy
                    }
                });

                alert("Updated successfully!");
            } else {
                alert("No changes to save");
            }
        } catch (e) {
            console.error(e);
            alert("Update Error: " + (e as Error).message);
        }
    }, [creatorEmail, dispatch, video, videoInfo, userType, editorEmail]);

    const replaceVideoFunc = useCallback(async () => {
        try {
            if (!videoFileRef.current?.files?.[0]) {
                alert("Please select a video file");
                return;
            }

            setReplacingVideo(true);
            const file = videoFileRef.current.files[0];
            const fileName = file.name;
            const arr = fileName.split('.');
            const fileExt = arr[arr.length - 1];
            const currDateTime = (new Date().getTime()).toString();
            const hash = btoa(currDateTime + creatorEmail).replace(/[^a-zA-Z0-9]/g, '');
            const filename = hash + "." + fileExt;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('filename', filename);
            formData.append('editorEmail', editorEmail);

            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/replace?editorEmail=${editorEmail}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Replace failed');
            }

            dispatch({
                type: 'updateVideoInfo',
                payload: {
                    ...video,
                    fileUrl: filename,
                    filepath: filename
                }
            });

            alert("Video replaced successfully!");
            if (videoFileRef.current) {
                videoFileRef.current.value = '';
            }
        } catch (e) {
            console.error('Replace error:', e);
            alert("Error replacing video: " + (e as Error).message);
        } finally {
            setReplacingVideo(false);
        }
    }, [creatorEmail, dispatch, video, editorEmail]);

    const fetchAssignments = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/assignments/${video.id}`);
            const data = await response.json();
            setAssignments(data.assignments || []);
        } catch (err) {
            console.error('Error fetching assignments:', err);
        } finally {
            setLoadingAssignments(false);
        }
    }, [video.id]);

    useEffect(() => {
        if (userType === 'creator' || userType === 'editor') {
            fetchAssignments();
        }
    }, [fetchAssignments, userType]);

    const markMyTaskReady = useCallback(async () => {
        if (!confirm("Mark your task as ready for creator review?")) return;

        try {
            const myAssignment = assignments.find(a => a.editor_email === editorEmail);
            if (!myAssignment) {
                alert("No assignment found for you");
                return;
            }

            const response = await fetch(`http://localhost:5000/api/assignments/${myAssignment.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'completed' })
            });

            if (!response.ok) throw new Error('Failed to update task');

            alert("Task marked as ready!");
            fetchAssignments();

        } catch (e) {
            console.error(e);
            alert("Error: " + (e as Error).message);
        }
    }, [assignments, editorEmail, fetchAssignments]);

    const deleteVideoFunc = useCallback(async () => {
        if (!confirm("Are you sure you want to delete this video?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            dispatch({ type: 'deleteVideo', payload: video.id });
            alert("Video deleted successfully");
        } catch (e) {
            console.error(e);
            alert("Error deleting video");
        }
    }, [creatorEmail, dispatch, video]);

    const approveVideo = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/approve`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Approve failed');

            dispatch({
                type: 'updateVideoInfo',
                payload: { ...video, status: 'approved' }
            });

            alert("Video approved! You can now publish to YouTube.");
        } catch (e) {
            console.error(e);
            alert("Error approving video");
        }
    }, [creatorEmail, video, dispatch]);

    const markAsReady = useCallback(async () => {
        if (!confirm("Mark this video as ready for creator review?")) return;

        try {
            const assignmentResponse = await fetch(`http://localhost:5000/api/assignments/video/${video.id}/editor/${editorEmail}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed'
                })
            });

            if (!assignmentResponse.ok) {
                console.error('Failed to update assignment status');
            }

            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}?editorEmail=${editorEmail}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...videoInfo,
                    thumbNailPath: video.thumbNailPath,
                    thumbNailUrl: video.thumbNailUrl,
                    status: 'review',
                    editedBy: editorEmail,
                    editorEmail: editorEmail
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Update failed');
            }

            dispatch({
                type: 'updateVideoInfo',
                payload: { ...video, status: 'review', editedBy: editorEmail }
            });

            alert("Video marked as ready for review! Creator will be notified.");
        } catch (e) {
            console.error(e);
            alert("Error marking as ready: " + (e as Error).message);
        }
    }, [creatorEmail, video, videoInfo, editorEmail, dispatch]);

    const publishToYoutube = useCallback(async () => {
        if (uploadingVideo) return;

        if (!confirm("Publish this video to YouTube?")) return;

        setUploadingVideo(true);

        try {
            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: video.id, email: creatorEmail })
            });

            const result = await response.json();

            if (result.data) {
                alert(result.data);
                dispatch({
                    type: 'updateVideoInfo',
                    payload: { ...video, status: 'published', youtubeId: result.youtubeId }
                });
            } else {
                alert(result.error || "Upload failed");
            }
        } catch (err) {
            alert("Bad Request");
            console.error(err);
        } finally {
            setUploadingVideo(false);
        }
    }, [creatorEmail, uploadingVideo, video, dispatch]);

    const downloadVideo = useCallback(() => {
        const url = `http://localhost:5000/api/videos/${creatorEmail}/${video.id}/download?editorEmail=${userType === 'editor' ? editorEmail : creatorEmail}`;
        window.open(url, '_blank');
    }, [creatorEmail, video.id, userType, editorEmail]);

    const myAssignment = assignments.find(a => a.editor_email === editorEmail);
    const canMarkMyTaskReady = userType === 'editor' && myAssignment && myAssignment.task_status !== 'completed';
    const allTasksCompleted = assignments.length > 0 && assignments.every(a => a.task_status === 'completed');

    const canEdit = userType === 'creator' || (userType === 'editor' && video.status !== 'published');
    const canApprove = userType === 'creator' && allTasksCompleted && video.status !== 'approved';
    const canPublish = userType === 'creator' && video.status === 'approved' && !video.youtubeId;
    const canReplace = userType === 'editor' && video.status !== 'published';

    const statusConfig = STATUS_CONFIG[video.status] || STATUS_CONFIG['draft'];

    return (
        <>
            {/* Edit Metadata Dialog */}
            <Dialog>
                <DialogTrigger ref={promptInfo} hidden />
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Video Metadata</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            {userType === 'editor'
                                ? "Edit and optimize video details for YouTube"
                                : "Review and edit video metadata"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="font-semibold">Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter video title"
                                value={videoInfo.title}
                                onChange={(e) => setVideoInfo({ ...videoInfo, title: e.target.value })}
                                disabled={!canEdit}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description" className="font-semibold">Description</Label>
                            <Textarea
                                id="description"
                                className="resize-none min-h-[120px] rounded-xl"
                                placeholder="Enter video description"
                                value={videoInfo.description}
                                onChange={(e) => setVideoInfo({ ...videoInfo, description: e.target.value })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tags" className="font-semibold">Tags</Label>
                            <Input
                                id="tags"
                                placeholder="gaming, tutorial, funny (comma separated)"
                                value={videoInfo.tags}
                                onChange={(e) => setVideoInfo({ ...videoInfo, tags: e.target.value })}
                                disabled={!canEdit}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="category" className="font-semibold">Category</Label>
                            <Select
                                value={videoInfo.category}
                                onValueChange={(value) => setVideoInfo({ ...videoInfo, category: value })}
                                disabled={!canEdit}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {YOUTUBE_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="privacy" className="font-semibold">Privacy</Label>
                            <Select
                                value={videoInfo.privacyStatus}
                                onValueChange={(value) => setVideoInfo({ ...videoInfo, privacyStatus: value })}
                                disabled={!canEdit}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select privacy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="thumbnail" className="font-semibold">Thumbnail</Label>
                            <div className="flex gap-2">
                                {video.thumbNailUrl && (
                                    <Button variant="outline" className="rounded-xl" size="sm">
                                        <a href={`http://localhost:5000/api/thumbnail/${video.thumbNailUrl}`} target="_blank" rel="noopener noreferrer">
                                            View Current
                                        </a>
                                    </Button>
                                )}
                                <Input
                                    id="thumbnail"
                                    type="file"
                                    className="flex-grow rounded-xl"
                                    accept="image/*"
                                    ref={thumbNailRef}
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
                        </DialogClose>
                        {canEdit && (
                            <DialogClose asChild>
                                <Button type="button" onClick={updateVideoInfoFunc} className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                    Save Changes
                                </Button>
                            </DialogClose>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stream Video Dialog */}
            <Dialog>
                <DialogTrigger ref={streamDialog} hidden />
                <DialogContent className="max-w-4xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Preview Video</DialogTitle>
                        <DialogDescription>Stream and preview your video</DialogDescription>
                    </DialogHeader>
                    <div className="w-full">
                        <video
                            controls
                            className="w-full rounded-xl shadow-lg"
                            src={`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/stream?editorEmail=${userType === 'editor' ? editorEmail : creatorEmail}`}
                        >
                            Your browser does not support video playback.
                        </video>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" className="rounded-xl">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Replace Video Dialog */}
            <Dialog>
                <DialogTrigger ref={replaceDialog} hidden />
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Upload Edited Version</DialogTitle>
                        <DialogDescription>
                            Replace the current video with your edited version
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="videoFile" className="font-semibold">Video File</Label>
                            <Input
                                id="videoFile"
                                type="file"
                                className="rounded-xl"
                                accept="video/*"
                                ref={videoFileRef}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={replaceVideoFunc}
                            disabled={replacingVideo}
                            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                            {replacingVideo ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                    Uploading...
                                </>
                            ) : (
                                "Upload Edited Video"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Video Card */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-grow">
                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 font-semibold px-3 py-1`}>
                                    {statusConfig.label}
                                </Badge>
                                {video.editedBy && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        ✏️ Edited by: {video.editedBy.split('@')[0]}
                                    </Badge>
                                )}
                                {video.youtubeId && (
                                    <Badge className="bg-red-100 text-red-700 border-0">
                                        <a
                                            href={`https://youtube.com/watch?v=${video.youtubeId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1"
                                        >
                                            📺 Watch on YouTube
                                        </a>
                                    </Badge>
                                )}
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 mb-2">{video.title}</h3>
                            {video.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{video.description}</p>
                            )}
                            {video.tags && (
                                <div className="flex gap-2 flex-wrap">
                                    {video.tags.split(',').slice(0, 5).map((tag, i) => (
                                        <span key={i} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Task Assignments Section */}
                    {assignments.length > 0 && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h4 className="font-semibold text-gray-900">Task Assignments</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                                            assignment.task_status === 'completed' 
                                                ? 'bg-green-50 border-green-300' 
                                                : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <span className="text-lg">{ROLE_ICONS[assignment.role] || '📋'}</span>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs font-semibold text-gray-900 truncate">
                                                {assignment.editor_email.split('@')[0]}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {assignment.role.replace('_', ' ')}
                                            </p>
                                        </div>
                                        {assignment.task_status === 'completed' && (
                                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons Section */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Preview Button */}
                            <Button
                                title="Preview Video"
                                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                size="sm"
                                onClick={() => streamDialog.current?.click()}
                            >
                                <Play className="w-4 h-4 mr-2" />
                                Preview
                            </Button>

                            {/* Edit Button */}
                            {canEdit && (
                                <Button
                                    title="Edit Metadata"
                                    variant="outline"
                                    className="rounded-xl"
                                    size="sm"
                                    onClick={() => promptInfo.current?.click()}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}

                            {/* Download Button */}
                            <Button
                                title="Download Video"
                                variant="outline"
                                className="rounded-xl"
                                size="sm"
                                onClick={downloadVideo}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Replace Video (Editor Only) */}
                            {canReplace && (
                                <Button
                                    title="Upload Edited Version"
                                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                                    size="sm"
                                    onClick={() => replaceDialog.current?.click()}
                                >
                                    <UploadCloud className="w-4 h-4 mr-2" />
                                    Upload Edit
                                </Button>
                            )}

                            {/* Mark Task Ready (Editor) */}
                            {canMarkMyTaskReady && (
                                <Button
                                    title="Mark My Task as Ready"
                                    className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    size="sm"
                                    onClick={markMyTaskReady}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Ready
                                </Button>
                            )}

                            {/* Approve (Creator) */}
                            {canApprove && (
                                <Button
                                    title="Approve All Tasks"
                                    className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                    size="sm"
                                    onClick={approveVideo}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve All
                                </Button>
                            )}

                            {/* Publish (Creator) */}
                            {canPublish && (
                                <Button
                                    title="Publish to YouTube"
                                    className="rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                    size="sm"
                                    disabled={uploadingVideo}
                                    onClick={publishToYoutube}
                                >
                                    {uploadingVideo ? (
                                        <>
                                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                            Publishing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Publish
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Delete (Creator Only) */}
                            {userType === 'creator' && (
                                <Button
                                    variant="destructive"
                                    onClick={deleteVideoFunc}
                                    className="rounded-xl"
                                    size="sm"
                                    title="Delete Video"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Task Assignment Component */}
                    {userType === 'creator' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <TaskAssignment videoId={video.id} creatorEmail={creatorEmail} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
});