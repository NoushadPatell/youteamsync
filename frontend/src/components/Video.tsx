import React, { memo, useCallback, useRef, useState } from "react";
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

const STATUS_COLORS: { [key: string]: string } = {
    'draft': 'bg-gray-500',
    'editing': 'bg-blue-500',
    'review': 'bg-yellow-500',
    'approved': 'bg-purple-500',
    'published': 'bg-green-500'
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

    const updateVideoInfoFunc = useCallback(async () => {
        try {
            let thumbNailUrl = video.thumbNailUrl;
            let thumbNailPath = video.thumbNailPath;
            let thumbnailUpdated = false;

            // STEP 1: Handle thumbnail upload SEPARATELY
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

            // STEP 2: Determine what's being updated
            const metadataChanged =
                videoInfo.title !== video.title ||
                videoInfo.description !== video.description ||
                videoInfo.tags !== video.tags ||
                videoInfo.category !== video.category ||
                videoInfo.privacyStatus !== video.privacyStatus;

            // STEP 3: Update metadata if changed (only if user has permission)
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

            console.log('Replacing video:', { filename, fileSize: file.size });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('filename', filename);
            formData.append('editorEmail', editorEmail); // ADD THIS

            const response = await fetch(`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/replace?editorEmail=${editorEmail}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Replace response:', result);

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
            // First, update the video assignment task status to completed
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

            // Then update video metadata to mark as ready for review
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

    const canEdit = userType === 'creator' || (userType === 'editor' && video.status !== 'published');
    const canApprove = userType === 'creator' && video.status === 'review';
    const canPublish = userType === 'creator' && video.status === 'approved' && !video.youtubeId;
    const canReplace = userType === 'editor' && video.status !== 'published';
    const canMarkReady = userType === 'editor' && (video.status === 'draft' || video.status === 'editing');

    return (
        <>
            {/* Edit Metadata Dialog */}
            <Dialog>
                <DialogTrigger ref={promptInfo} hidden />
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Video Metadata</DialogTitle>
                        <DialogDescription>
                            {userType === 'editor'
                                ? "Edit and optimize video details for YouTube"
                                : "Review and edit video metadata"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title:</Label>
                            <Input
                                id="title"
                                className="col-span-3"
                                placeholder="Enter video title"
                                value={videoInfo.title}
                                onChange={(e) => setVideoInfo({ ...videoInfo, title: e.target.value })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Description:</Label>
                            <Textarea
                                id="description"
                                className="col-span-3 resize-none min-h-[100px]"
                                placeholder="Enter video description"
                                value={videoInfo.description}
                                onChange={(e) => setVideoInfo({ ...videoInfo, description: e.target.value })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">Tags:</Label>
                            <Input
                                id="tags"
                                className="col-span-3"
                                placeholder="gaming, tutorial, funny (comma separated)"
                                value={videoInfo.tags}
                                onChange={(e) => setVideoInfo({ ...videoInfo, tags: e.target.value })}
                                disabled={!canEdit}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category:</Label>
                            <Select
                                value={videoInfo.category}
                                onValueChange={(value) => setVideoInfo({ ...videoInfo, category: value })}
                                disabled={!canEdit}
                            >
                                <SelectTrigger className="col-span-3">
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="privacy" className="text-right">Privacy:</Label>
                            <Select
                                value={videoInfo.privacyStatus}
                                onValueChange={(value) => setVideoInfo({ ...videoInfo, privacyStatus: value })}
                                disabled={!canEdit}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select privacy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="thumbnail" className="text-right">Thumbnail:</Label>
                            {video.thumbNailUrl && (
                                <Button variant="link" className="col-span-1">
                                    <a
                                        href={`http://localhost:5000/api/thumbnail/${video.thumbNailUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Current
                                    </a>
                                </Button>
                            )}
                            <Input
                                id="thumbnail"
                                type="file"
                                className={video.thumbNailUrl ? "col-span-2" : "col-span-3"}
                                accept="image/*"
                                ref={thumbNailRef}
                                disabled={!canEdit}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        {canEdit && (
                            <DialogClose asChild>
                                <Button type="button" onClick={updateVideoInfoFunc}>
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
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Preview Video</DialogTitle>
                        <DialogDescription>Stream and preview your video</DialogDescription>
                    </DialogHeader>
                    <div className="w-full">
                        <video
                            controls
                            className="w-full rounded-lg"
                            src={`http://localhost:5000/api/videos/${creatorEmail}/${video.id}/stream?editorEmail=${userType === 'editor' ? editorEmail : creatorEmail}`}
                        >
                            Your browser does not support video playback.
                        </video>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Replace Video Dialog */}
            <Dialog>
                <DialogTrigger ref={replaceDialog} hidden />
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Edited Version</DialogTitle>
                        <DialogDescription>
                            Replace the current video with your edited version
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="videoFile" className="text-right">Video File:</Label>
                            <Input
                                id="videoFile"
                                type="file"
                                className="col-span-3"
                                accept="video/*"
                                ref={videoFileRef}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            type="button"
                            onClick={replaceVideoFunc}
                            disabled={replacingVideo}
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
            <div className="flex justify-between p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 items-center gap-4 max-sm:flex-col transition-colors">
                <div className="flex flex-col gap-2 flex-grow max-sm:self-start">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={STATUS_COLORS[video.status]}>
                            {video.status.toUpperCase()}
                        </Badge>
                        {video.editedBy && (
                            <Badge variant="outline">Edited by: {video.editedBy}</Badge>
                        )}
                        {video.youtubeId && (
                            <Badge variant="secondary">
                                <a
                                    href={`https://youtube.com/watch?v=${video.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                >
                                    YouTube: {video.youtubeId}
                                </a>
                            </Badge>
                        )}
                    </div>
                    <p className="font-semibold text-lg">{video.title}</p>
                    {video.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                    )}
                    {video.tags && (
                        <div className="flex gap-1 flex-wrap">
                            {video.tags.split(',').slice(0, 5).map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {userType === 'creator' && (
                    <TaskAssignment videoId={video.id} creatorEmail={creatorEmail} />
                )}


                <div className="flex items-center gap-2 max-sm:self-center flex-wrap">
                    {/* Stream Button */}
                    <Button
                        title="Preview Video"
                        className="w-12 h-12"
                        variant="outline"
                        onClick={() => streamDialog.current?.click()}
                    >
                        <Play className="w-5 h-5" />
                    </Button>

                    {/* Edit Metadata Button */}
                    {canEdit && (
                        <Button
                            title="Edit Metadata"
                            className="w-12 h-12"
                            variant="outline"
                            onClick={() => promptInfo.current?.click()}
                        >
                            <Edit className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Replace Video Button (Editor Only) */}
                    {canReplace && (
                        <Button
                            title="Upload Edited Version"
                            className="w-12 h-12"
                            variant="outline"
                            onClick={() => replaceDialog.current?.click()}
                        >
                            <UploadCloud className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Mark as Ready Button (Editor Only) */}
                    {canMarkReady && (
                        <Button
                            title="Mark as Ready for Review"
                            className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white"
                            onClick={markAsReady}
                        >
                            <CheckCircle className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Approve Button (Creator Only, when status is 'review') */}
                    {canApprove && (
                        <Button
                            title="Approve Changes"
                            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={approveVideo}
                        >
                            <CheckCircle className="w-5 h-5" />
                        </Button>
                    )}

                    {/* Publish to YouTube Button (Creator Only, after approval) */}
                    {canPublish && (
                        <Button
                            title="Publish to YouTube"
                            className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white"
                            disabled={uploadingVideo}
                            onClick={publishToYoutube}
                        >
                            {uploadingVideo ? (
                                <Loader2 className="animate-spin w-5 h-5 text-white" />
                            ) : (
                                <Upload className="w-5 h-5" />
                            )}
                        </Button>
                    )}

                    {/* Download Button */}
                    <Button
                        className="w-12 h-12"
                        title="Download Video"
                        onClick={downloadVideo}
                    >
                        <Download className="w-5 h-5" />
                    </Button>

                    {/* Delete Button (Creator Only) */}
                    {userType === 'creator' && (
                        <Button
                            variant="destructive"
                            onClick={deleteVideoFunc}
                            className="w-12 h-12"
                            title="Delete Video"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
});