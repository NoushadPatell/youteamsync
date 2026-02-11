import express, { Router } from "express"
import { google } from "googleapis";
import { query } from "./database";
import { uploadVideo } from "./uploadVideo";
import { getTitleDescription } from "./askAI";
import { uploadThumbnail } from "./uploadThumbnail";
import multer from 'multer';
import { saveFile } from './fileStorage';
import fs from 'fs';

import { sendEmail } from './emailService';

import { checkPermission } from './teamRoutes';

export type videoInfoType = {
    filepath: string,
    fileUrl: string,
    id: string,
    title: string,
    description: string,
    tags: string,
    category: string,
    privacyStatus: string,
    thumbNailUrl: string,
    thumbNailPath: string,
    rating: number,
    editedBy: string,
    youtubeId: string,
    status: string, // 'draft', 'editing', 'review', 'published'
    createdAt: string,
    updatedAt: string
}

export const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_url = process.env.REDIRECT_URL;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/youtube',
];

// ============ OAUTH ROUTES ============
router.get('/getAuthUrl', (req, res) => {
    const { userType } = req.query; // 'creator' or 'editor'

    // Define scopes based on user type
    const requestedScopes = userType === 'editor'
        ? ['https://www.googleapis.com/auth/userinfo.email'] // Editors: email only
        : [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/youtube',
        ]; // Creators: full YouTube access

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: requestedScopes,
        include_granted_scopes: true,
        prompt: 'consent'
    });

    res.send(JSON.stringify({ authorizeUrl }));
});

router.post('/getEmail', async (req, res) => {
    try {
        const { code, userType } = req.body;

        if (!code) {
            res.status(400).send(JSON.stringify({ "error": "No authorization code provided" }));
            return;
        }

        console.log('Exchanging code for tokens...');

        const tempOAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_url
        );

        const { tokens } = await tempOAuth2Client.getToken(code);
        console.log('Tokens received:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            scopes: tokens.scope
        });

        // ✅ CRITICAL: Verify we have refresh token
        if (!tokens.refresh_token) {
            console.error('⚠️ No refresh token received! User might need to revoke access and re-authorize');
            // For first-time users, this is expected on subsequent logins
            // We'll handle it below
        }

        if (!(tokens.scope && tokens.scope.includes('https://www.googleapis.com/auth/userinfo.email'))) {
            res.status(400).send(JSON.stringify({ "error": "Email permissions not provided by the user. Try Again." }));
            return;
        }

        const { access_token, refresh_token } = tokens;

        tempOAuth2Client.setCredentials(tokens);
        const userAuth = google.oauth2({
            version: 'v2',
            auth: tempOAuth2Client
        });

        console.log('Fetching user info...');
        const response = await userAuth.userinfo.get();

        if (!response || !response.data.email) {
            res.status(500).send(JSON.stringify({ "error": "Could not retrieve email address" }));
            return;
        }

        const email = response.data.email;
        console.log('Email retrieved:', email);

        // ✅ FIX: Database operations BEFORE sending response
        try {
            const result = await query('SELECT * FROM creators WHERE email = $1', [email]);

            if (result.rows.length === 0) {
                // For EDITORS: we might not get a refresh_token (and that's OK!)
                if (userType === 'editor') {
                    // Editors don't need refresh tokens
                    await query(
                        'INSERT INTO creators (email, access_token, refresh_token, editor) VALUES ($1, $2, $3, $4)',
                        [email, access_token || '', '', ""] // Empty refresh_token is fine
                    );
                } else {
                    // Creators MUST have refresh_token
                    if (!refresh_token) {
                        res.status(500).send(JSON.stringify({
                            error: "Authorization failed. Please try again."
                        }));
                        return;
                    }
                    await query(
                        'INSERT INTO creators (email, access_token, refresh_token, editor) VALUES ($1, $2, $3, $4)',
                        [email, access_token, refresh_token, ""]
                    );
                }
            } else {
                // Existing user - update logic stays mostly the same
                const existingRefreshToken = result.rows[0].refresh_token;
                const tokenToStore = refresh_token || existingRefreshToken;

                // For editors, empty refresh_token is acceptable
                if (userType !== 'editor' && !tokenToStore) {
                    res.status(500).send(JSON.stringify({
                        error: "No valid refresh token. Please revoke access and re-authorize."
                    }));
                    return;
                }

                await query(
                    'UPDATE creators SET access_token = $1, refresh_token = $2 WHERE email = $3',
                    [access_token, tokenToStore || '', email]
                );
            }

            // ✅ Verify token was stored
            const verification = await query(
                'SELECT email, refresh_token FROM creators WHERE email = $1',
                [email]
            );

            if (verification.rows.length === 0 || !verification.rows[0].refresh_token) {
                console.error('❌ Token verification failed!');
                res.status(500).send(JSON.stringify({
                    error: "Token storage failed. Please try again."
                }));
                return;
            }

            console.log('✅ Token stored and verified successfully');

            // ✅ NOW send success response
            res.status(200).send(JSON.stringify({ email }));

        } catch (dbErr) {
            console.error('❌ Database error:', dbErr);
            res.status(500).send(JSON.stringify({
                error: "Database error during authentication"
            }));
            return;
        }

    } catch (err) {
        console.error('OAuth error details:', err);
        res.status(500).send(JSON.stringify({
            "error": "Error during authentication process",
            "details": (err as Error).message
        }));
    }
});

