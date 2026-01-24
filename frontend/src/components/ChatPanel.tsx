import {memo, useCallback, useEffect, useRef, useState} from "react";
import {Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle} from "@/components/ui/sheet.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {socket} from "@/utilities/socketConnection.ts";
import {toast} from "sonner";
import { getChatMessages } from "@/utilities/api.ts";
import { MessageCircle, Send } from "lucide-react";

export const ChatPanel=memo(({fromUser,toUser,requestEditor}:{fromUser:string,toUser:string,requestEditor:boolean})=>{
    const chatRef=useRef<HTMLDivElement|null>(null)
    const [chats,setChats]=useState<{from:string,to:string,message:string}[]>([]);
    const [chatInput,setChatInput]=useState("");
    
    const getPreviousChats=useCallback(async ()=>{
        try {
            const data = await getChatMessages(fromUser, toUser);
            let chats = data.chats || [];
            if (chats){
                if(chatRef.current){
                    chatRef.current.scrollTop=chatRef.current.scrollHeight;
                }
                setChats(chats);
            }
        } catch (error) {
            toast("Error in fetching messages.", {
                action: {
                    label: "Close",
                    onClick: () => console.log("Close"),
                },
            })
        }
    },[fromUser, toUser])
    
    const sendMessage=useCallback((message:string)=>{
        message.trim();
        if(message!==""){
            const emailConc=[fromUser,toUser];
            emailConc.sort();
            const chatId=emailConc[0]+emailConc[1];
            socket.emit("chat",{from: fromUser,to:toUser,message,chatId,requestEditor})
            setChats([...chats,{from:fromUser,to:toUser,message}]);
            setChatInput("");
            setTimeout(() => {
                if(chatRef.current){
                    chatRef.current.scrollTop=chatRef.current.scrollHeight;
                }
            }, 100);
        }
    },[chats, fromUser, requestEditor, toUser])
    
    const getMessage=useCallback(({from,message}:{from:string,message:string})=>{
        if(toUser===from){
            setChats((chats)=>[...chats,{from,to:fromUser,message}]);
            setTimeout(() => {
                if(chatRef.current){
                    chatRef.current.scrollTop=chatRef.current.scrollHeight;
                }
            }, 100);
        }
    },[fromUser, toUser])
    
    useEffect(() => {
        getPreviousChats()
    }, [getPreviousChats]);
    
    useEffect(() => {
        socket.on("chat",getMessage);
        return ()=>{
            socket.off("chat",getMessage);
        }
    }, [getMessage]);
    
    return <Sheet>
        <SheetTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
            </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col p-0 sm:max-w-md rounded-l-2xl">
            {/* Header */}
            <SheetHeader className="p-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <SheetTitle className="text-lg font-bold text-gray-900">Chat</SheetTitle>
                        <p className="text-xs text-gray-600 truncate">{toUser}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700">Online</span>
                    </div>
                </div>
            </SheetHeader>

            {/* Chat Messages */}
            <div 
                ref={chatRef} 
                className="flex-grow overflow-auto p-4 space-y-3 bg-gray-50"
            >
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600 font-medium">No messages yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    chats.map((chat,index)=>{
                        const isFromMe = chat.from === fromUser;
                        return (
                            <div 
                                key={index} 
                                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                        isFromMe 
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-sm' 
                                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed break-words">{chat.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                    <Input 
                        type="text" 
                        placeholder="Type a message..." 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && chatInput.trim()) {
                                sendMessage(chatInput);
                            }
                        }}
                        className="flex-grow rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Button 
                        onClick={() => sendMessage(chatInput)}
                        disabled={!chatInput.trim()}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl px-4 shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </SheetContent>
    </Sheet>
})