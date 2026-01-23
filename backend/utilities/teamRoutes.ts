import express, { Router, Request, Response, NextFunction } from "express";
import { query } from "./database";

export const teamRouter = Router(); // Changed from 'router' to 'teamRouter'

// Permission definitions
const ROLE_PERMISSIONS = {
    video_editor: {
        canDownloadVideos: true,
        canUploadEditedVideos: true,
        canEditMetadata: false,
        canUploadThumbnails: false
    },
    thumbnail_designer: {
        canDownloadVideos: false,
        canUploadEditedVideos: false,
        canEditMetadata: false,
        canUploadThumbnails: true
    },
    metadata_manager: {
        canDownloadVideos: false,
        canUploadEditedVideos: false,
        canEditMetadata: true,
        canUploadThumbnails: false
    }
};


// ============ TEAM MANAGEMENT ROUTES ============

// Get all team members for a creator
teamRouter.get('/api/team/:creatorEmail', async (req, res) => {
    try {
        const { creatorEmail } = req.params;

        const result = await query(
            `SELECT 
                tm.id,
                tm.editor_email,
                tm.role,
                tm.status,
                tm.invited_at,
                tm.joined_at,
                tm.permissions,
                e.rating,
                e.people
             FROM team_members tm
             LEFT JOIN editors e ON e.email = tm.editor_email
             WHERE tm.creator_email = $1
             ORDER BY tm.invited_at DESC`,
            [creatorEmail]
        );

        res.status(200).send(JSON.stringify({ team: result.rows }));
    } catch (err) {
        console.error('Error fetching team:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching team members" }));
    }
});

// Invite editor with specific role
teamRouter.post('/api/team/:creatorEmail/invite', async (req, res) => {
    try {
        const { creatorEmail } = req.params;
        const { editorEmail, role } = req.body;

        if (!editorEmail || !role) {
            res.status(400).send(JSON.stringify({ error: "Editor email and role required" }));
            return;
        }

        if (!['video_editor', 'thumbnail_designer', 'metadata_manager'].includes(role)) {
            res.status(400).send(JSON.stringify({ error: "Invalid role" }));
            return;
        }

        // Check if editor exists
        const editorCheck = await query('SELECT email FROM editors WHERE email = $1', [editorEmail]);
        if (editorCheck.rows.length === 0) {
            res.status(404).send(JSON.stringify({ error: "Editor not found. They must register first." }));
            return;
        }

        // Add to team
        const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];

        const result = await query(
            `INSERT INTO team_members (creator_email, editor_email, role, permissions, status, joined_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (creator_email, editor_email, role) 
             DO UPDATE SET status = 'active', joined_at = NOW()
             RETURNING *`,
            [creatorEmail, editorEmail, role, JSON.stringify(permissions), 'active']
        );

        res.status(201).send(JSON.stringify({
            message: "Team member added successfully",
            member: result.rows[0]
        }));
    } catch (err) {
        console.error('Error inviting team member:', err);
        res.status(500).send(JSON.stringify({ error: "Error inviting team member" }));
    }
});

// Remove team member
teamRouter.delete('/api/team/:creatorEmail/:editorEmail/:role', async (req, res) => {
    try {
        const { creatorEmail, editorEmail, role } = req.params;

        await query(
            'DELETE FROM team_members WHERE creator_email = $1 AND editor_email = $2 AND role = $3',
            [creatorEmail, editorEmail, role]
        );

        res.status(200).send(JSON.stringify({ message: "Team member removed successfully" }));
    } catch (err) {
        console.error('Error removing team member:', err);
        res.status(500).send(JSON.stringify({ error: "Error removing team member" }));
    }
});