// ============ EDITOR ROUTES ============
router.post('/api/editor/register', async (req, res) => {
    try {
        const { email } = req.body;

        const existingEditor = await query(
            'SELECT * FROM editors WHERE email = $1',
            [email]
        );

        if (existingEditor.rows.length > 0) {
            res.status(200).send(JSON.stringify({
                message: "Editor already registered",
                email: existingEditor.rows[0].email
            }));
            return;
        }

        await query(
            'INSERT INTO editors (email, rating, people) VALUES ($1, $2, $3)',
            [email, 0, 0]
        );

        res.status(201).send(JSON.stringify({
            message: "Editor registered successfully",
            email
        }));

    } catch (err) {
        console.error('Editor registration error:', err);
        res.status(500).send(JSON.stringify({
            error: "Error occurred while registering editor"
        }));
    }
});

router.get('/api/editors', async (_req, res) => {
    try {
        const result = await query('SELECT email, rating, people FROM editors');
        res.status(200).send(JSON.stringify({ editors: result.rows }));
    } catch (err) {
        console.error('Error fetching editors:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching editors" }));
    }
});

router.get('/api/editor/:editorEmail/requests', async (req, res) => {
    try {
        const { editorEmail } = req.params;
        const result = await query(
            'SELECT creator_email FROM creator_requests WHERE editor_email = $1',
            [editorEmail]
        );
        const requests = result.rows.map(row => row.creator_email);
        res.status(200).send(JSON.stringify({ requests }));
    } catch (err) {
        console.error('Error fetching requests:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching requests" }));
    }
});

router.get('/api/editor/:editorEmail/creators', async (req, res) => {
    try {
        const { editorEmail } = req.params;
        const result = await query(
            'SELECT email FROM creators WHERE editor = $1',
            [editorEmail]
        );
        const creators = result.rows.map(row => row.email);
        res.status(200).send(JSON.stringify({ creators }));
    } catch (err) {
        console.error('Error fetching creators:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching creators" }));
    }
});

// ============ CREATOR ROUTES ============
router.get('/api/creator/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const result = await query('SELECT * FROM creators WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            res.status(404).send(JSON.stringify({ error: "Creator not found" }));
            return;
        }

        res.status(200).send(JSON.stringify(result.rows[0]));
    } catch (err) {
        console.error('Error fetching creator:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching creator data" }));
    }
});

router.post('/api/creator/:email/editor', async (req, res) => {
    try {
        const { email } = req.params;
        const { editorEmail } = req.body;

        await query(
            'UPDATE creators SET editor = $1 WHERE email = $2',
            [editorEmail, email]
        );

        res.status(200).send(JSON.stringify({ message: "Editor added successfully" }));
    } catch (err) {
        console.error('Error adding editor:', err);
        res.status(500).send(JSON.stringify({ error: "Error adding editor" }));
    }
});

router.delete('/api/creator/:email/editor', async (req, res) => {
    try {
        const { email } = req.params;

        await query(
            'UPDATE creators SET editor = $1 WHERE email = $2',
            ['', email]
        );

        res.status(200).send(JSON.stringify({ message: "Editor revoked successfully" }));
    } catch (err) {
        console.error('Error revoking editor:', err);
        res.status(500).send(JSON.stringify({ error: "Error revoking editor" }));
    }
});

// ============ VIDEO ROUTES ============
router.get('/api/videos/:creatorEmail', async (req, res) => {
    try {
        const { creatorEmail } = req.params;
        const result = await query(
            'SELECT * FROM videos WHERE creator_email = $1 ORDER BY created_at DESC',
            [creatorEmail]
        );

        const videos = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            tags: row.tags,
            category: row.category,
            privacyStatus: row.privacy_status,
            filepath: row.file_path,
            fileUrl: row.file_url,
            thumbNailPath: row.thumbnail_path,
            thumbNailUrl: row.thumbnail_url,
            rating: row.rating,
            editedBy: row.edited_by,
            youtubeId: row.youtube_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.status(200).send(JSON.stringify(videos));
    } catch (err) {
        console.error('Error fetching videos:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching videos" }));
    }
});

router.post('/api/videos/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send(JSON.stringify({ error: "No file uploaded" }));
            return;
        }

        const { filename, creatorEmail, videoData } = req.body;
        const video = JSON.parse(videoData);

        const filepath = saveFile(filename, req.file.buffer);

        await query(
            `INSERT INTO videos (id, creator_email, title, description, tags, category, privacy_status,
             file_path, file_url, thumbnail_path, thumbnail_url, rating, edited_by, youtube_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                video.id,
                creatorEmail,
                video.title,
                video.description || '',
                video.tags || '',
                video.category || '22', // Default category: People & Blogs
                video.privacyStatus || 'public',
                filepath,
                filename,
                video.thumbNailPath || '',
                video.thumbNailUrl || '',
                video.rating || 0,
                video.editedBy || '',
                video.youtubeId || '',
                video.status || 'draft'
            ]
        );

        res.status(200).send(JSON.stringify({ message: "Video uploaded successfully" }));
    } catch (err) {
        console.error('Error uploading video:', err);
        res.status(500).send(JSON.stringify({ error: "Error uploading video" }));
    }
});

router.put('/api/videos/:creatorEmail/:videoId', async (req, res) => {
    try {
        const { creatorEmail, videoId } = req.params;
        const {
            title, description, tags, category, privacyStatus,
            thumbNailPath, thumbNailUrl, status, editedBy, editorEmail
        } = req.body;

        const videoResult = await query('SELECT creator_email FROM videos WHERE id = $1', [videoId]);
        if (videoResult.rows.length === 0) {
            res.status(404).send(JSON.stringify({ error: "Video not found" }));
            return;
        }

        const videoCreatorEmail = videoResult.rows[0].creator_email;

        if (editorEmail && editorEmail !== videoCreatorEmail) {
            const permCheck = await query(
                `SELECT permissions FROM team_members 
                 WHERE creator_email = $1 AND editor_email = $2 AND status = 'active'`,
                [videoCreatorEmail, editorEmail]
            );

            if (permCheck.rows.length === 0) {
                res.status(403).send(JSON.stringify({ error: "Not authorized" }));
                return;
            }

            let hasPermission = false;
            for (const row of permCheck.rows) {
                const perms = row.permissions;
                if (perms.canEditMetadata === true || perms.canUploadThumbnails === true) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                res.status(403).send(JSON.stringify({ error: "Not authorized" }));
                return;
            }
        }

        await query(
            `UPDATE videos SET title = $1, description = $2, tags = $3, category = $4, 
             privacy_status = $5, thumbnail_path = $6, thumbnail_url = $7, status = $8, 
             edited_by = $9, updated_at = NOW()
             WHERE id = $10 AND creator_email = $11`,
            [title, description, tags, category, privacyStatus, thumbNailPath, thumbNailUrl,
                status, editedBy, videoId, creatorEmail]
        );

        res.status(200).send(JSON.stringify({ message: "Video updated successfully" }));
    } catch (err) {
        console.error('Error updating video:', err);
        res.status(500).send(JSON.stringify({ error: "Error updating video" }));
    }
});

router.delete('/api/videos/:creatorEmail/:videoId', async (req, res) => {
    try {
        const { creatorEmail, videoId } = req.params;

        const result = await query(
            'SELECT file_path, thumbnail_path FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        if (result.rows.length > 0) {
            const { file_path, thumbnail_path } = result.rows[0];

            // Delete files from disk - file_path is already complete path
            if (file_path && fs.existsSync(file_path)) {
                fs.unlinkSync(file_path);
            }
            if (thumbnail_path && fs.existsSync(thumbnail_path)) {
                fs.unlinkSync(thumbnail_path);
            }
        }

        await query(
            'DELETE FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        res.status(200).send(JSON.stringify({ message: "Video deleted successfully" }));
    } catch (err) {
        console.error('Error deleting video:', err);
        res.status(500).send(JSON.stringify({ error: "Error deleting video" }));
    }
});

router.post('/api/videos/:creatorEmail/:videoId/publish', async (req: express.Request, res: express.Response) => {
    try {
        const { videoId, creatorEmail } = req.params;

        console.log('Publishing video:', { videoId, creatorEmail });

        // Get video details
        const videoResult = await query(
            'SELECT * FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        if (videoResult.rows.length === 0) {
            console.error('Video not found');
            res.status(404).send(JSON.stringify({ error: "Video not found" }));
            return;
        }

        const {
            file_path: filepath,
            title,
            description,
            tags,
            category,
            privacy_status: privacyStatus,
            youtube_id: youtubeId
        } = videoResult.rows[0];

        let enhancedDescription = description || '';

        if (tags) {
            const tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            const hashtags = tagsArray
                .slice(0, 15) // YouTube allows max 15 hashtags
                .map((tag: string) => `#${tag.replace(/\s+/g, '')}`) // Remove spaces, add #
                .join(' ');

            // Add hashtags at the end of description
            if (hashtags) {
                enhancedDescription = `${enhancedDescription}\n\n${hashtags}`;
            }
        }

        console.log('Enhanced description with hashtags:', enhancedDescription);

        console.log('Video details:', { title, category, privacyStatus, youtubeId });

        // Get creator credentials
        const creatorResult = await query(
            'SELECT refresh_token FROM creators WHERE email = $1',
            [creatorEmail]
        );

        if (creatorResult.rows.length === 0) {
            console.error('Creator not found');
            res.status(404).send(JSON.stringify({ error: "Creator not found" }));
            return;
        }

        const { refresh_token } = creatorResult.rows[0];

        if (!refresh_token) {
            console.error('No refresh token');
            res.status(400).send(JSON.stringify({ error: "No refresh token. Please login again." }));
            return;
        }

        console.log('Refreshing access token...');

        // Refresh the access token
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
        oAuth2Client.setCredentials({
            refresh_token
        });

        let credentials;
        try {
            const refreshResult = await oAuth2Client.refreshAccessToken();
            credentials = refreshResult.credentials;
            console.log('Token refreshed successfully');
        } catch (tokenError) {
            console.error('Token refresh error:', tokenError);
            res.status(401).send(JSON.stringify({
                error: "Failed to refresh token. Please re-authenticate with Google."
            }));
            return;
        }

        await query(
            'UPDATE creators SET access_token = $1, refresh_token = $2 WHERE email = $3',
            [credentials.access_token, credentials.refresh_token, creatorEmail]
        );

        const ytAuth = new google.auth.OAuth2();
        ytAuth.setCredentials(credentials);

        let uploadedVideoId = youtubeId;

        // Upload to YouTube if not already uploaded
        if (!uploadedVideoId) {
            console.log('Uploading to YouTube...');
            sendEmail('videoPublished', {
                creatorEmail,
                videoTitle: title,
                youtubeId: uploadedVideoId
            });

            // 🆕 SEND EMAIL to editor if exists
            if (videoResult.rows[0].edited_by) {
                sendEmail('videoPublished', {
                    creatorEmail,
                    editorEmail: videoResult.rows[0].edited_by,
                    videoTitle: title,
                    youtubeId: uploadedVideoId
                });
            }
            const tagsArray = tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

            try {
                uploadedVideoId = await uploadVideo(
                    title,
                    enhancedDescription,
                    tagsArray,
                    filepath,
                    ytAuth,
                    category || '22',
                    privacyStatus || 'public'
                );
                console.log('YouTube upload successful:', uploadedVideoId);
            } catch (uploadError) {
                console.error('YouTube upload error:', uploadError);
                res.status(500).send(JSON.stringify({
                    error: "YouTube upload failed: " + (uploadError as Error).message
                }));
                return;
            }

            await query(
                'UPDATE videos SET youtube_id = $1, status = $2 WHERE id = $3',
                [uploadedVideoId, 'published', videoId]
            );
        }

        // Handle thumbnail upload if path exists
        console.log('Video row from DB:', videoResult.rows[0]);
        console.log('Thumbnail path from DB:', videoResult.rows[0]?.thumbnail_path);

        const thumbnailFilename = videoResult.rows[0]?.thumbnail_path;
        let thumbnailPath = null;

        if (thumbnailFilename) {
            const path = require('path');
            thumbnailPath = path.join(__dirname, '../../uploads', thumbnailFilename);
            console.log('Constructed full thumbnail path:', thumbnailPath);
        }

        if (thumbnailPath && uploadedVideoId) {
            console.log('Attempting thumbnail upload...');

            const fs = require('fs');
            if (!fs.existsSync(thumbnailPath)) {
                console.error('Thumbnail file not found at path:', thumbnailPath);
            } else {
                try {
                    const result = await uploadThumbnail(ytAuth, uploadedVideoId, thumbnailPath);
                    console.log('Thumbnail uploaded successfully:', result);
                } catch (thumbError) {
                    console.error('Thumbnail upload failed:', thumbError);
                    console.error('Video published but thumbnail failed. User can upload manually.');
                }
            }
        } else {
            console.log('No thumbnail to upload or no video ID');
        }

        res.status(200).send(JSON.stringify({
            data: "Video uploaded successfully to YouTube!",
            youtubeId: uploadedVideoId
        }));

    } catch (err) {
        console.error('Publish error:', err);
        res.status(500).send(JSON.stringify({
            error: "Error publishing video: " + (err as Error).message
        }));
    }
});

