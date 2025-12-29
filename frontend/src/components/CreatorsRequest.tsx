import {memo, useCallback, useEffect, useState} from "react";
import {toast} from "sonner";
import {ChatPanel} from "@/components/ChatPanel.tsx";
import { getCreatorRequests } from "@/utilities/api.ts";

export const CreatorsRequest=memo(({editorEmail}:{editorEmail:string})=>{
    const [creators,setCreators]=useState<string[]>([]);
    const getCreatorsRequestsData=useCallback(async ()=>{
        try {
            const data = await getCreatorRequests(editorEmail);
            setCreators(data.requests || []);
        } catch (error) {
            toast("Error in fetching creators Request.", {
                action: {
                    label: "Close",
                    onClick: () => console.log("Close"),
                },
            })
        }
    },[editorEmail])
    useEffect(() => {
        getCreatorsRequestsData()
    }, [getCreatorsRequestsData]);
    return <>
        <div className={"bg-gray-400 rounded-md p-2 font-bold mt-2 mb-1"}>
            Request from Creators
        </div>
        <div className={"flex flex-wrap gap-4 items-center"}>
            {creators.map((value,index)=>{
                return <div key={index} className={"p-2 border-2 rounded-xl"}>{value} - <ChatPanel
                    fromUser={editorEmail} toUser={value} requestEditor={false}/></div>
            })}
        </div>

    </>
})