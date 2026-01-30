// src/pages/creator/TeamPage.tsx
import { memo } from "react";
import { useOutletContext } from "react-router-dom";
import { CreatorOutletContext } from "@/types/context";
import { MyEditor } from "@/components/MyEditor.tsx";
import { TeamManagement } from "@/components/TeamManagement.tsx";

export const TeamPage = memo(() => {
    const { email, editor, setEditor } = useOutletContext<CreatorOutletContext>();

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600 mt-1">Manage your primary editor and team members</p>
            </div>

            {/* Primary Editor Card */}
            <MyEditor email={email} editor={editor} setEditor={setEditor} />

            {/* Team Management (Multi-role system) */}
            <TeamManagement creatorEmail={email} />
        </div>
    );
});

TeamPage.displayName = 'TeamPage';