import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { HandleEditorLogin } from "@/utilities/HandleEditorLogin.ts";
import { GetCookie } from "@/utilities/get_set_cookies.ts";
import { LuLoader2 } from "react-icons/lu";
import { Button } from "@/components/ui/button.tsx";

export const LoginPage = () => {
    const [ShowPage, setShowPage] = useState(false);
    const navigate = useNavigate();

    const EditorLoginFunc = useCallback(() => {
        setShowPage(false);
        HandleEditorLogin().then(() => {
            // Redirect handled in HandleEditorLogin
        }).catch((err) => {
            alert(err.message);
            setShowPage(true);
            console.log(err);
        })
    }, [])
    const CreatorSignUpFunc = useCallback(() => {
        setShowPage(false);
        fetch(`${import.meta.env.VITE_BACKEND}` + '/getAuthUrl').then((res) => {
            return res.json();
        }).then((output) => {
            const { authorizeUrl } = output;
            const a = document.createElement("a");
            a.href = authorizeUrl;
            a.click();
        }).catch(() => {
            alert("error occured. try again")
            setShowPage(true);
        })

    }, [])

    useEffect(() => {
        if (GetCookie('creator')) {
            navigate("/creator", { replace: true });
        }
        else if (GetCookie('editor')) {
            navigate("/editor", { replace: true });
        }
        else {
            setShowPage(true)
        }

    }, [navigate])
    return <div className={"h-svh flex flex-col items-center justify-center gap-2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"}>
        
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 border-4 border-purple-500/30 rounded-full animate-float" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 border-4 border-blue-500/30 rotate-45 animate-float-reverse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 border-4 border-pink-500/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* Video/Film strip decorative elements */}
        <svg className="absolute top-10 left-10 w-32 h-32 text-purple-500/20 animate-pulse-slow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
        
        <svg className="absolute bottom-10 right-10 w-40 h-40 text-blue-500/20 animate-spin-slow" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        
        {/* Clapperboard icon */}
        <svg className="absolute top-1/2 left-10 w-24 h-24 text-pink-500/15 -rotate-12 animate-float" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 3v2h-2V3H8v2H6V3H4v18h16V3h-2zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm10 12H8V9h8v10zm2 0h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z"/>
        </svg>
        
        {/* Camera icon */}
        <svg className="absolute bottom-1/3 right-1/4 w-28 h-28 text-indigo-500/15 rotate-12 animate-float-reverse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        </svg>
        
        {/* Glowing orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '3s'}}></div>

        {ShowPage ? <>
            <div className={"p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl font-extrabold text-5xl bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent animate-fade-in relative z-10"}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-3xl blur-xl -z-10 animate-glow"></div>
                <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                    </svg>
                    YouTeamSync
                </div>
            </div>

            <div className={"flex flex-col items-center gap-4 mt-6 animate-fade-in-delay relative z-10 max-w-2xl mx-auto px-4"}>
                <p className="text-white/90 text-center text-lg font-medium leading-relaxed">
                    Streamline your YouTube workflow from raw footage to published content
                </p>
                <p className="text-white/70 text-center text-sm leading-relaxed">
                    Upload videos, assign to your editing team, review their work, and publish to YouTube—all in one place
                </p>
                
                {/* Feature highlights */}
                <div className="flex flex-wrap justify-center gap-3 mt-2 mb-4">
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white/80 text-xs font-medium">Video Editing</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white/80 text-xs font-medium">Thumbnails</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-white/80 text-xs font-medium">Metadata</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white/80 text-xs font-medium">Team Approval</span>
                    </div>
                </div>
                
                <i className="text-white/80 text-lg font-light tracking-wide mt-2">Get Started as</i>
                <div className={"flex gap-6"}>

                    <Button 
                        className={"bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 border border-blue-400/30 relative overflow-hidden group"} 
                        onClick={CreatorSignUpFunc}
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                        <span className="relative flex flex-col items-center gap-1">
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Creator
                            </span>
                            <span className="text-xs font-normal text-blue-100">Upload & Manage</span>
                        </span>
                    </Button>
                    <Button 
                        className={"font-bold text-lg px-8 py-6 rounded-2xl shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 border border-emerald-400/30 relative overflow-hidden group"} 
                        onClick={EditorLoginFunc}
                    >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></span>
                        <span className="relative flex flex-col items-center gap-1">
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editor
                            </span>
                            <span className="text-xs font-normal text-emerald-100">Edit & Create</span>
                        </span>
                    </Button>
                </div>

            </div>

        </> :
            <div className="relative z-10">
                <LuLoader2 className={"animate-spin text-white drop-shadow-lg"} size={60} />
                <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
            </div>
        }

        <style>{`
            @keyframes gradient-slow {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            @keyframes pulse-slow {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.1); }
            }
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fade-in-delay {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(5deg); }
            }
            @keyframes float-reverse {
                0%, 100% { transform: translateY(0px) rotate(45deg); }
                50% { transform: translateY(20px) rotate(50deg); }
            }
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes glow {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            .bg-grid-pattern {
                background-image: 
                    linear-gradient(to right, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
                background-size: 50px 50px;
            }
            .animate-gradient-slow {
                background-size: 200% 200%;
                animation: gradient-slow 15s ease infinite;
            }
            .animate-pulse-slow {
                animation: pulse-slow 4s ease-in-out infinite;
            }
            .animate-fade-in {
                animation: fade-in 0.8s ease-out forwards;
            }
            .animate-fade-in-delay {
                animation: fade-in-delay 0.8s ease-out 0.2s forwards;
                opacity: 0;
            }
            .animate-float {
                animation: float 6s ease-in-out infinite;
            }
            .animate-float-reverse {
                animation: float-reverse 7s ease-in-out infinite;
            }
            .animate-spin-slow {
                animation: spin-slow 20s linear infinite;
            }
            .animate-glow {
                animation: glow 3s ease-in-out infinite;
            }
        `}</style>

    </div>
}