import React, {memo, useCallback, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import { apiCall } from "@/utilities/api.ts";

export const MyEditor=memo(({email,editor,setEditor}:{email:string,editor:string,setEditor: React.Dispatch<React.SetStateAction<string>>})=>{
   
    const [newEditor,setNewEditor]=useState("");

    const revokeEditor=useCallback(async ()=>{
        if(editor!==""){
            try {
                await apiCall(`/api/creator/${encodeURIComponent(email)}/editor`, 'DELETE');
                setEditor("");
                toast("Editor revoked successfully", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })
            } catch (error) {
                toast("Failed to revoke editor", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })
            }
        }

    },[editor, email, setEditor])

    const addEditorFunc=useCallback(async ()=>{
        const emailRegex: RegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if(  newEditor==="" || !emailRegex.test(newEditor)){
            toast("Enter valid Email Address", {
                action: {
                    label: "Close",
                    onClick: () => console.log("Close"),
                },
            })
            return;
        }
        else{
            try {
                await apiCall(`/api/creator/${encodeURIComponent(email)}/editor`, 'POST', {
                    editorEmail: newEditor
                });
                setEditor(newEditor);
                setNewEditor("");
                toast("Editor added successfully", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })
            } catch (error) {
                toast("Failed to add editor", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })
            }
        }
    },[email, newEditor, setEditor])
    return <div className={"m-1 min-w-60 w-fit flex flex-col border-gray-200 border-2 rounded-md px-3 py-1  gap-1"}>
        <p className={"text-center text-xl font-bold bg-gray-100 rounded-lg"}>My Editor</p>
        <div className={"flex justify-center items-center gap-4"}>
            {editor===""?<Dialog>
                    <DialogTrigger asChild>
                        <Button className={"bg-emerald-400"}>Add Editor</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Allow access to editor</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center gap-4 ">
                            <Label htmlFor="name" >
                                Email:
                            </Label>
                            <Input  value={newEditor} onChange={(e)=>setNewEditor(e.target.value)}/>
                        </div>
                        <DialogFooter>
                            <Button type='submit' onClick={addEditorFunc}>
                                Save Changes
                            </Button>
                        </DialogFooter>

                    </DialogContent>
                </Dialog>:
                <>
                    <p>{editor}</p>
                    <Button variant={"destructive"} onClick={revokeEditor}>Revoke</Button>
                </>

            }
        </div>

    </div>
})