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
        fetch(`${import.meta.env.VITE_BACKEND}/getAuthUrl?userType=creator`).then((res) => {
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

    return (
        <div className="login-container">
            {/* Ambient background layers */}
            <div className="ambient-bg">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
                <div className="noise-overlay"></div>
            </div>

            {/* Decorative grid */}
            <div className="perspective-grid"></div>

            {/* Floating video elements */}
            <div className="floating-elements">
                <div className="float-item item-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="6" width="20" height="12" rx="2"/>
                        <path d="M22 9l-6 3 6 3V9z"/>
                    </svg>
                </div>
                <div className="float-item item-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10 8 16 12 10 16 10 8"/>
                    </svg>
                </div>
                <div className="float-item item-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M23 7l-7 5 7 5V7z"/>
                        <rect x="1" y="5" width="15" height="14" rx="2"/>
                    </svg>
                </div>
            </div>

            {/* Main content */}
            <main className="main-content">
                {ShowPage ? (
                    <>
                        {/* Logo and branding */}
                        <div className="brand-section">
                            <div className="logo-container">
                                <div className="logo-icon">
                                    <svg viewBox="0 0 40 40" fill="none">
                                        <rect x="4" y="8" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M28 14l8 4-8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="14" cy="16" r="1.5" fill="currentColor"/>
                                        <rect x="4" y="28" width="32" height="2" rx="1" fill="currentColor" opacity="0.3"/>
                                        <rect x="6" y="32" width="28" height="1" rx="0.5" fill="currentColor" opacity="0.2"/>
                                    </svg>
                                </div>
                                <h1 className="brand-name">YouTeamSync</h1>
                            </div>
                            <p className="brand-tagline">
                                Production workflow for YouTube creators
                            </p>
                        </div>

                        {/* Feature showcase */}
                        <div className="features-grid">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <span>Upload & Store</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                </div>
                                <span>Team Edits</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <span>Review & Approve</span>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                    </svg>
                                </div>
                                <span>Publish Direct</span>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="cta-section">
                            <h2 className="cta-title">Choose your role</h2>
                            
                            <div className="role-cards">
                                <div className="role-card creator-card" onClick={CreatorSignUpFunc}>
                                    <div className="card-glow"></div>
                                    <div className="card-content">
                                        <div className="role-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 7l-7 5 7 5V7z"/>
                                                <rect x="1" y="5" width="15" height="14" rx="2"/>
                                            </svg>
                                        </div>
                                        <h3 className="role-title">Creator</h3>
                                        <p className="role-description">
                                            Upload content, manage your team, and publish to YouTube
                                        </p>
                                        <div className="card-arrow">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="role-card editor-card" onClick={EditorLoginFunc}>
                                    <div className="card-glow"></div>
                                    <div className="card-content">
                                        <div className="role-icon">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </div>
                                        <h3 className="role-title">Editor</h3>
                                        <p className="role-description">
                                            Access assigned projects, edit videos, and submit for review
                                        </p>
                                        <div className="card-arrow">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer note */}
                        <p className="footer-note">
                            Streamline your entire YouTube production pipeline
                        </p>
                    </>
                ) : (
                    <div className="loading-state">
                        <div className="loader-container">
                            <LuLoader2 className="loader-icon" size={48} />
                            <div className="loader-glow"></div>
                        </div>
                        <p className="loading-text">Initializing...</p>
                    </div>
                )}
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%);
                    font-family: 'Sora', sans-serif;
                }

                /* Ambient background */
                .ambient-bg {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                }

                .gradient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.15;
                    animation: float-orb 20s ease-in-out infinite;
                }

                .orb-1 {
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, #3b82f6, transparent);
                    top: -200px;
                    left: -200px;
                    animation-delay: 0s;
                }

                .orb-2 {
                    width: 500px;
                    height: 500px;
                    background: radial-gradient(circle, #8b5cf6, transparent);
                    bottom: -150px;
                    right: -150px;
                    animation-delay: 7s;
                }

                .orb-3 {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, #06b6d4, transparent);
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: 14s;
                }

                .noise-overlay {
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
                    opacity: 0.3;
                }

                /* Perspective grid */
                .perspective-grid {
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
                    background-size: 60px 60px;
                    transform: perspective(500px) rotateX(60deg);
                    transform-origin: center top;
                    opacity: 0.2;
                    mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
                }

                /* Floating elements */
                .floating-elements {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }

                .float-item {
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    color: rgba(59, 130, 246, 0.15);
                    animation: float-drift 25s ease-in-out infinite;
                }

                .float-item svg {
                    width: 100%;
                    height: 100%;
                }

                .item-1 {
                    top: 15%;
                    left: 10%;
                    animation-delay: 0s;
                }

                .item-2 {
                    top: 70%;
                    left: 15%;
                    animation-delay: 8s;
                }

                .item-3 {
                    top: 25%;
                    right: 12%;
                    animation-delay: 16s;
                }

                /* Main content */
                .main-content {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 1000px;
                    padding: 3rem 2rem;
                    animation: fade-in 0.8s ease-out;
                }

                /* Brand section */
                .brand-section {
                    text-align: center;
                    margin-bottom: 3rem;
                }

                .logo-container {
                    display: inline-flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.75rem;
                    animation: slide-down 0.6s ease-out;
                }

                .logo-icon {
                    width: 50px;
                    height: 50px;
                    color: #3b82f6;
                    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.4));
                }

                .brand-name {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.02em;
                }

                .brand-tagline {
                    color: #94a3b8;
                    font-size: 1rem;
                    font-weight: 300;
                    letter-spacing: 0.05em;
                    animation: fade-in 0.8s ease-out 0.2s both;
                }

                /* Features grid */
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 3rem;
                    animation: fade-in 0.8s ease-out 0.3s both;
                }

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.25rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    color: #cbd5e1;
                    font-size: 0.875rem;
                    font-weight: 400;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .feature-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }

                .feature-icon {
                    width: 20px;
                    height: 20px;
                    color: #3b82f6;
                    flex-shrink: 0;
                }

                /* CTA Section */
                .cta-section {
                    margin-bottom: 2rem;
                }

                .cta-title {
                    text-align: center;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin-bottom: 2rem;
                    letter-spacing: -0.01em;
                    animation: fade-in 0.8s ease-out 0.4s both;
                }

                /* Role cards */
                .role-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1.5rem;
                    animation: fade-in 0.8s ease-out 0.5s both;
                }

                .role-card {
                    position: relative;
                    padding: 2rem;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    cursor: pointer;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .role-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.03) 100%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .role-card:hover {
                    transform: translateY(-8px);
                    border-color: rgba(59, 130, 246, 0.4);
                }

                .role-card:hover::before {
                    opacity: 1;
                }

                .card-glow {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 60%);
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .role-card:hover .card-glow {
                    opacity: 1;
                    animation: glow-pulse 2s ease-in-out infinite;
                }

                .card-content {
                    position: relative;
                    z-index: 1;
                }

                .role-icon {
                    width: 48px;
                    height: 48px;
                    margin-bottom: 1.25rem;
                    color: #3b82f6;
                    transition: all 0.3s ease;
                }

                .creator-card:hover .role-icon {
                    color: #60a5fa;
                    transform: scale(1.1) rotate(5deg);
                }

                .editor-card:hover .role-icon {
                    color: #10b981;
                    transform: scale(1.1) rotate(-5deg);
                }

                .editor-card .role-icon {
                    color: #10b981;
                }

                .role-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #f8fafc;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.01em;
                }

                .role-description {
                    font-size: 0.9rem;
                    color: #94a3b8;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                .card-arrow {
                    width: 24px;
                    height: 24px;
                    color: #3b82f6;
                    opacity: 0;
                    transform: translateX(-10px);
                    transition: all 0.3s ease;
                }

                .role-card:hover .card-arrow {
                    opacity: 1;
                    transform: translateX(0);
                }

                /* Footer note */
                .footer-note {
                    text-align: center;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 300;
                    animation: fade-in 0.8s ease-out 0.6s both;
                }

                /* Loading state */
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1.5rem;
                    min-height: 60vh;
                }

                .loader-container {
                    position: relative;
                }

                .loader-icon {
                    color: #3b82f6;
                    animation: spin 1s linear infinite;
                    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6));
                }

                .loader-glow {
                    position: absolute;
                    inset: -20px;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent);
                    animation: glow-pulse 2s ease-in-out infinite;
                }

                .loading-text {
                    color: #94a3b8;
                    font-size: 0.9rem;
                    font-weight: 300;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                }

                /* Animations */
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float-orb {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -30px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }

                @keyframes float-drift {
                    0%, 100% {
                        transform: translate(0, 0) rotate(0deg);
                    }
                    25% {
                        transform: translate(20px, -20px) rotate(90deg);
                    }
                    50% {
                        transform: translate(-15px, 15px) rotate(180deg);
                    }
                    75% {
                        transform: translate(25px, 10px) rotate(270deg);
                    }
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes glow-pulse {
                    0%, 100% {
                        opacity: 0.4;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.05);
                    }
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .main-content {
                        padding: 2rem 1rem;
                    }

                    .brand-name {
                        font-size: 2rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }

                    .role-cards {
                        grid-template-columns: 1fr;
                    }

                    .float-item {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};