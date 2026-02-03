// backend/utilities/analyticsRoutes.ts (CREATE NEW FILE)
import { Router } from 'express';
import { query } from './database';

export const analyticsRouter = Router();

// Creator Analytics
analyticsRouter.get('/api/analytics/creator/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { period = '30' } = req.query; // days

        // Videos by status
        const statusStats = await query(
            `SELECT 
                status,
                COUNT(*) as count
             FROM videos 
             WHERE creator_email = $1 
             GROUP BY status`,
            [email]
        );

        // Videos over time
        const videosOverTime = await query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
             FROM videos 
             WHERE creator_email = $1 
               AND created_at >= NOW() - INTERVAL '${period} days'
             GROUP BY DATE(created_at)
             ORDER BY date`,
            [email]
        );

        // Editor performance
        const editorPerformance = await query(
            `SELECT 
                edited_by as editor,
                COUNT(*) as videos_completed,
                AVG(rating) as avg_rating,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_hours
             FROM videos 
             WHERE creator_email = $1 
               AND edited_by IS NOT NULL 
               AND edited_by != ''
             GROUP BY edited_by`,
            [email]
        );

        // Average time to publish
        const avgTimeToPublish = await query(
            `SELECT 
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400) as avg_days
             FROM videos 
             WHERE creator_email = $1 
               AND status = 'published'`,
            [email]
        );

        // Task completion rate
        const taskStats = await query(
            `SELECT 
                task_status,
                COUNT(*) as count
             FROM video_assignments va
             JOIN videos v ON v.id = va.video_id
             WHERE v.creator_email = $1
             GROUP BY task_status`,
            [email]
        );

        res.status(200).json({
            statusDistribution: statusStats.rows,
            videosOverTime: videosOverTime.rows,
            editorPerformance: editorPerformance.rows,
            avgTimeToPublish: avgTimeToPublish.rows[0]?.avg_days || 0,
            taskStats: taskStats.rows
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
});

// Editor Analytics
analyticsRouter.get('/api/analytics/editor/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { period = '30' } = req.query;

        // Tasks completed over time
        const tasksOverTime = await query(
            `SELECT 
                DATE(va.assigned_at) as date,
                COUNT(*) as count
             FROM video_assignments va
             WHERE va.editor_email = $1 
               AND va.assigned_at >= NOW() - INTERVAL '${period} days'
             GROUP BY DATE(va.assigned_at)
             ORDER BY date`,
            [email]
        );

        // Task status breakdown
        const taskStatusBreakdown = await query(
            `SELECT 
                task_status,
                COUNT(*) as count
             FROM video_assignments
             WHERE editor_email = $1
             GROUP BY task_status`,
            [email]
        );

        // Average completion time
        const avgCompletionTime = await query(
            `SELECT 
                role,
                AVG(EXTRACT(EPOCH FROM (updated_at - assigned_at))/3600) as avg_hours
             FROM video_assignments va
             JOIN videos v ON v.id = va.video_id
             WHERE va.editor_email = $1 
               AND va.task_status = 'completed'
             GROUP BY role`,
            [email]
        );

        // Rating trend
        const ratingTrend = await query(
            `SELECT 
                DATE(v.updated_at) as date,
                AVG(v.rating) as avg_rating
             FROM videos v
             WHERE v.edited_by = $1 
               AND v.rating > 0
               AND v.updated_at >= NOW() - INTERVAL '${period} days'
             GROUP BY DATE(v.updated_at)
             ORDER BY date`,
            [email]
        );

        // Top creators worked with
        const topCreators = await query(
            `SELECT 
                v.creator_email,
                COUNT(*) as videos_completed
             FROM video_assignments va
             JOIN videos v ON v.id = va.video_id
             WHERE va.editor_email = $1
               AND va.task_status = 'completed'
             GROUP BY v.creator_email
             ORDER BY videos_completed DESC
             LIMIT 5`,
            [email]
        );

        res.status(200).json({
            tasksOverTime: tasksOverTime.rows,
            taskStatusBreakdown: taskStatusBreakdown.rows,
            avgCompletionTime: avgCompletionTime.rows,
            ratingTrend: ratingTrend.rows,
            topCreators: topCreators.rows
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Error fetching analytics' });
    }
});