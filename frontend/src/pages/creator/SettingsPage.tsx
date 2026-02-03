// src/pages/creator/SettingsPage.tsx
import { useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CreatorOutletContext } from '@/types/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Bell, Youtube, LogOut, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export const SettingsPage = () => {
    const { email } = useOutletContext<CreatorOutletContext>();
    const navigate = useNavigate();
    const [notificationPreferences, setNotificationPreferences] = useState({
        taskAssigned: true,
        taskCompleted: true,
        newMessages: true,
        videoPublished: true
    });

    const handleLogout = useCallback(() => {
        // Clear cookie
        document.cookie = 'creator=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/login', { replace: true });
        toast.success('Logged out successfully');
    }, [navigate]);

    const handleRevokeAccess = useCallback(async () => {
        if (!confirm('Are you sure? You will need to re-authorize with Google to publish videos again.')) {
            return;
        }

        try {
            // Call backend to clear tokens
            const response = await fetch(`http://localhost:5000/api/creator/${email}/revoke-tokens`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to revoke access');
            }

            toast.success('YouTube access revoked. You can re-authorize when needed.');
        } catch (error) {
            console.error('Revoke error:', error);
            toast.error('Failed to revoke access');
        }
    }, [email]);

    const handleDeleteAccount = useCallback(async () => {
        const confirmation = prompt('Type "DELETE" to confirm account deletion:');
        if (confirmation !== 'DELETE') {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/creator/${email}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            // Clear cookie and redirect
            document.cookie = 'creator=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            navigate('/login', { replace: true });
            toast.success('Account deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete account');
        }
    }, [email, navigate]);

    const saveNotificationPreferences = useCallback(() => {
        // Store in localStorage for now (you can move to backend later)
        localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
        toast.success('Preferences saved');
    }, [notificationPreferences]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br rom-brand to-brand-light rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                        <Input 
                            value={email} 
                            disabled 
                            className="mt-2 bg-gray-50 rounded-xl"
                        />
                        <p className="text-xs text-gray-500 mt-1">Your email cannot be changed</p>
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-gray-700">Account Type</Label>
                        <div className="mt-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <span className="font-semibold text-blue-700">Creator Account</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-info to-info-dark rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'taskAssigned', label: 'Task assignments', description: 'When an editor is assigned to a video' },
                        { key: 'taskCompleted', label: 'Task completions', description: 'When an editor completes their work' },
                        { key: 'newMessages', label: 'New messages', description: 'When you receive a chat message' },
                        { key: 'videoPublished', label: 'Video published', description: 'When a video is published to YouTube' }
                    ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="font-semibold text-gray-900">{label}</p>
                                <p className="text-sm text-gray-600">{description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={notificationPreferences[key as keyof typeof notificationPreferences]}
                                    onChange={(e) => setNotificationPreferences(prev => ({
                                        ...prev,
                                        [key]: e.target.checked
                                    }))}
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                            </label>
                        </div>
                    ))}
                </div>

                <Button 
                    onClick={saveNotificationPreferences}
                    className="mt-4 bg-gradient-to-r rom-brand to-brand-light hover:from-blue-700 hover:to-purple-700 rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                </Button>
            </div>

            {/* YouTube Connection */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-error to-error-dark rounded-xl flex items-center justify-center">
                        <Youtube className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">YouTube Connection</h2>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Youtube className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Connected to YouTube</p>
                            <p className="text-sm text-gray-600">{email}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleRevokeAccess}
                        variant="outline"
                        className="rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                    >
                        Revoke Access
                    </Button>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                    Revoking access will prevent video publishing until you re-authorize. Your videos and team will not be affected.
                </p>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl shadow-lg border-2 border-red-300 p-6">
                <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-200">
                        <div>
                            <p className="font-semibold text-gray-900">Log Out</p>
                            <p className="text-sm text-gray-600">Sign out of your account</p>
                        </div>
                        <Button 
                            onClick={handleLogout}
                            variant="outline"
                            className="rounded-xl"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Log Out
                        </Button>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-red-200 cursor-pointer hover:bg-red-50 transition-colors">
                                <div>
                                    <p className="font-semibold text-red-900">Delete Account</p>
                                    <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                                </div>
                                <Button variant="destructive" className="rounded-xl">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-red-900">Delete Account</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your account, all videos, team members, and associated data.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                <p className="text-sm text-red-900 font-semibold">⚠️ Warning:</p>
                                <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                                    <li>All videos will be deleted</li>
                                    <li>Team members will be removed</li>
                                    <li>This cannot be reversed</li>
                                </ul>
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="rounded-xl">Cancel</Button>
                                </DialogTrigger>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteAccount}
                                    className="rounded-xl"
                                >
                                    I understand, delete my account
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};