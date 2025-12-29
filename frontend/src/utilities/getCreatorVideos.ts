import { getCreatorVideos as apiGetCreatorVideos } from "@/utilities/api.ts";

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

export const getCreatorVideos=async (creatorEmail:string)=>{
    try {
        const videos = await apiGetCreatorVideos(creatorEmail);
        return videos;
    } catch (error) {
        console.error("Error fetching creator videos:", error);
        return [];
    }
}