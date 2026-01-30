// src/components/layout/GlobalSearch.tsx
import { useState, useCallback, useEffect } from 'react';
import { Search, Video, Users, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { getCreatorVideos } from '@/utilities/getCreatorVideos';

type SearchResult = {
    type: 'video' | 'team';
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    url: string;
};

export const GlobalSearch = ({ userEmail, userType }: { userEmail: string; userType: 'creator' | 'editor' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        const searchResults: SearchResult[] = [];

        try {
            // Search videos
            const videos = await getCreatorVideos(userEmail);
            const matchedVideos = videos.filter((v: { title: string; description: string; tags: string; }) =>
                v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.tags.toLowerCase().includes(searchQuery.toLowerCase())
            );

            matchedVideos.forEach((video: { id: any; title: any; status: any; editedBy: any; }) => {
                searchResults.push({
                    type: 'video',
                    id: video.id,
                    title: video.title,
                    subtitle: `Status: ${video.status} • ${video.editedBy ? `Edited by: ${video.editedBy}` : 'No editor'}`,
                    icon: <Video className="w-5 h-5 text-blue-600" />,
                    url: userType === 'creator' ? '/creator/videos' : '/editor/tasks'
                });
            });

            // Search team members (creator only)
            if (userType === 'creator') {
                const teamResponse = await fetch(`http://localhost:5000/api/team/${userEmail}`);
                const teamData = await teamResponse.json();
                const matchedTeam = (teamData.team || []).filter((member: any) =>
                    member.editor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    member.role.toLowerCase().includes(searchQuery.toLowerCase())
                );

                matchedTeam.forEach((member: any) => {
                    searchResults.push({
                        type: 'team',
                        id: member.id.toString(),
                        title: member.editor_email,
                        subtitle: `Role: ${member.role.replace('_', ' ')} • Status: ${member.status}`,
                        icon: <Users className="w-5 h-5 text-purple-600" />,
                        url: '/creator/team'
                    });
                });
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, [userEmail, userType]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [query, performSearch]);

    const handleResultClick = (url: string) => {
        navigate(url);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2 min-w-[200px] justify-start text-gray-600">
                    <Search className="w-4 h-4" />
                    <span className="text-sm">Search...</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-2xl p-0">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="sr-only">Search</DialogTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search videos, team members..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 pr-10 h-12 rounded-xl border-2 text-base"
                            autoFocus
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
                                onClick={() => setQuery('')}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                <div className="max-h-[400px] overflow-auto p-4 pt-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
                        </div>
                    ) : results.length === 0 && query ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No results found</p>
                            <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">Start typing to search</p>
                            <p className="text-sm text-gray-500 mt-1">Search across videos and team members</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleResultClick(result.url)}
                                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors text-left"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {result.icon}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{result.title}</p>
                                        <p className="text-sm text-gray-600 truncate">{result.subtitle}</p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                                            {result.type}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};