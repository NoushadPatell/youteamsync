import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Reply, Check, X, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Comment = {
    id: number;
    video_id: string;
    user_email: string;
    user_type: 'creator' | 'editor';
    comment_text: string;
    parent_comment_id: number | null;
    timestamp_seconds: number | null;
    resolved: boolean;
    created_at: string;
    reply_count: number;
};

export const VideoComments = ({
    videoId,
    currentUserEmail,
    currentUserType
}: {
    videoId: string;
    currentUserEmail: string;
    currentUserType: 'creator' | 'editor';
}) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [timestampInput, setTimestampInput] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/comments/${videoId}`);
            const data = await response.json();
            setComments(data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const parseTimestamp = (timestamp: string): number | null => {
        const match = timestamp.match(/^(\d+):(\d+)$/);
        if (match) {
            return parseInt(match[1]) * 60 + parseInt(match[2]);
        }
        return null;
    };

    const formatTimestamp = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const addComment = useCallback(async () => {
        if (!newComment.trim()) return;

        try {
            const timestampSeconds = timestampInput ? parseTimestamp(timestampInput) : null;

            const response = await fetch(`http://localhost:5000/api/comments/${videoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: currentUserEmail,
                    userType: currentUserType,
                    commentText: newComment,
                    timestampSeconds
                })
            });

            if (!response.ok) throw new Error('Failed to add comment');

            setNewComment('');
            setTimestampInput('');
            fetchComments();
            toast.success('Comment added');
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Failed to add comment');
        }
    }, [videoId, currentUserEmail, currentUserType, newComment, timestampInput, fetchComments]);

    const addReply = useCallback(async (parentId: number) => {
        if (!replyText.trim()) return;

        try {
            const response = await fetch(`http://localhost:5000/api/comments/${videoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: currentUserEmail,
                    userType: currentUserType,
                    commentText: replyText,
                    parentCommentId: parentId
                })
            });

            if (!response.ok) throw new Error('Failed to add reply');

            setReplyText('');
            setReplyingTo(null);
            fetchComments();
            toast.success('Reply added');
        } catch (error) {
            console.error('Error adding reply:', error);
            toast.error('Failed to add reply');
        }
    }, [videoId, currentUserEmail, currentUserType, replyText, fetchComments]);

    const toggleResolved = useCallback(async (commentId: number, resolved: boolean) => {
        try {
            const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolved: !resolved })
            });

            if (!response.ok) throw new Error('Failed to update comment');

            fetchComments();
            toast.success(resolved ? 'Marked as unresolved' : 'Marked as resolved');
        } catch (error) {
            console.error('Error updating comment:', error);
            toast.error('Failed to update comment');
        }
    }, [fetchComments]);

    const deleteComment = useCallback(async (commentId: number) => {
        if (!confirm('Delete this comment?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/comments/${commentId}?userEmail=${currentUserEmail}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete comment');

            fetchComments();
            toast.success('Comment deleted');
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error('Failed to delete comment');
        }
    }, [currentUserEmail, fetchComments]);

    const topLevelComments = comments.filter(c => !c.parent_comment_id);
    const getReplies = (parentId: number) => comments.filter(c => c.parent_comment_id === parentId);

    if (loading) {
        return <div className="p-4 text-center">Loading comments...</div>;
    }

    return (
        <div className="mt-6 border-t-2 border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-bold text-gray-900">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Add Comment Form */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2 rounded-xl"
                    rows={3}
                />
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Timestamp (optional, e.g., 2:35)"
                        value={timestampInput}
                        onChange={(e) => setTimestampInput(e.target.value)}
                        className="max-w-[200px] rounded-xl"
                    />
                    <Button
                        onClick={addComment}
                        disabled={!newComment.trim()}
                        className="ml-auto bg-gradient-to-r from-brand to-brand-light hover:from-purple-700 hover:to-blue-700 rounded-xl"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Comment
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {topLevelComments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    topLevelComments.map((comment) => (
                        <div key={comment.id}>
                            <CommentItem
                                comment={comment}
                                currentUserEmail={currentUserEmail}
                                onReply={() => setReplyingTo(comment.id)}
                                onResolve={() => toggleResolved(comment.id, comment.resolved)}
                                onDelete={() => deleteComment(comment.id)}
                                formatTimestamp={formatTimestamp}
                            />

                            {/* Replies */}
                            {getReplies(comment.id).length > 0 && (
                                <div className="ml-12 mt-3 space-y-3">
                                    {getReplies(comment.id).map((reply) => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            currentUserEmail={currentUserEmail}
                                            onDelete={() => deleteComment(reply.id)}
                                            formatTimestamp={formatTimestamp}
                                            isReply
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                                <div className="ml-12 mt-3 bg-gray-50 rounded-xl p-3">
                                    <Textarea
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="mb-2 rounded-xl"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => addReply(comment.id)}
                                            disabled={!replyText.trim()}
                                            size="sm"
                                            className="rounded-lg"
                                        >
                                            Reply
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setReplyText('');
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Individual Comment Component
const CommentItem = ({
    comment,
    currentUserEmail,
    onReply,
    onResolve,
    onDelete,
    formatTimestamp,
    isReply = false
}: {
    comment: Comment;
    currentUserEmail: string;
    onReply?: () => void;
    onResolve?: () => void;
    onDelete: () => void;
    formatTimestamp: (seconds: number) => string;
    isReply?: boolean;
}) => {
    const isOwner = comment.user_email === currentUserEmail;
    const userDisplay = comment.user_email.split('@')[0];

    return (
        <div className={`bg-white rounded-xl p-4 border-2 ${comment.resolved ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${comment.user_type === 'creator' ? 'bg-brand' : 'bg-success'
                        }`}>
                        {userDisplay.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{userDisplay}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                        </p>
                    </div>
                    {comment.timestamp_seconds !== null && (
                        <div className="flex items-center gap-1 bg-purple-100 ext-brand-dark px-2 py-1 rounded-full text-xs font-semibold">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(comment.timestamp_seconds)}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {comment.resolved && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            <Check className="w-3 h-3" />
                            Resolved
                        </span>
                    )}
                    {isOwner && (
                        <Button
                            onClick={onDelete}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-full hover:bg-red-100"
                        >
                            <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-gray-700 text-sm mb-3">{comment.comment_text}</p>

            {!isReply && (
                <div className="flex items-center gap-2">
                    {onReply && (
                        <Button
                            onClick={onReply}
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg text-xs"
                        >
                            <Reply className="w-3 h-3 mr-1" />
                            Reply {comment.reply_count > 0 && `(${comment.reply_count})`}
                        </Button>
                    )}
                    {onResolve && (
                        <Button
                            onClick={onResolve}
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg text-xs"
                        >
                            {comment.resolved ? (
                                <><X className="w-3 h-3 mr-1" /> Unresolve</>
                            ) : (
                                <><Check className="w-3 h-3 mr-1" /> Resolve</>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};