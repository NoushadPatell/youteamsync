// src/pages/creator/VideosLibrary.tsx
import { memo, useCallback, useEffect, useReducer, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CreatorOutletContext } from "@/types/context";
import { LuLoader2 } from "react-icons/lu";
import { getCreatorVideos, videoInfoType } from "@/utilities/getCreatorVideos.ts";
import { Video } from "@/components/Video.tsx";
import { AskAI } from "@/components/AskAI.tsx";
import { ChatPanel } from "@/components/ChatPanel.tsx";
import { UploadFile } from "@/components/UploadFile.tsx";

import { VideoCardSkeleton } from '@/components/VideoCardSkeleton';

export const VideosLibrary = memo(() => {
    const { email, editor } = useOutletContext<CreatorOutletContext>();
    const [loading, setLoading] = useState(true);

    // ⚠️ EXACT SAME REDUCER from VideosPanel - DO NOT MODIFY
    const videosReducer = useCallback((state: videoInfoType[], action: { type: string, payload: videoInfoType | videoInfoType[] | string }): videoInfoType[] => {
        switch (action.type) {
            case 'setVideos': {
                return action.payload as videoInfoType[];
            }
            case 'addVideo': {
                return [...state, action.payload as videoInfoType];
            }
            case 'updateVideoInfo': {
                const temp: videoInfoType[] = JSON.parse(JSON.stringify(state));
                let index = -1;
                for (let i = 0; i < temp.length; i++) {
                    if (temp[i].id === (action.payload as videoInfoType).id) {
                        index = i;
                        break;
                    }
                }
                if (index != -1) {
                    temp[index] = (action.payload as videoInfoType);
                    return temp;
                } else {
                    return state;
                }
            }
            case 'deleteVideo': {
                return state.filter((value) => {
                    return value.id != (action.payload as string);
                })
            }
            default: {
                return state;
            }
        }
    }, []);

    const [videos, dispatch] = useReducer(videosReducer, [] as videoInfoType[]);

    // ⚠️ EXACT SAME useEffect from VideosPanel - DO NOT MODIFY
    useEffect(() => {
        getCreatorVideos(email).then((videos) => {
            dispatch({ type: "setVideos", payload: videos as videoInfoType[] });
            setLoading(false);
        });
    }, [email]);

    return (
        <div>
            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <UploadFile userType="creator" creatorEmail={email} editorEmail={editor} dispatch={dispatch} />
                <AskAI />
                {editor !== "" && (
                    <ChatPanel fromUser={email} toUser={editor} requestEditor={false} />
                )}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-3 flex-grow">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
                        <p className="text-sm text-gray-500">Manage and collaborate on your content</p>
                    </div>
                </div>

                {videos.length > 0 && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl border border-purple-200">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        <span className="font-bold text-purple-900">{videos.length}</span>
                        <span className="text-sm text-purple-700">videos</span>
                    </div>
                )}
            </div>

            {/* Content - 🔄 REPLACE THIS SECTION */}
            {loading ? (
                // ❌ DELETE THIS OLD LOADING STATE:
                // <div className="flex flex-col items-center justify-center py-20">
                //     <div className="relative">
                //         <LuLoader2 className="animate-spin w-16 h-16 text-purple-600" />
                //         <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
                //     </div>
                //     <p className="mt-6 text-gray-600 font-medium">Loading videos...</p>
                // </div>
                
                // ✅ REPLACE WITH THIS NEW SKELETON LOADING:
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map((i) => (
                        <VideoCardSkeleton key={i} />
                    ))}
                </div>
            ) : videos.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300">
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No videos yet</h3>
                    <p className="text-gray-600 mb-6">Upload your first video to start collaborating with your team</p>
                    <div className="inline-block">
                        <UploadFile userType="creator" creatorEmail={email} editorEmail={editor} dispatch={dispatch} />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {videos.map((value, index) => {
                        return (
                            <Video
                                key={index}
                                video={value}
                                creatorEmail={email}
                                editorEmail={editor}
                                dispatch={dispatch}
                                userType="creator"
                            />
                        );
                    })}
                </div>
            )}
        </div> 
    );
});

VideosLibrary.displayName = 'VideosLibrary';