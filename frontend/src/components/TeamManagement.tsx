import React, { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, CheckCircle, Video, Image, FileText } from "lucide-react";

type TeamMember = {
    id: number;
    editor_email: string;
    role: string;
    status: string;
    invited_at: string;
    joined_at: string;
    permissions: {
        canDownloadVideos: boolean;
        canUploadEditedVideos: boolean;
        canEditMetadata: boolean;
        canUploadThumbnails: boolean;
    };
    rating: number;
    people: number;
};

const ROLE_LABELS = {
    video_editor: "Video Editor",
    thumbnail_designer: "Thumbnail Designer",
    metadata_manager: "Metadata Manager"
};

const ROLE_DESCRIPTIONS = {
    video_editor: "Downloads videos, uploads edited versions",
    thumbnail_designer: "Creates and uploads thumbnails",
    metadata_manager: "Edits title, description, tags, SEO"
};

const ROLE_CONFIG = {
    video_editor: { gradient: "from-blue-500 to-blue-700", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Video },
    thumbnail_designer: { gradient: "from-purple-500 to-purple-700", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: Image },
    metadata_manager: { gradient: "from-green-500 to-green-700", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: FileText }
};

export const TeamManagement = memo(({ creatorEmail }: { creatorEmail: string }) => {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [newEditorEmail, setNewEditorEmail] = useState("");
    const [newEditorRole, setNewEditorRole] = useState<string>("");
    const [adding, setAdding] = useState(false);

    const fetchTeam = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/team/${creatorEmail}`);
            const data = await response.json();
            setTeam(data.team || []);
        } catch (err) {
            console.error("Error fetching team:", err);
            alert("Error loading team members");
        } finally {
            setLoading(false);
        }
    }, [creatorEmail]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const addTeamMember = useCallback(async () => {
        if (!newEditorEmail || !newEditorRole) {
            alert("Please enter editor email and select a role");
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(newEditorEmail)) {
            alert("Please enter a valid email address");
            return;
        }

        setAdding(true);
        try {
            const response = await fetch(`http://localhost:5000/api/team/${creatorEmail}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    editorEmail: newEditorEmail,
                    role: newEditorRole
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || "Error adding team member");
                return;
            }

            alert("Team member added successfully!");
            setNewEditorEmail("");
            setNewEditorRole("");
            fetchTeam();
        } catch (err) {
            console.error("Error adding team member:", err);
            alert("Error adding team member");
        } finally {
            setAdding(false);
        }
    }, [creatorEmail, newEditorEmail, newEditorRole, fetchTeam]);

    const removeTeamMember = useCallback(async (editorEmail: string, role: string) => {
        if (!confirm(`Remove ${editorEmail} as ${ROLE_LABELS[role as keyof typeof ROLE_LABELS]}?`)) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/team/${creatorEmail}/${editorEmail}/${role}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                alert("Error removing team member");
                return;
            }

            alert("Team member removed successfully");
            fetchTeam();
        } catch (err) {
            console.error("Error removing team member:", err);
            alert("Error removing team member");
        }
    }, [creatorEmail, fetchTeam]);

    const groupedTeam = team.reduce((acc, member) => {
        if (!acc[member.editor_email]) {
            acc[member.editor_email] = [];
        }
        acc[member.editor_email].push(member);
        return acc;
    }, {} as Record<string, TeamMember[]>);

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">My Team</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                {Object.keys(groupedTeam).length} members
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                                {team.length} roles
                            </Badge>
                        </div>
                    </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Add Team Member
                            </DialogTitle>
                            <p className="text-sm text-gray-500 mt-2">Invite a new member to collaborate on your videos</p>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-3">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Editor Email</Label>
                                <Input
                                    id="email"
                                    placeholder="editor@example.com"
                                    value={newEditorEmail}
                                    onChange={(e) => setNewEditorEmail(e.target.value)}
                                    className="rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Select Role</Label>
                                <Select value={newEditorRole} onValueChange={setNewEditorRole}>
                                    <SelectTrigger className="rounded-xl border-gray-300">
                                        <SelectValue placeholder="Choose a role" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                                            const IconComponent = config.icon;
                                            return (
                                                <SelectItem key={key} value={key} className="rounded-lg">
                                                    <div className="flex items-center gap-3 py-2">
                                                        <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                                                            <IconComponent className={`w-5 h-5 ${config.text}`} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">{ROLE_LABELS[key as keyof typeof ROLE_LABELS]}</span>
                                                            <span className="text-xs text-gray-500">{ROLE_DESCRIPTIONS[key as keyof typeof ROLE_DESCRIPTIONS]}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" className="rounded-xl">Cancel</Button>
                            </DialogClose>
                            <Button 
                                onClick={addTeamMember} 
                                disabled={adding}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                            >
                                {adding ? "Adding..." : "Add Member"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading team...</p>
                </div>
            ) : Object.keys(groupedTeam).length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold text-lg">No team members yet</p>
                    <p className="text-sm text-gray-500 mt-2">Start building your team to collaborate on videos</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedTeam).map(([email, members]) => (
                        <div key={email} className="border-2 border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {email.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{email.split('@')[0]}</p>
                                    <p className="text-sm text-gray-500 truncate">{email}</p>
                                </div>
                                {members[0].rating > 0 && (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-0">
                                        ⭐ {(members[0].rating / (members[0].people || 1)).toFixed(1)}
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {members.map((member) => {
                                    const roleConfig = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG];
                                    const IconComponent = roleConfig.icon;
                                    return (
                                        <div
                                            key={member.id}
                                            className={`bg-white border-2 ${roleConfig.border} rounded-xl p-4 hover:shadow-md transition-all duration-200`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleConfig.gradient}`}>
                                                    <IconComponent className="w-4 h-4 text-white" />
                                                    <span className="text-xs font-bold text-white">{ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 hover:bg-red-50 rounded-lg"
                                                    onClick={() => removeTeamMember(member.editor_email, member.role)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                {member.permissions.canDownloadVideos && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                        <span>Download videos</span>
                                                    </div>
                                                )}
                                                {member.permissions.canUploadEditedVideos && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                        <span>Upload edited videos</span>
                                                    </div>
                                                )}
                                                {member.permissions.canEditMetadata && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                        <span>Edit metadata</span>
                                                    </div>
                                                )}
                                                {member.permissions.canUploadThumbnails && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                        <span>Upload thumbnails</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});