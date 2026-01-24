import {memo, useCallback, useState} from "react";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Loader2, Sparkles, Wand2} from "lucide-react";
import {Input} from "@/components/ui/input.tsx";
import {toast} from "sonner";
import ReactMarkdown from 'react-markdown';

export const AskAI=memo(()=>{
    const [inputQues,setInputQues]=useState("");
    const [allowQues,setAllowQues]=useState(true);
    const askAnswer=useCallback(()=>{
        setInputQues("");
        setAllowQues(false);
        if(inputQues!==""){
            fetch(`${import.meta.env.VITE_BACKEND}/askTitleDescription`,{
                method:"POST",
                headers:{
                    "content-type":"application/json"
                },
                body:JSON.stringify({content:inputQues})
            }).then(res=>{
                return res.json();
            }).then(({error,answer}:{error?:string,answer?:string})=>{
                if(error){
                    toast("Error Occurred. Try Again.", {
                        action: {
                            label: "Close",
                            onClick: () => console.log("Close"),
                        },
                    })
                }
                else if(answer){
                    setAiAnswer(answer);
                }
                setAllowQues(true);
            }).catch(()=>{
                toast("Bad Request", {
                    action: {
                        label: "Close",
                        onClick: () => console.log("Close"),
                    },
                })
                setAllowQues(true);
            })

        }
    },[inputQues])

    const [aiAnswer,setAiAnswer]=useState("");
    return <Sheet>
        <SheetTrigger asChild>
            <Button className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Features
            </Button>
        </SheetTrigger>
        <SheetContent className="overflow-auto sm:max-w-xl rounded-l-2xl">
            <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                            AI Content Assistant
                        </SheetTitle>
                        <p className="text-sm text-gray-500 mt-1">Generate optimized titles and descriptions</p>
                    </div>
                </div>
            </SheetHeader>
            
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-xl p-4 border border-fuchsia-200">
                    <p className="text-sm text-gray-700 mb-3 font-medium">💡 How to use:</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                        <li>Describe your video content briefly</li>
                        <li>Mention key topics or themes</li>
                        <li>Include target audience if relevant</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Video Description</label>
                    <Input 
                        disabled={!allowQues} 
                        placeholder="E.g., Tutorial on React hooks for beginners..." 
                        className="rounded-xl border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500" 
                        value={inputQues} 
                        onChange={(e)=>setInputQues(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && allowQues && inputQues.trim()) {
                                askAnswer();
                            }
                        }}
                    />
                </div>
                
                <Button 
                    className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 rounded-xl py-6 font-semibold shadow-md" 
                    onClick={askAnswer}
                    disabled={!allowQues || !inputQues.trim()}
                >
                    {!allowQues ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Content
                        </>
                    )}
                </Button>

                {aiAnswer && (
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                            <Sparkles className="w-5 h-5 text-fuchsia-600" />
                            <h3 className="font-bold text-gray-900">AI Generated Content</h3>
                        </div>
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown className="text-gray-700 leading-relaxed">
                                {aiAnswer}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {!allowQues && !aiAnswer && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                            <Loader2 className="animate-spin w-12 h-12 text-fuchsia-600" />
                            <div className="absolute inset-0 bg-fuchsia-500/30 rounded-full blur-xl animate-pulse"></div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium">Generating your content...</p>
                        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                    </div>
                )}
            </div>
        </SheetContent>
    </Sheet>
})