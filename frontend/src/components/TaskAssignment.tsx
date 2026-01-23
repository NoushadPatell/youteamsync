import React, { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, CheckCircle, Clock, Circle } from "lucide-react";

type Assignment = {
    id: number;
    video_id: string;
    editor_email: string;
    role: string;
    task_status: string;
    assigned_at: string;
    notes: string;
    rating: number;
    people: number;
};

type TeamMember = {
    editor_email: string;
    role: string;
};

const ROLE_LABELS = {
    video_editor: "Video Editor",
    thumbnail_designer: "Thumbnail Designer",
    metadata_manager: "Metadata Manager"
};

const STATUS_ICONS = {
    assigned: <Circle className="w-4 h-4 text-gray-400" />,
    in_progress: <Clock className="w-4 h-4 text-blue-500 animate-pulse" />,
    completed: <CheckCircle className="w-4 h-4 text-green-500" />
};

const STATUS_COLORS = {
    assigned: "bg-gray-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500"
};

export const TaskAssignment = memo(({ 
    videoId, 
    creatorEmail 
}: { 
    videoId: string; 
    creatorEmail: string; 
}) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEditor, setSelectedEditor] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [notes, setNotes] = useState("");
    const [assigning, setAssigning] = useState(false);

    const fetchAssignments = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/assignments/${videoId}`);
            const data = await response.json();
            setAssignments(data.assignments || []);
        } catch (err) {
            console.error("Error fetching assignments:", err);
        }
    }, [videoId]);

    const fetchTeam = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/team/${creatorEmail}`);
            const data = await response.json();
            const activeTeam = (data.team || []).filter((m: any) => m.status === 'active');
            setTeam(activeTeam);
        } catch (err) {
            console.error("Error fetching team:", err);
        } finally {
            setLoading(false);
        }
    }, [creatorEmail]);

    useEffect(() => {
        fetchAssignments();
        fetchTeam();
    }, [fetchAssignments, fetchTeam]);

    const assignTask = useCallback(async () => {
        if (!selectedEditor || !selectedRole) {
            alert("Please select editor and role");
            return;
        }

        setAssigning(true);
        try {
            const response = await fetch(`http://localhost:5000/api/assignments/${videoId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorEmail,
                    editorEmail: selectedEditor,
                    role: selectedRole,
                    notes
                })
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || "Error assigning task");
                return;
            }

            alert("Task assigned successfully!");
            setSelectedEditor("");
            setSelectedRole("");
            setNotes("");
            fetchAssignments();
        } catch (err) {
            console.error("Error assigning task:", err);
            alert("Error assigning task");
        } finally {
            setAssigning(false);
        }
    }, [videoId, creatorEmail, selectedEditor, selectedRole, notes, fetchAssignments]);

    const removeAssignment = useCallback(async (assignmentId: number) => {
        if (!confirm("Remove this task assignment?")) return;

        try {
            const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                alert("Error removing assignment");
                return;
            }

            alert("Assignment removed");
            fetchAssignments();
        } catch (err) {
            console.error("Error removing assignment:", err);
            alert("Error removing assignment");
        }
    }, [fetchAssignments]);

    // Get available editor-role combinations (not already assigned)
    const availableAssignments = team.filter(tm => 
        !assignments.some(a => 
            a.editor_email === tm.editor_email && a.role === tm.role
        )
    );

    // Group assignments by editor
    const groupedAssignments = assignments.reduce((acc, assignment) => {
        if (!acc[assignment.editor_email]) {
            acc[assignment.editor_email] = [];
        }
        acc[assignment.editor_email].push(assignment);
        return acc;
    }, {} as Record<string, Assignment[]>);

    return (
        <div className="mt-3 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-700">Task Assignments</h3>
                {availableAssignments.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Assign Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Task to Team Member</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Select Team Member & Role</Label>
                                    <Select 
                                        value={`${selectedEditor}|${selectedRole}`}
                                        onValueChange={(value) => {
                                            const [email, role] = value.split('|');
                                            setSelectedEditor(email);
                                            setSelectedRole(role);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose editor and role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAssignments.map((tm, idx) => (
                                                <SelectItem 
                                                    key={idx} 
                                                    value={`${tm.editor_email}|${tm.role}`}
                                                >
                                                    {tm.editor_email} - {ROLE_LABELS[tm.role as keyof typeof ROLE_LABELS]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Task Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any specific instructions..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button onClick={assignTask} disabled={assigning}>
                                    {assigning ? "Assigning..." : "Assign Task"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Loading assignments...</div>
            ) : assignments.length === 0 ? (
                <div className="text-sm text-gray-500 py-2">
                    No tasks assigned yet. Assign team members to work on this video.
                </div>
            ) : (
                <div className="space-y-2">
                    {Object.entries(groupedAssignments).map(([email, editorAssignments]) => (
                        <div key={email} className="bg-gray-50 rounded p-2 text-sm">
                            <div className="font-medium mb-1">{email}</div>
                            <div className="space-y-1">
                                {editorAssignments.map((assignment) => (
                                    <div 
                                        key={assignment.id}
                                        className="flex items-center justify-between bg-white rounded p-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            {STATUS_ICONS[assignment.task_status as keyof typeof STATUS_ICONS]}
                                            <Badge className={STATUS_COLORS[assignment.task_status as keyof typeof STATUS_COLORS]}>
                                                {ROLE_LABELS[assignment.role as keyof typeof ROLE_LABELS]}
                                            </Badge>
                                            <span className="text-xs text-gray-600">
                                                {assignment.task_status.replace('_', ' ')}
                                            </span>
                                            {assignment.notes && (
                                                <span className="text-xs text-gray-500 italic">
                                                    - {assignment.notes}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeAssignment(assignment.id)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});