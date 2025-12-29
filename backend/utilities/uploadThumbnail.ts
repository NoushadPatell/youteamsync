import { OAuth2Client } from "google-auth-library";
import {google} from "googleapis";
import fs from 'fs';

export const uploadThumbnail=async (ytAuth:OAuth2Client,videoId:string,thumbNailPath:string)=>{
    return new Promise((resolve, reject)=>{
        const service = google.youtube('v3')
        const stream = fs.createReadStream(thumbNailPath);
        service.thumbnails.set({
            auth: ytAuth,
            videoId:videoId,
            media: {
                body: stream
            },
        }, function(err) {
            if (err) {
                console.log('The API returned an error: ' + err);
                reject("thumbnail upload failed")
                return;
            }
            resolve("thumbnail uploaded successfully");
        })
    })

}