// Get editors available for a creator (all editors with their roles in this team)
teamRouter.get('/api/team/:creatorEmail/available-editors', async (req, res) => {
    try {
        const { creatorEmail } = req.params;

        const result = await query(
            `SELECT 
                e.email,
                e.rating,
                e.people,
                COALESCE(
                    (SELECT array_agg(role) 
                     FROM team_members 
                     WHERE editor_email = e.email 
                     AND creator_email = $1 
                     AND status = 'active'),
                    ARRAY[]::varchar[]
                ) as current_roles
             FROM editors e
             ORDER BY e.rating DESC NULLS LAST`,
            [creatorEmail]
        );

        res.status(200).send(JSON.stringify({ editors: result.rows }));
    } catch (err) {
        console.error('Error fetching available editors:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching editors" }));
    }
});

// ============ VIDEO ASSIGNMENT ROUTES ============

// Assign video to editor with specific role/task
teamRouter.post('/api/assignments/:videoId/assign', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { creatorEmail, editorEmail, role, notes } = req.body;

        // Verify team member exists with this role
        const teamCheck = await query(
            'SELECT * FROM team_members WHERE creator_email = $1 AND editor_email = $2 AND role = $3 AND status = $4',
            [creatorEmail, editorEmail, role, 'active']
        );

        if (teamCheck.rows.length === 0) {
            res.status(403).send(JSON.stringify({
                error: "Editor is not in your team with this role"
            }));
            return;
        }

        // Create assignment
        const result = await query(
            `INSERT INTO video_assignments 
             (video_id, creator_email, editor_email, role, notes, task_status)
             VALUES ($1, $2, $3, $4, $5, 'assigned')
             ON CONFLICT (video_id, editor_email, role) 
             DO UPDATE SET task_status = 'assigned', assigned_at = NOW(), notes = $5
             RETURNING *`,
            [videoId, creatorEmail, editorEmail, role, notes || '']
        );

        res.status(201).send(JSON.stringify({
            message: "Task assigned successfully",
            assignment: result.rows[0]
        }));
    } catch (err) {
        console.error('Error assigning task:', err);
        res.status(500).send(JSON.stringify({ error: "Error assigning task" }));
    }
});

// Get all assignments for a video
teamRouter.get('/api/assignments/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;

        const result = await query(
            `SELECT 
                va.*,
                e.rating,
                e.people
             FROM video_assignments va
             LEFT JOIN editors e ON e.email = va.editor_email
             WHERE va.video_id = $1
             ORDER BY va.assigned_at DESC`,
            [videoId]
        );

        res.status(200).send(JSON.stringify({ assignments: result.rows }));
    } catch (err) {
        console.error('Error fetching assignments:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching assignments" }));
    }
});

// Get all assignments for an editor
teamRouter.get('/api/assignments/editor/:editorEmail', async (req, res) => {
    try {
        const { editorEmail } = req.params;

        const result = await query(
            `SELECT 
                va.*,
                v.title,
                v.description,
                v.status as video_status,
                v.creator_email
             FROM video_assignments va
             JOIN videos v ON v.id = va.video_id
             WHERE va.editor_email = $1
             ORDER BY 
                CASE va.task_status
                    WHEN 'in_progress' THEN 1
                    WHEN 'assigned' THEN 2
                    WHEN 'completed' THEN 3
                END,
                va.assigned_at DESC`,
            [editorEmail]
        );

        res.status(200).send(JSON.stringify({ assignments: result.rows }));
    } catch (err) {
        console.error('Error fetching editor assignments:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching assignments" }));
    }
});

// Update assignment status
teamRouter.put('/api/assignments/:assignmentId/status', async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { status, notes } = req.body;

        if (!['assigned', 'in_progress', 'completed'].includes(status)) {
            res.status(400).send(JSON.stringify({ error: "Invalid status" }));
            return;
        }

        await query(
            'UPDATE video_assignments SET task_status = $1, notes = COALESCE($2, notes) WHERE id = $3',
            [status, notes, assignmentId]
        );

        res.status(200).send(JSON.stringify({ message: "Status updated successfully" }));
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).send(JSON.stringify({ error: "Error updating assignment" }));
    }
});

