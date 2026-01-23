import {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {GetCookie} from "@/utilities/get_set_cookies.ts";
import {Loader2} from "lucide-react";
import {socket} from "@/utilities/socketConnection.ts";
import {CreatorsRequest} from "@/components/CreatorsRequest.tsx";
import {Video} from "@/components/Video.tsx";

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
    creatorEmail: string;  // THIS IS KEY!
    assignedRole: string;
    taskStatus: string;
    assignedAt: string;
    taskNotes: string;
};

export const EditorPage = () => {
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const [assignedVideos, setAssignedVideos] = useState<AssignedVideo[]>([]);

    const fetchAssignedVideos = useCallback(async (editorEmail: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/videos/editor/${editorEmail}`);
            const videos = await response.json();
            console.log('Fetched videos:', videos); // DEBUG
            return videos || [];
        } catch (error) {
            console.error("Error fetching assigned videos:", error);
            return [];
        }
    }, []);

    useEffect(() => {
        const cookie = GetCookie('editor');
        if (cookie) {
            const {email} = JSON.parse(cookie);
            setEmail(email);
            
            socket.on("connect", () => {
                socket.emit("createMapping", email);
            });

            fetchAssignedVideos(email).then((videos) => {
                console.log('Videos loaded:', videos); // DEBUG
                setAssignedVideos(videos);
                setLoading(false);
            });
        } else {
            navigate("/login", {replace: true});
        }
    }, [navigate, fetchAssignedVideos]);

    const dispatch = useCallback((action: {type: string, payload: any}) => {
        switch (action.type) {
            case 'updateVideoInfo':
                setAssignedVideos(prev => 
                    prev.map(v => v.id === action.payload.id ? {...v, ...action.payload} : v)
                );
                break;
            case 'deleteVideo':
                setAssignedVideos(prev => prev.filter(v => v.id !== action.payload));
                break;
        }
    }, []);

    return !loading ? (
        <>
            <div className="p-2 rounded-2xl m-2 w-fit font-extrabold text-4xl bg-gray-400">
                Vid Collab Studio
            </div>

            <div className="m-1 py-1 px-2 border-2 border-gray-200 rounded-lg flex flex-col gap-1">
                <p className="text-center w-fit p-1 text-xl font-bold rounded-md bg-gray-200 mx-auto">
                    My Assigned Videos
                </p>
                
                {assignedVideos.length === 0 ? (
                    <p className="text-center py-4">
                        No videos assigned yet. Wait for creators to assign tasks to you.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4 mt-3">
                        {assignedVideos.map((video) => {
                            console.log('Video creatorEmail:', video.creatorEmail); // DEBUG
                            
                            return (
                                <div key={video.id} className="border-b pb-3">
                                    <div className="text-sm text-gray-600 mb-2">
                                        <span className="font-semibold">Your Role:</span> {video.assignedRole?.replace('_', ' ') || 'N/A'}
                                        <span className="mx-2">•</span>
                                        <span className="font-semibold">Task Status:</span> {video.taskStatus?.replace('_', ' ') || 'N/A'}
                                        {video.taskNotes && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span className="italic">{video.taskNotes}</span>
                                            </>
                                        )}
                                        <span className="mx-2">•</span>
                                        <span className="font-semibold">Creator:</span> {video.creatorEmail || 'Unknown'}
                                    </div>
                                    <Video
                                        video={video}
                                        dispatch={dispatch}
                                        creatorEmail={video.creatorEmail || ''} // USE FROM VIDEO DATA
                                        userType="editor"
                                        editorEmail={email}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="m-1">
                <CreatorsRequest editorEmail={email} />
            </div>
        </>
    ) : (
        <div className="h-svh flex justify-center items-center">
            <Loader2 className="animate-spin w-10 h-10" />
        </div>
    );
};