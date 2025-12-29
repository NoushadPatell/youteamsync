import {memo, useCallback, useEffect, useState} from "react";
import {ChatPanel} from "@/components/ChatPanel.tsx";
import {toast} from "sonner";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "./ui/table";
import { getEditors } from "@/utilities/api.ts";

type EditorInfo={
    email:string,
    people:number,
    rating:number
}
export const FindEditor=memo(({creatorEmail}:{creatorEmail:string})=>{
    const [editors,setEditors]=useState<EditorInfo[]>([]);
    const getEditorsData=useCallback(async () => {
        try {
            const data = await getEditors();
            const editors = data.editors || [];
            editors.sort((a: EditorInfo, b: EditorInfo)=>{
                return b.rating/((b.people)?(b.people):1)-a.rating / ((a.people)?(a.people):1)
            })
            setEditors(editors as EditorInfo[])
        } catch (error) {
            toast("Failed to load editors.", {
                action: {
                    label: "Close",
                    onClick: () => console.log("Close"),
                },
            })
        }
    },[])
    useEffect(() => {
        getEditorsData()
    }, [getEditorsData]);
    return <div>
        <div className={"bg-gray-400 rounded-md p-2 font-bold mt-2 mb-1"}>
            Get Editors
        </div>
        <Table className={"max-w-3xl"}>
            <TableCaption>A list of top Editors.</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead className={"text-center"}>Rating</TableHead>
                    <TableHead className={"text-center"}>Edits</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {editors.map((value) => (
                    <TableRow key={value.email} >
                        <TableCell className="font-medium ">{value.email} <ChatPanel fromUser={creatorEmail} toUser={value.email} requestEditor={true}/></TableCell>
                        <TableCell className={"text-center"}>{value.rating / (value.people === 0 ? 1 : value.people)}</TableCell>
                        <TableCell className={"text-center"}>{value.people}</TableCell>
                    </TableRow>
                ))}
            </TableBody>

        </Table>


    </div>
})