router.post('/api/thumbnail/upload',
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                res.status(400).send(JSON.stringify({ error: "No file uploaded" }));
                return;
            }

            const { filename, videoId, editorEmail } = req.body;

            // Check permission manually here
            if (videoId && editorEmail) {
                const videoResult = await query('SELECT creator_email FROM videos WHERE id = $1', [videoId]);
                if (videoResult.rows.length > 0) {
                    const creatorEmail = videoResult.rows[0].creator_email;

                    // If not creator, check permissions
                    if (editorEmail !== creatorEmail) {
                        const permCheck = await query(
                            `SELECT permissions FROM team_members 
                             WHERE creator_email = $1 AND editor_email = $2 AND status = 'active'`,
                            [creatorEmail, editorEmail]
                        );

                        let hasPermission = false;
                        for (const row of permCheck.rows) {
                            if (row.permissions.canUploadThumbnails === true) {
                                hasPermission = true;
                                break;
                            }
                        }

                        if (!hasPermission) {
                            res.status(403).send(JSON.stringify({ error: "Not authorized to upload thumbnails" }));
                            return;
                        }
                    }
                }
            }

            saveFile(filename, req.file.buffer);

            res.status(200).send(JSON.stringify({ message: "Thumbnail uploaded successfully" }));
        } catch (err) {
            console.error('Error uploading thumbnail:', err);
            res.status(500).send(JSON.stringify({ error: "Error uploading thumbnail" }));
        }
    }
);

