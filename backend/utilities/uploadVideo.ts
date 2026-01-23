import fs from 'fs';
import {google} from "googleapis";
import { OAuth2Client } from "google-auth-library";

export const uploadVideo = async (
    title: string, 
    description: string, 
    tags: string[], 
    filepath: string, 
    ytAuth: OAuth2Client,
    category: string = '22',
    privacyStatus: string = 'public'
): Promise<string> => {
    try {
        let progress = 0;

        const fileStats = fs.statSync(filepath);
        const size = fileStats.size;

        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filepath);
            stream.on("data", (chunk: any) => {
                const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
                progress += buffer.length;
                const percentage = ((progress * 100) / size).toFixed(2);
                console.log("Upload progress:", percentage + "%");
            })
            
            const service = google.youtube('v3')
            service.videos.insert({
                auth: ytAuth,
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title,
                        description,
                        tags,
                        categoryId: category,
                        defaultLanguage: 'en',
                        defaultAudioLanguage: 'en'
                    },
                    status: {
                        privacyStatus: privacyStatus as 'public' | 'private' | 'unlisted',
                        selfDeclaredMadeForKids: false
                    },
                },
                media: {
                    body: stream,
                },
            }, async function (err, response) {
                if (err) {
                    console.log('YouTube API error:', err);
                    reject("Error uploading video to YouTube")
                } else {
                    if (response && response.data.id) {
                        console.log('Video uploaded successfully. ID:', response.data.id);
                        resolve(response.data.id as string)
                    } else {
                        reject("Could not get video ID from YouTube")
                    }
                }
            });
        })

    } catch (e) {
        throw new Error("Error accessing video file: " + (e as Error).message);
    }
}