// Remove assignment
teamRouter.delete('/api/assignments/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        await query('DELETE FROM video_assignments WHERE id = $1', [assignmentId]);

        res.status(200).send(JSON.stringify({ message: "Assignment removed successfully" }));
    } catch (err) {
        console.error('Error removing assignment:', err);
        res.status(500).send(JSON.stringify({ error: "Error removing assignment" }));
    }
});

// Add this to backend/utilities/teamRoutes.ts or routes.ts
teamRouter.put('/api/assignments/video/:videoId/editor/:editorEmail', async (req: Request, res: Response) => {
    try {
        const { videoId, editorEmail } = req.params;
        const { status } = req.body;

        if (!['assigned', 'in_progress', 'completed'].includes(status)) {
            res.status(400).send(JSON.stringify({ error: "Invalid status" }));
            return;
        }

        await query(
            'UPDATE video_assignments SET task_status = $1 WHERE video_id = $2 AND editor_email = $3',
            [status, videoId, editorEmail]
        );

        res.status(200).send(JSON.stringify({ message: "Assignment status updated" }));
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).send(JSON.stringify({ error: "Error updating assignment" }));
    }
});

teamRouter.put('/api/assignments/:assignmentId/status', async (req: Request, res: Response) => {
    try {
        const { assignmentId } = req.params;
        const { status } = req.body;

        if (!['assigned', 'in_progress', 'completed'].includes(status)) {
            res.status(400).send(JSON.stringify({ error: "Invalid status" }));
            return;
        }

        await query(
            'UPDATE video_assignments SET task_status = $1 WHERE id = $2',
            [status, assignmentId]
        );

        res.status(200).send(JSON.stringify({ message: "Status updated" }));
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).send(JSON.stringify({ error: "Error updating" }));
    }
});

// ============ PERMISSION CHECK MIDDLEWARE ============

export const checkPermission = (action: keyof typeof ROLE_PERMISSIONS['video_editor']) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { videoId, creatorEmail } = req.params;

            // Get editor email from different sources
            const editorEmail = req.body.editorEmail ||
                req.query.editorEmail ||
                req.headers['x-editor-email'];

            if (!editorEmail) {
                res.status(400).send(JSON.stringify({ error: "Editor email required in query, body, or header" }));
                return;
            }

            // Get video's creator - try different ways
            let videoCreatorEmail = creatorEmail; // From route params

            if (!videoCreatorEmail && videoId) {
                const videoResult = await query('SELECT creator_email FROM videos WHERE id = $1', [videoId]);
                if (videoResult.rows.length > 0) {
                    videoCreatorEmail = videoResult.rows[0].creator_email;
                }
            }

            if (!videoCreatorEmail) {
                res.status(404).send(JSON.stringify({ error: "Video not found" }));
                return;
            }

            // If user is creator, allow everything
            if (editorEmail === videoCreatorEmail) {
                next();
                return;
            }

            // Check if editor has permission for this action via team_members
            const permissionCheck = await query(
                `SELECT permissions FROM team_members 
                 WHERE creator_email = $1 AND editor_email = $2 AND status = 'active'`,
                [videoCreatorEmail, editorEmail]
            );

            if (permissionCheck.rows.length === 0) {
                res.status(403).send(JSON.stringify({ error: "Not authorized - not in team" }));
                return;
            }

            // Check all roles for this permission
            let hasPermission = false;
            for (const row of permissionCheck.rows) {
                const permissions = row.permissions;
                if (permissions[action] === true) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                res.status(403).send(JSON.stringify({
                    error: `Not authorized - missing permission: ${action}`
                }));
                return;
            }

            next();
        } catch (err) {
            console.error('Permission check error:', err);
            res.status(500).send(JSON.stringify({ error: "Permission check failed" }));
        }
    };
};