// ============ FILE DOWNLOAD & STREAMING ROUTES ============
router.get('/api/videos/:creatorEmail/:videoId/download', async (req, res) => {
    try {
        const { creatorEmail, videoId } = req.params;
        const editorEmail = req.query.editorEmail as string;

        const result = await query(
            'SELECT file_path, title, creator_email FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        if (result.rows.length === 0) {
            res.status(404).send('Video not found');
            return;
        }

        const { file_path, title, creator_email } = result.rows[0];

        // Check if user is authorized (creator OR assigned editor)
        if (editorEmail && editorEmail !== creator_email) {
            const assignmentCheck = await query(
                'SELECT * FROM video_assignments WHERE video_id = $1 AND editor_email = $2',
                [videoId, editorEmail]
            );

            if (assignmentCheck.rows.length === 0) {
                res.status(403).send('Not authorized - not assigned to this video');
                return;
            }
        }

        const fs = require('fs');

        if (!fs.existsSync(file_path)) {
            console.error('File does not exist:', file_path);
            res.status(404).send('Video file not found on server');
            return;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        const fileStream = fs.createReadStream(file_path);

        fileStream.on('error', (error: any) => {
            console.error('File stream error:', error);
            res.status(500).send('Error streaming file');
        });

        fileStream.pipe(res);

    } catch (err) {
        console.error('Error downloading video:', err);
        res.status(500).send('Error downloading video');
    }
});

router.get('/api/videos/:creatorEmail/:videoId/stream', async (req, res) => {
    try {
        const { creatorEmail, videoId } = req.params;
        const editorEmail = req.query.editorEmail as string;

        const result = await query(
            'SELECT file_path, creator_email FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        if (result.rows.length === 0) {
            res.status(404).send('Video not found');
            return;
        }

        const { file_path, creator_email } = result.rows[0];

        // Check if user is authorized
        if (editorEmail && editorEmail !== creator_email) {
            const assignmentCheck = await query(
                'SELECT * FROM video_assignments WHERE video_id = $1 AND editor_email = $2',
                [videoId, editorEmail]
            );

            if (assignmentCheck.rows.length === 0) {
                res.status(403).send('Not authorized - not assigned to this video');
                return;
            }
        }

        const fs = require('fs');

        if (!fs.existsSync(file_path)) {
            console.error('File does not exist:', file_path);
            res.status(404).send('Video file not found on server');
            return;
        }

        const stat = fs.statSync(file_path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(file_path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(file_path).pipe(res);
        }

    } catch (err) {
        console.error('Error streaming video:', err);
        res.status(500).send('Error streaming video');
    }
});

// Editor uploads edited version of video
router.post('/api/videos/:creatorEmail/:videoId/replace', upload.single('file'), checkPermission('canUploadEditedVideos'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send(JSON.stringify({ error: "No file uploaded" }));
            return;
        }

        const { creatorEmail, videoId } = req.params;
        const { filename } = req.body;

        console.log('Replace video request:', { creatorEmail, videoId, filename });

        // Get old file path
        const result = await query(
            'SELECT file_path FROM videos WHERE id = $1 AND creator_email = $2',
            [videoId, creatorEmail]
        );

        if (result.rows.length === 0) {
            res.status(404).send(JSON.stringify({ error: "Video not found" }));
            return;
        }

        const oldFilePath = result.rows[0].file_path;
        console.log('Old file path:', oldFilePath);

        // Save new file
        const newFilePath = saveFile(filename, req.file.buffer);
        console.log('New file path:', newFilePath);

        // Update database
        await query(
            'UPDATE videos SET file_path = $1, file_url = $2, updated_at = NOW() WHERE id = $3 AND creator_email = $4',
            [newFilePath, filename, videoId, creatorEmail]
        );

        // Delete old file
        if (oldFilePath) {
            try {
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log('Old file deleted:', oldFilePath);
                }
            } catch (deleteErr) {
                console.error('Error deleting old file:', deleteErr);
                // Don't fail the request if delete fails
            }
        }

        res.status(200).send(JSON.stringify({ message: "Video replaced successfully" }));
    } catch (err) {
        console.error('Error replacing video:', err);
        res.status(500).send(JSON.stringify({ error: "Error replacing video" }));
    }
});

