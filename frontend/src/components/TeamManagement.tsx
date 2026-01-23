import React, { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, CheckCircle } from "lucide-react";

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

const ROLE_COLORS = {
    video_editor: "bg-blue-500",
    thumbnail_designer: "bg-purple-500",
    metadata_manager: "bg-green-500"
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

    // Group team members by editor
    const groupedTeam = team.reduce((acc, member) => {
        if (!acc[member.editor_email]) {
            acc[member.editor_email] = [];
        }
        acc[member.editor_email].push(member);
        return acc;
    }, {} as Record<string, TeamMember[]>);

    return (
        <div className="m-1 border-2 border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <h2 className="text-xl font-bold">My Team</h2>
                    <Badge variant="secondary">{Object.keys(groupedTeam).length} members</Badge>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Team Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Editor Email</Label>
                                <Input
                                    id="email"
                                    placeholder="editor@example.com"
                                    value={newEditorEmail}
                                    onChange={(e) => setNewEditorEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={newEditorRole} onValueChange={setNewEditorRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video_editor">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">Video Editor</span>
                                                <span className="text-xs text-gray-500">
                                                    {ROLE_DESCRIPTIONS.video_editor}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="thumbnail_designer">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">Thumbnail Designer</span>
                                                <span className="text-xs text-gray-500">
                                                    {ROLE_DESCRIPTIONS.thumbnail_designer}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="metadata_manager">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">Metadata Manager</span>
                                                <span className="text-xs text-gray-500">
                                                    {ROLE_DESCRIPTIONS.metadata_manager}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={addTeamMember} disabled={adding}>
                                {adding ? "Adding..." : "Add Member"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading team...</div>
            ) : Object.keys(groupedTeam).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                    <p className="text-sm">Add editors to collaborate on videos</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(groupedTeam).map(([email, members]) => (
                        <div key={email} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className="font-semibold">{email}</p>
                                        {members[0].rating > 0 && (
                                            <Badge variant="outline">
                                                ⭐ {(members[0].rating / (members[0].people || 1)).toFixed(1)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2"
                                            >
                                                <Badge className={ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]}>
                                                    {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                                                </Badge>
                                                <div className="flex flex-col text-xs">
                                                    {member.permissions.canDownloadVideos && (
                                                        <span className="text-gray-600">• Download videos</span>
                                                    )}
                                                    {member.permissions.canUploadEditedVideos && (
                                                        <span className="text-gray-600">• Upload edited videos</span>
                                                    )}
                                                    {member.permissions.canEditMetadata && (
                                                        <span className="text-gray-600">• Edit metadata</span>
                                                    )}
                                                    {member.permissions.canUploadThumbnails && (
                                                        <span className="text-gray-600">• Upload thumbnails</span>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="ml-2"
                                                    onClick={() => removeTeamMember(member.editor_email, member.role)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});