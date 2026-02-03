// main.tsx (UPDATE - add editor routes)
import ReactDOM from 'react-dom/client'
import "./index.css"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WrongPage } from "./pages/WrongPage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { Oauth2callback } from "./pages/Oauth2callback.tsx";
import { AnalyticsPage } from "@/pages/creator/AnalyticsPage";

import { ErrorBoundary } from '@/components/ErrorBoundary';

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';



const CreatorLayout = lazy(() => import("./pages/creator/CreatorLayout.tsx").then(m => ({ default: m.CreatorLayout })));
const CreatorDashboard = lazy(() => import("./pages/creator/CreatorDashboard.tsx").then(m => ({ default: m.CreatorDashboard })));
const VideosLibrary = lazy(() => import("./pages/creator/VideosLibrary.tsx").then(m => ({ default: m.VideosLibrary })));
const TeamPage = lazy(() => import("./pages/creator/TeamPage.tsx").then(m => ({ default: m.TeamPage })));
const EditorMarketplace = lazy(() => import("./pages/creator/EditorMarketplace.tsx").then(m => ({ default: m.EditorMarketplace })));
const CreatorSettings = lazy(() => import("./pages/creator/SettingsPage.tsx").then(m => ({ default: m.SettingsPage })));

const EditorLayout = lazy(() => import("./pages/editor/EditorLayout.tsx").then(m => ({ default: m.EditorLayout })));
const EditorDashboard = lazy(() => import("./pages/editor/EditorDashboard.tsx").then(m => ({ default: m.EditorDashboard })));
const MyTasks = lazy(() => import("./pages/editor/MyTasks.tsx").then(m => ({ default: m.MyTasks })));
const CreatorRequests = lazy(() => import("./pages/editor/CreatorRequests.tsx").then(m => ({ default: m.CreatorRequests })));
const EditorSettings = lazy(() => import("./pages/editor/SettingsPage.tsx").then(m => ({ default: m.SettingsPage })));

// Loading fallback component
const PageLoader = () => (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="relative mb-6">
            <Loader2 className="animate-spin w-16 h-16 text-purple-600" />
            <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <p className="text-xl text-gray-700 font-semibold">Loading...</p>
    </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path={"/"} element={<Navigate to={"/login"} replace={true} />} />

                    {/* Creator Routes */}
                    <Route path={"/creator"} element={<CreatorLayout />}>
                        <Route index element={<CreatorDashboard />} />
                        <Route path="videos" element={<VideosLibrary />} />
                        <Route path="team" element={<TeamPage />} />
                        <Route path="marketplace" element={<EditorMarketplace />} />
                        <Route path="analytics" element={<AnalyticsPage />} />
                        <Route path="settings" element={<CreatorSettings />} />
                    </Route>

                    {/* Editor Routes */}
                    <Route path={"/editor"} element={<EditorLayout />}>
                        <Route index element={<EditorDashboard />} />
                        <Route path="tasks" element={<MyTasks />} />
                        <Route path="requests" element={<CreatorRequests />} />
                        <Route path="settings" element={<EditorSettings />} />
                    </Route>

                    <Route path={"/login"} element={<LoginPage />} />
                    <Route path={"/oauth2callback"} element={<Oauth2callback />} />
                    <Route path={"/*"} element={<WrongPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    </ErrorBoundary>
)