// Approve video (creator only)
router.post('/api/videos/:creatorEmail/:videoId/approve', async (req, res) => {
    try {
        const { creatorEmail, videoId } = req.params;

        await query(
            'UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2 AND creator_email = $3',
            ['approved', videoId, creatorEmail]
        );

        res.status(200).send(JSON.stringify({ message: "Video approved successfully" }));
    } catch (err) {
        console.error('Error approving video:', err);
        res.status(500).send(JSON.stringify({ error: "Error approving video" }));
    }
});

// ============ RATING ROUTES ============
router.post('/api/rating', async (req, res) => {
    try {
        const { creatorEmail, videoId, editedBy, rating } = req.body;

        await query(
            'UPDATE videos SET rating = $1 WHERE id = $2 AND creator_email = $3',
            [rating, videoId, creatorEmail]
        );

        const editorResult = await query(
            'SELECT rating, people FROM editors WHERE email = $1',
            [editedBy]
        );

        if (editorResult.rows.length > 0) {
            const { rating: currentRating, people } = editorResult.rows[0];
            await query(
                'UPDATE editors SET rating = $1, people = $2 WHERE email = $3',
                [currentRating + rating, people + 1, editedBy]
            );
        }

        res.status(200).send(JSON.stringify({ message: "Rating updated successfully" }));
    } catch (err) {
        console.error('Error updating rating:', err);
        res.status(500).send(JSON.stringify({ error: "Error updating rating" }));
    }
});

