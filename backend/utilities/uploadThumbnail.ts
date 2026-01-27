import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import fs from 'fs';

export const uploadThumbnail = async (
    ytAuth: OAuth2Client, 
    videoId: string, 
    thumbNailPath: string
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Check if file exists first
        if (!fs.existsSync(thumbNailPath)) {
            console.error('Thumbnail file not found:', thumbNailPath);
            reject(new Error("Thumbnail file not found at path: " + thumbNailPath));
            return;
        }
        
        // Check file size (YouTube max is 2MB)
        const stats = fs.statSync(thumbNailPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        console.log('Thumbnail file size:', fileSizeInMB.toFixed(2), 'MB');
        
        if (fileSizeInMB > 2) {
            reject(new Error("Thumbnail file too large. Max 2MB allowed."));
            return;
        }
        
        const service = google.youtube('v3');
        const stream = fs.createReadStream(thumbNailPath);
        
        // Add error handler to stream
        stream.on('error', (err) => {
            console.error('File stream error:', err);
            reject(new Error("File stream error: " + err.message));
        });
        
        console.log('Uploading thumbnail for video:', videoId);
        
        service.thumbnails.set({
            auth: ytAuth,
            videoId: videoId,
            media: {
                body: stream,
                mimeType: 'image/jpeg' // Explicitly set mime type
            },
        }, {
            // Add timeout settings
            timeout: 60000, // 60 seconds
        }, function(err, response) {
            if (err) {
                console.error('YouTube API error:', err);
                reject(new Error("thumbnail upload failed: " + err.message));
                return;
            }
            console.log('Thumbnail uploaded successfully:', response?.data);
            resolve("thumbnail uploaded successfully");
        });
    });
}