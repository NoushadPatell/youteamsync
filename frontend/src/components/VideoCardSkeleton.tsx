import { Skeleton } from '@/components/ui/skeleton';

export const VideoCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6">
            <div className="flex items-start gap-4 mb-4">
                <Skeleton className="h-6 w-24 bg-brand-pale" />
                <Skeleton className="h-6 w-32 bg-brand-pale" />
                <Skeleton className="h-6 flex-grow bg-brand-pale" />
            </div>
            <Skeleton className="h-4 w-full mb-2 bg-neutral-200" />
            <Skeleton className="h-4 w-3/4 mb-4 bg-neutral-200" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24 bg-brand-pale" />
                <Skeleton className="h-10 w-24 bg-brand-pale" />
                <Skeleton className="h-10 w-24 bg-brand-pale" />
            </div>
        </div>
    );
};