// ============ CHAT ROUTES ============
router.get('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        const result = await query(
            'SELECT "from", "to", message FROM chats WHERE chat_id = $1 ORDER BY created_at ASC',
            [chatId]
        );

        res.status(200).send(JSON.stringify({ chats: result.rows }));
    } catch (err) {
        console.error('Error fetching chats:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching chats" }));
    }
});

// ============ AI ROUTES ============
router.post("/askTitleDescription", async (req, res) => {
    try {
        const { content } = req.body;
        const answer = await getTitleDescription(content);
        res.status(200).send(JSON.stringify({ answer }))
    } catch (e) {
        res.status(500).send(JSON.stringify({ error: (e as Error).message }))
    }
})

router.get('/api/thumbnail/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const fs = require('fs');
        const path = require('path');

        const thumbnailPath = path.join(__dirname, '../../uploads', filename);

        if (!fs.existsSync(thumbnailPath)) {
            res.status(404).send('Thumbnail not found');
            return;
        }

        const ext = path.extname(filename).toLowerCase();
        const contentTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };

        res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');

        const fileStream = fs.createReadStream(thumbnailPath);
        fileStream.pipe(res);

    } catch (err) {
        console.error('Error serving thumbnail:', err);
        res.status(500).send('Error serving thumbnail');
    }
});


