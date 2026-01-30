// src/components/VideoCardSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export const VideoCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 flex-grow" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
};