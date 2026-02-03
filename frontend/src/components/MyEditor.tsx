import React, {memo, useCallback, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import { apiCall } from "@/utilities/api.ts";
import { UserPlus, UserX, User } from "lucide-react";

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
    
    return <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-success-light to-brand-pale px-6 py-4 border-b-2 border-success">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-success to-brand rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">My Editor</h3>
                    <p className="text-sm text-gray-600">Primary editor access</p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-6">
            {editor===""?
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300 text-center">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 font-medium">No primary editor assigned</p>
                        <p className="text-xs text-gray-500 mt-1">Add an editor to get started</p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-gradient-to-r from-success to-brand hover:from-success hover:to-teal-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                <UserPlus className="w-5 h-5 mr-2" />
                                Add Primary Editor
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-success-dark to-brand bg-clip-text text-transparent">
                                    Add Primary Editor
                                </DialogTitle>
                                <p className="text-sm text-gray-500 mt-2">Grant primary editing permissions to a team member</p>
                            </DialogHeader>
                            <div className="py-6">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                        Editor Email Address
                                    </Label>
                                    <Input 
                                        value={newEditor} 
                                        onChange={(e)=>setNewEditor(e.target.value)}
                                        placeholder="editor@example.com"
                                        className="rounded-xl border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button 
                                    type='submit' 
                                    onClick={addEditorFunc}
                                    className="bg-gradient-to-r from-success to-brand hover:from-success hover:to-teal-700 rounded-xl px-6"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Editor
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            :
                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-success-light to-brand-pale rounded-xl p-5 border-2 border-success">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-gradient-to-br from-success-dark to-brand rounded-full flex items-center justify-center shadow-md text-white font-bold text-xl flex-shrink-0">
                                {editor.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-xs text-success-dark font-semibold mb-1">PRIMARY EDITOR</p>
                                <p className="text-base font-bold text-gray-900 truncate">{editor}</p>
                            </div>
                            <div className="flex items-center gap-1.5 from-successbg-green-100 px-3 py-1.5 rounded-full flex-shrink-0">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-green-700">Active</span>
                            </div>
                        </div>
                    </div>
                    <Button 
                        variant="destructive" 
                        onClick={revokeEditor}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl py-6 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        <UserX className="w-5 h-5 mr-2" />
                        Revoke Access
                    </Button>
                </div>
            }
        </div>
    </div>
})