router.get('/api/videos/editor/:editorEmail', async (req, res) => {
    try {
        const { editorEmail } = req.params;

        const result = await query(
            `SELECT DISTINCT
                v.*,
                va.role as assigned_role,
                va.task_status,
                va.assigned_at,
                va.notes
             FROM videos v
             JOIN video_assignments va ON va.video_id = v.id
             WHERE va.editor_email = $1
             ORDER BY v.created_at DESC`,
            [editorEmail]
        );

        const videos = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            tags: row.tags,
            category: row.category,
            privacyStatus: row.privacy_status,
            filepath: row.file_path,
            fileUrl: row.file_url,
            thumbNailPath: row.thumbnail_path,
            thumbNailUrl: row.thumbnail_url,
            rating: row.rating,
            editedBy: row.edited_by,
            youtubeId: row.youtube_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            creatorEmail: row.creator_email,  // MAKE SURE THIS IS HERE
            assignedRole: row.assigned_role,
            taskStatus: row.task_status,
            assignedAt: row.assigned_at,
            taskNotes: row.notes
        }));

        res.status(200).send(JSON.stringify(videos));
    } catch (err) {
        console.error('Error fetching editor videos:', err);
        res.status(500).send(JSON.stringify({ error: "Error fetching videos" }));
    }
});

// ============ HELPER FUNCTION: Check if user has permission ============

async function hasPermission(
    videoId: string,
    userEmail: string,
    action: string
): Promise<boolean> {
    try {
        // Get video creator
        const videoResult = await query(
            'SELECT creator_email FROM videos WHERE id = $1',
            [videoId]
        );

        if (videoResult.rows.length === 0) return false;

        const creatorEmail = videoResult.rows[0].creator_email;

        // Creator always has all permissions
        if (userEmail === creatorEmail) return true;

        // Check editor permissions
        const permResult = await query(
            `SELECT permissions FROM team_members 
             WHERE creator_email = $1 AND editor_email = $2 AND status = 'active'`,
            [creatorEmail, userEmail]
        );

        for (const row of permResult.rows) {
            if (row.permissions[action] === true) {
                return true;
            }
        }

        return false;
    } catch (err) {
        console.error('Permission check error:', err);
        return false;
    }
}

// Export helper for use in other files
export { hasPermission };


// Add this route BEFORE the catch-all route
router.get('/api/thumbnail/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const fs = require('fs');
        const path = require('path');

        // Construct full path to thumbnail
        const thumbnailPath = path.join(__dirname, '../../uploads', filename);

        if (!fs.existsSync(thumbnailPath)) {
            res.status(404).send('Thumbnail not found');
            return;
        }

        // Determine content type based on extension
        const ext = path.extname(filename).toLowerCase();
        const contentTypes: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };

        res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');

        const fileStream = fs.createReadStream(thumbnailPath);
        fileStream.pipe(res);

    } catch (err) {
        console.error('Error serving thumbnail:', err);
        res.status(500).send('Error serving thumbnail');
    }
});


// ============ CATCH-ALL ============
// router.all("*",(_req,res)=>{
//     res.status(404).send("route not found")
// })