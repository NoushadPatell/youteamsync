import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {GetCookie} from "@/utilities/get_set_cookies.ts";
import {VideosPanel} from "@/components/VideosPanel.tsx";
import {Loader2} from "lucide-react";
import {MyEditor} from "@/components/MyEditor.tsx";
import {Toaster} from "@/components/ui/sonner.tsx";
import {socket} from "@/utilities/socketConnection.ts";
import { getCreatorData } from "@/utilities/api.ts";
import { TeamManagement } from "@/components/TeamManagement";

export const CreatorPage=()=>{
    const [loading,setLoading]=useState(true);
    const [email,setEmail]=useState("");
    const [editor,setEditor]=useState("");
    const navigate=useNavigate();
    useEffect(() => {
        const cookie=GetCookie('creator')
        if (cookie) {
            const {email}=JSON.parse(cookie);
            setEmail(email as string)
            getCreatorData(email).then((data)=>{
                setEditor(data.editor as string);
                setLoading(false);
            }).catch(()=>{
                setLoading(false);
            })
            socket.on("connect",()=>{
                socket.emit("createMapping",email);
            })
        }
        else {
            navigate("/login", {replace: true});
        }

    }, [navigate])

    return !loading ?<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Header with branding */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                        <span className="font-extrabold text-2xl text-white tracking-tight">YouTeamSync</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-gray-700">{email.split('@')[0]}</span>
                            <span className="text-xs text-gray-500">• Creator</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard cards - Fixed height alignment */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Editor Management Card - Takes 1 column */}
                <div className="xl:col-span-1">
                    <MyEditor email={email} editor={editor} setEditor={setEditor}/>
                </div>
                
                {/* Team Management Card - Takes 2 columns */}
                <div className="xl:col-span-2">
                    <TeamManagement creatorEmail={email} />
                </div>
            </div>

            {/* Videos Panel - Full width */}
            <div className="w-full">
                <VideosPanel creatorEmail={email} editorEmail={editor} userType={"creator"}/>
            </div>
        </div>

        <Toaster/>
    </div>:<div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="relative mb-6">
            <Loader2 className="animate-spin w-16 h-16 text-purple-600"/>
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <p className="text-xl text-gray-700 font-semibold">Loading your workspace...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
    </div>
}