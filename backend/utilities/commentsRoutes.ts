import { Router } from 'express';
import { query } from './database';
import { sendEmail } from './emailService';

export const commentsRouter = Router();

// Get all comments for a video
commentsRouter.get('/api/comments/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;

        const result = await query(
            `SELECT 
                c.*,
                (SELECT COUNT(*) FROM video_comments WHERE parent_comment_id = c.id) as reply_count
             FROM video_comments c
             WHERE c.video_id = $1
             ORDER BY c.created_at ASC`,
            [videoId]
        );

        res.status(200).json({ comments: result.rows });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

// Add a comment
commentsRouter.post('/api/comments/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        const { userEmail, userType, commentText, parentCommentId, timestampSeconds } = req.body;

        if (!commentText || !userEmail || !userType) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const result = await query(
            `INSERT INTO video_comments 
             (video_id, user_email, user_type, comment_text, parent_comment_id, timestamp_seconds)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [videoId, userEmail, userType, commentText, parentCommentId || null, timestampSeconds || null]
        );

        // Get video details for notification
        const videoResult = await query('SELECT title, creator_email, edited_by FROM videos WHERE id = $1', [videoId]);
        const video = videoResult.rows[0];

        // Send email notification to the other party
        if (userType === 'creator' && video.edited_by) {
            sendEmail('newMessage', {
                toEmail: video.edited_by,
                fromEmail: userEmail,
                message: `New comment on "${video.title}": ${commentText.substring(0, 100)}`
            });
        } else if (userType === 'editor' && video.creator_email !== userEmail) {
            sendEmail('newMessage', {
                toEmail: video.creator_email,
                fromEmail: userEmail,
                message: `New comment on "${video.title}": ${commentText.substring(0, 100)}`
            });
        }

        res.status(201).json({ comment: result.rows[0] });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Error adding comment' });
    }
});

// Update comment
commentsRouter.put('/api/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { commentText, resolved } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (commentText !== undefined) {
            updates.push(`comment_text = $${paramCount}`);
            values.push(commentText);
            paramCount++;
        }

        if (resolved !== undefined) {
            updates.push(`resolved = $${paramCount}`);
            values.push(resolved);
            paramCount++;
        }

        updates.push(`updated_at = NOW()`);
        values.push(commentId);

        await query(
            `UPDATE video_comments SET ${updates.join(', ')} WHERE id = $${paramCount}`,
            values
        );

        res.status(200).json({ message: 'Comment updated' });
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ error: 'Error updating comment' });
    }
});

// Delete comment
commentsRouter.delete('/api/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userEmail } = req.query;

        // Verify user owns the comment
        const commentResult = await query(
            'SELECT user_email FROM video_comments WHERE id = $1',
            [commentId]
        );

        if (commentResult.rows.length === 0) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        if (commentResult.rows[0].user_email !== userEmail) {
            res.status(403).json({ error: 'Not authorized to delete this comment' });
            return;
        }

        await query('DELETE FROM video_comments WHERE id = $1', [commentId]);

        res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Error deleting comment' });
    }
});