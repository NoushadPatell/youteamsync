import {memo, useCallback, useEffect, useState} from "react";
import {ChatPanel} from "@/components/ChatPanel.tsx";
import {toast} from "sonner";
import { getEditors } from "@/utilities/api.ts";
import { Star, TrendingUp, Award } from "lucide-react";

type EditorInfo={
    email:string,
    people:number,
    rating:number
}

export const FindEditor=memo(({creatorEmail}:{creatorEmail:string})=>{
    const [editors,setEditors]=useState<EditorInfo[]>([]);
    const [loading, setLoading] = useState(true);
    
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
        } finally {
            setLoading(false);
        }
    },[])
    
    useEffect(() => {
        getEditorsData()
    }, [getEditorsData]);
    
    return <div className="mt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-pale to-brand-light/30 p-6 border-b border-brand-light">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center shadow-lg">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Find Editors</h2>
                            <p className="text-sm text-gray-600 mt-1">Connect with top-rated video editors</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-brand-light shadow-sm">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">{editors.length} Available</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-600"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading editors...</p>
                    </div>
                ) : editors.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-amber-50 rounded-2xl border-2 border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg">No editors available</p>
                        <p className="text-sm text-gray-500 mt-2">Check back later for available editors</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {editors.map((editor, index) => {
                            const avgRating = editor.rating / (editor.people === 0 ? 1 : editor.people);
                            const isTopEditor = index < 3;
                            
                            return (
                                <div 
                                    key={editor.email}
                                    className={`relative bg-white rounded-xl border-2 p-5 hover:shadow-lg transition-all duration-300 ${
                                        isTopEditor 
                                            ? 'border-amber-300 bg-gradient-to-br from-brand-pale to-brand-light/30' 
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    {isTopEditor && (
                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-brand to-brand-dark rounded-full flex items-center justify-center shadow-lg">
                                            <Star className="w-4 h-4 text-white fill-current" />
                                        </div>
                                    )}
                                    
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-grow min-w-0">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md ${
                                                isTopEditor 
                                                    ? 'bg-gradient-to-br from-brand to-brand-dark' 
                                                    : 'bg-gradient-to-br from-brand to-brand-light'
                                            }`}>
                                                {editor.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {editor.email.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {editor.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-4 h-4 text-brand fill-current" />
                                                <span className="text-xs text-gray-600 font-medium">Rating</span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">
                                                {avgRating.toFixed(1)}
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs text-gray-600 font-medium">Projects</span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">
                                                {editor.people}
                                            </p>
                                        </div>
                                    </div>

                                    <ChatPanel 
                                        fromUser={creatorEmail} 
                                        toUser={editor.email} 
                                        requestEditor={true}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {editors.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                        💡 <span className="font-semibold">Pro tip:</span> Start a chat to discuss your project requirements
                    </p>
                </div>
            )}
        </div>
    </div>
})