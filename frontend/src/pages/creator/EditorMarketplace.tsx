// src/pages/creator/EditorMarketplace.tsx
import { memo } from "react";
import { useOutletContext } from "react-router-dom";
import { CreatorOutletContext } from "@/types/context";
import { FindEditor } from "@/components/FindEditor.tsx";

export const EditorMarketplace = memo(() => {
    const { email } = useOutletContext<CreatorOutletContext>();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Editor Marketplace</h1>
                <p className="text-gray-600 mt-1">Discover and connect with talented video editors</p>
            </div>

            {/* FindEditor Component (unchanged) */}
            <FindEditor creatorEmail={email} />
        </div>
    );
});

EditorMarketplace.displayName = 'EditorMarketplace';