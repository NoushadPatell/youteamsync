
import express, {Router} from "express"
import {google} from "googleapis";
import { query } from "./database";
import {uploadVideo} from "./uploadVideo";
import {getTitleDescription} from "./askAI";
import {uploadThumbnail} from "./uploadThumbnail";
export type videoInfoType ={
    filepath:string,
    fileUrl:string,
    id:string,
    title:string,
    description:string,
    tags:string,
    thumbNailUrl:string,
    thumbNailPath:string,
    rating:number,
    editedBy:string,
    youtubeId:string
}
export const router=Router();
const client_id = process.env.VITE_CLIENT_ID;
const client_secret = process.env.VITE_CLIENT_SECRET;
const redirect_url = process.env.VITE_REDIRECT_URL;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
const scopes = [
    //readonly to be added in future
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.email',
    // 'https://www.googleapis.com/auth/userinfo.profile',  'https://www.googleapis.com/auth/youtubepartner',
    // 'https://www.googleapis.com/auth/youtube',
    // 'https://www.googleapis.com/auth/youtube.force-ssl'
];


router.get('/getAuthUrl', (_req, res) => {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
    });
    res.send(JSON.stringify({authorizeUrl}));
})

router.post('/getEmail', async (req, res) => {
    const {code} = req.body;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
    const {tokens} = await oAuth2Client.getToken(code as string);

    if(!(tokens.scope && tokens.scope.includes('https://www.googleapis.com/auth/youtube.upload'))){
        res.send(JSON.stringify({"error":"Youtube upload permissions not provided by the user. Try Again."}));
        return;
    }

    const {access_token, refresh_token} = tokens

    oAuth2Client.setCredentials(tokens);
    const userAuth = google.oauth2({
        version: 'v2',
        auth: oAuth2Client
    })

    userAuth.userinfo.get(async (err, response) => {
        if (err) {
            res.send(JSON.stringify({"error":"error occurred while fetching email address"}));
        } else if (response && response.data.email) {
            const email = response.data.email;
            res.send(JSON.stringify({email}));
            try {
                const result = await query('SELECT * FROM creators WHERE email = $1', [email]);
                if (result.rows.length === 0) {
                    await query(
                        'INSERT INTO creators (email, access_token, refresh_token, editor) VALUES ($1, $2, $3, $4)',
                        [email, access_token, refresh_token, ""]
                    );
                } else {
                    await query('UPDATE creators SET access_token = $1 WHERE email = $2', [access_token, email]);
                }
            } catch (err) {
                console.log(err)
            }
        }

    })

})

router.post('/uploadVideo', async(req:express.Request, res:express.Response) => {
    try {
        const {id, email} = req.body;
        console.log(id, email);
        
        // Get video by id and creator email
        const videoResult = await query(
            'SELECT * FROM videos WHERE id = $1 AND creator_email = $2',
            [id, email]
        );
        
        if (videoResult.rows.length === 0) {
            res.status(404).send(JSON.stringify({error:"video not found"}));
            return;
        }
        
        const {file_path: filepath, title, description, tags, youtube_id: youtubeId} = videoResult.rows[0];
        const tagsArray = tags.split(',');
        
        // Get creator credentials
        const creatorResult = await query(
            'SELECT refresh_token FROM creators WHERE email = $1',
            [email]
        );
        
        if (creatorResult.rows.length === 0) {
            res.status(404).send(JSON.stringify({error:"creator not found"}));
            return;
        }
        
        const {refresh_token} = creatorResult.rows[0];

        //refresh the access token
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_url);
        oAuth2Client.setCredentials({
            refresh_token
        })
        const {credentials}=await oAuth2Client.refreshAccessToken();

        await query(
            'UPDATE creators SET access_token = $1, refresh_token = $2 WHERE email = $3',
            [credentials.access_token, credentials.refresh_token, email]
        );
        
        const ytAuth=new google.auth.OAuth2({
            credentials
        })
        
        let videoId=youtubeId;
        if(!videoId){
            videoId=await uploadVideo(title, description, tagsArray, filepath,ytAuth)
        }
        if(!youtubeId){
            await query(
                'UPDATE videos SET youtube_id = $1 WHERE id = $2',
                [videoId, id]
            );
        }
        
        // Handle thumbnail upload if path exists
        const thumbnailResult = await query(
            'SELECT * FROM videos WHERE id = $1',
            [id]
        );
        const thumbNailPath = thumbnailResult.rows[0]?.thumbnail_path;
        
        if(thumbNailPath){
            await uploadThumbnail(ytAuth,videoId,thumbNailPath);
        }

        res.status(200).send(JSON.stringify({data:"video uploaded successfully"}));
    }
    catch (err) {
        res.status(501).send(JSON.stringify({error:(err as Error).message}));
    }

})
router.post("/askTitleDescription",async (req,res)=>{
    try {
        const {content}=req.body;
        const answer=await getTitleDescription(content);
        res.status(200).send(JSON.stringify({answer}))
    }catch (e){
        res.status(501).send(JSON.stringify({error:(e as Error).message}))
    }
})

router.all("*",(_req,res)=>{
    res.status(404).send("route not found")
})