// src/pages/editor/CreatorRequests.tsx
import { useOutletContext } from "react-router-dom";
import { EditorOutletContext } from "@/types/context";
import { CreatorsRequest } from "@/components/CreatorsRequest.tsx";

export const CreatorRequests = () => {
    const { email } = useOutletContext<EditorOutletContext>();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Creator Requests</h1>
                <p className="text-gray-600 mt-1">Manage collaboration invitations from creators</p>
            </div>

            {/* ⚠️ EXACT SAME component from EditorPage */}
            <CreatorsRequest editorEmail={email} />
        </div>
    );
};