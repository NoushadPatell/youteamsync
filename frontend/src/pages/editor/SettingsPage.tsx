// src/pages/editor/SettingsPage.tsx
import { useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { EditorOutletContext } from '@/types/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Bell, LogOut, Trash2, Save, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
    const { email } = useOutletContext<EditorOutletContext>();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState({
        bio: '',
        skills: '',
        portfolio: ''
    });

    const [notificationPreferences, setNotificationPreferences] = useState({
        taskAssigned: true,
        newMessages: true,
        paymentReceived: true
    });

    const handleLogout = useCallback(() => {
        document.cookie = 'editor=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/login', { replace: true });
        toast.success('Logged out successfully');
    }, [navigate]);

    const saveProfile = useCallback(() => {
        localStorage.setItem(`editor-profile-${email}`, JSON.stringify(profile));
        toast.success('Profile saved');
    }, [email, profile]);

    const saveNotificationPreferences = useCallback(() => {
        localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
        toast.success('Preferences saved');
    }, [notificationPreferences]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your editor profile and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br ffrom-success to-brand rounded-xl flex items-center justify-center">
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
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-gray-700">Bio</Label>
                        <Textarea
                            placeholder="Tell creators about yourself..."
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="mt-2 rounded-xl min-h-[100px]"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-gray-700">Skills</Label>
                        <Input
                            placeholder="e.g., Adobe Premiere, After Effects, Color Grading"
                            value={profile.skills}
                            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                            className="mt-2 rounded-xl"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-semibold text-gray-700">Portfolio URL</Label>
                        <Input
                            placeholder="https://yourportfolio.com"
                            value={profile.portfolio}
                            onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                            className="mt-2 rounded-xl"
                        />
                    </div>

                    <Button 
                        onClick={saveProfile}
                        className="bg-gradient-to-r ffrom-success to-brand hover:from-emerald-700 hover:to-teal-700 rounded-xl"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                    </Button>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'taskAssigned', label: 'New task assignments', description: 'When a creator assigns you a video' },
                        { key: 'newMessages', label: 'New messages', description: 'When you receive a chat message' },
                        { key: 'paymentReceived', label: 'Payment notifications', description: 'When you receive payment (coming soon)' }
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
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-success-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
                            </label>
                        </div>
                    ))}
                </div>

                <Button 
                    onClick={saveNotificationPreferences}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-2xl shadow-lg border-2 border-red-300 p-6">
                <h2 className="text-xl font-bold text-red-900 mb-4">Account Actions</h2>

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
            </div>
        </div>
    );
};