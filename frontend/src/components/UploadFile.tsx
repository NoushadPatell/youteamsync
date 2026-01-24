import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { SHA256 } from "crypto-js";
import { videoInfoType } from "@/utilities/getCreatorVideos.ts";
import { uploadVideo } from "@/utilities/api.ts";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

export const UploadFile = memo(({ dispatch, creatorEmail, editorEmail, userType }: {
    creatorEmail: string,
    editorEmail: string,
    userType: string,
    dispatch: React.Dispatch<{ type: string, payload: videoInfoType | videoInfoType[] | string }>
}) => {
    const inputUploadRef = useRef<HTMLInputElement>(null)
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const uploadVideoFunc = useCallback(async () => {
        try {
            if (inputUploadRef.current && inputUploadRef.current.files) {
                setUploadLoading(true);
                const file = inputUploadRef.current.files[0];
                const filename = file.name;
                const arr = filename.split('.');
                const fileExt = arr[arr.length - 1];
                const CurrDateTime = (new Date().getTime()).toString();
                const uniqueId = SHA256(CurrDateTime + creatorEmail).toString();
                const filepath = uniqueId + "." + fileExt;

                setUploadProgress(50);

                const newVideo = {
                    id: CurrDateTime,
                    title: filename,
                    description: "",
                    tags: "",
                    category: "22",
                    privacyStatus: "public",
                    thumbNailUrl: "",
                    filepath,
                    fileUrl: filepath,
                    thumbNailPath: "",
                    rating: 0,
                    youtubeId: "",
                    editedBy: (userType === "editor") ? editorEmail : "",
                    status: "draft",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const formData = new FormData();
                formData.append('file', file);
                formData.append('filename', filepath);
                formData.append('creatorEmail', creatorEmail);
                formData.append('videoData', JSON.stringify(newVideo));

                const response = await fetch('http://localhost:5000/api/videos/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                setUploadProgress(100);
                dispatch({ type: 'addVideo', payload: newVideo })

                toast("Video uploaded successfully", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })

                setUploadLoading(false);
                setUploadProgress(0);

                if (inputUploadRef.current) {
                    inputUploadRef.current.value = '';
                }
            }
        }
        catch (e) {
            console.log(e)
            console.log("error in uploading file");
            toast("Error uploading video", {
                action: {
                    label: "Close",
                    onClick: () => console.log("Close"),
                },
            })
            setUploadLoading(false);
            setUploadProgress(0);
        }


    }, [creatorEmail, dispatch, editorEmail, userType])

    useEffect(() => {
        const temp = inputUploadRef.current
        if (temp) {
            inputUploadRef.current.addEventListener('change', uploadVideoFunc);
        }
        return () => {
            if (temp) {
                temp.removeEventListener('change', uploadVideoFunc)
            }
        }
    }, [uploadVideoFunc]);

    return <>
        <input type={"file"} ref={inputUploadRef} hidden={true} disabled={uploadLoading} accept={"video/*"} multiple={false} />
        <HoverCard>
            <HoverCardTrigger asChild>
                <Button 
                    onClick={() => inputUploadRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6"
                    disabled={uploadLoading}
                >
                    {uploadLoading ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Video
                        </>
                    )}
                </Button>
            </HoverCardTrigger>
            {uploadLoading && (
                <HoverCardContent className="rounded-xl p-4 min-w-[300px]">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">Upload Progress</span>
                            <span className="font-bold text-blue-600">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-gray-500">Please wait while your video is being uploaded...</p>
                    </div>
                </HoverCardContent>
            )}
        </HoverCard>
    </>
})