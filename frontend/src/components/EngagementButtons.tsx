
import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitEngagement, getEngagement } from '../api/engagement';
import type { ContentType, EngagementAction } from '../api/engagement';
import { cn } from '../utils/cn';

interface EngagementButtonsProps {
    contentType: ContentType;
    contentId: string;
    initialAction?: EngagementAction | null;
    className?: string;
}

const QUICK_REASONS = [
    'Inaccurate content',
    'Too difficult',
    'Too simple',
    'Confusing explanation',
    'Missing topics',
    'Other',
];

export const EngagementButtons: React.FC<EngagementButtonsProps> = ({
    contentType,
    contentId,
    initialAction = null,
    className,
}) => {
    const [action, setAction] = useState<EngagementAction | null>(initialAction);
    const [loading, setLoading] = useState(false);

    // Dislike feedback state
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [existingDislikeComment, setExistingDislikeComment] = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const feedbackBoxRef = useRef<HTMLDivElement>(null);

    // Fetch existing engagement status on mount
    useEffect(() => {
        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const [likeData, dislikeData] = await Promise.all([
                    getEngagement(contentType, contentId, 'like'),
                    getEngagement(contentType, contentId, 'dislike'),
                ]);

                if (!isMounted) return;

                if (likeData) {
                    setAction('like');
                } else if (dislikeData) {
                    setAction('dislike');
                    if (dislikeData.comment) {
                        setExistingDislikeComment(dislikeData.comment);
                        setFeedbackComment(dislikeData.comment);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch engagement status:', error);
            }
        };

        fetchStatus();
        return () => { isMounted = false; };
    }, [contentType, contentId]);

    // Focus textarea when feedback box opens
    useEffect(() => {
        if (showFeedback && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 150);
        }
    }, [showFeedback]);

    // Close feedback box on outside click
    useEffect(() => {
        if (!showFeedback) return;
        const handleOutside = (e: MouseEvent) => {
            if (feedbackBoxRef.current && !feedbackBoxRef.current.contains(e.target as Node)) {
                // Only close if user hasn't started typing
                if (!feedbackComment.trim() && !selectedReason) {
                    setShowFeedback(false);
                }
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showFeedback, feedbackComment, selectedReason]);

    const handleLike = async () => {
        if (loading) return;
        if (action === 'like') return;

        // Close dislike feedback if open
        setShowFeedback(false);
        setSelectedReason(null);
        setFeedbackComment('');

        const prevAction = action;
        setAction('like');

        try {
            setLoading(true);
            await submitEngagement({
                content_type: contentType,
                content_id: contentId,
                action: 'like',
                value: 1,
            });
            toast.success('Thanks for the like! 👍', { duration: 2000 });
        } catch (error) {
            console.error('Failed to submit like:', error);
            toast.error('Failed to submit. Please try again.');
            setAction(prevAction);
        } finally {
            setLoading(false);
        }
    };

    const handleDislike = async () => {
        if (loading) return;

        if (action === 'dislike') {
            // Already disliked — toggle the feedback box
            setShowFeedback(prev => !prev);
            return;
        }

        // Just open the feedback box for a required comment.
        // We do NOT set action to 'dislike' yet or submit to the backend.
        setShowFeedback(true);
    };

    const handleReasonSelect = (reason: string) => {
        setSelectedReason(prev => (prev === reason ? null : reason));
        // Pre-fill textarea with reason if empty
        if (!feedbackComment.trim()) {
            setFeedbackComment(reason !== 'Other' ? reason : '');
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    };

    const handleFeedbackSubmit = async () => {
        const finalComment = feedbackComment.trim() || selectedReason || '';

        try {
            setSubmittingFeedback(true);
            await submitEngagement({
                content_type: contentType,
                content_id: contentId,
                action: 'dislike',
                value: -1,
                comment: finalComment,
            });
            setExistingDislikeComment(finalComment);
            setAction('dislike');
            toast.success('Feedback submitted! We\'ll use it to improve. 🙏', { duration: 3000 });
            setShowFeedback(false);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleDismissFeedback = () => {
        setShowFeedback(false);
        setSelectedReason(null);
        // Restore old comment if no new input
        if (!feedbackComment.trim()) {
            setFeedbackComment(existingDislikeComment || '');
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Like / Dislike buttons */}
            <div className="flex items-center gap-2">
                {/* Like button */}
                <button
                    id={`like-btn-${contentId}`}
                    onClick={handleLike}
                    disabled={loading}
                    title="Like"
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        'border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                        action === 'like'
                            ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200 dark:shadow-green-900/40 scale-105'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:border-green-600',
                        loading && 'opacity-60 cursor-not-allowed'
                    )}
                    aria-pressed={action === 'like'}
                >
                    <ThumbsUp className={cn('w-4 h-4', action === 'like' && 'fill-current')} />
                    <span>Like</span>
                </button>

                {/* Dislike button */}
                <button
                    id={`dislike-btn-${contentId}`}
                    onClick={handleDislike}
                    disabled={loading}
                    title={action === 'dislike' ? 'Edit your feedback' : 'Dislike'}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                        'border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                        action === 'dislike'
                            ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/40 scale-105'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-600',
                        loading && 'opacity-60 cursor-not-allowed'
                    )}
                    aria-pressed={action === 'dislike'}
                    aria-expanded={showFeedback}
                >
                    <ThumbsDown className={cn('w-4 h-4', action === 'dislike' && 'fill-current')} />
                    <span>{action === 'dislike' ? 'Disliked' : 'Dislike'}</span>
                </button>
            </div>

            {/* Dislike Feedback Box — inline animated dropdown */}
            <div
                ref={feedbackBoxRef}
                className={cn(
                    'absolute right-0 z-[100] mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm',
                    'transition-all duration-300 ease-out origin-top-right',
                    showFeedback
                        ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 scale-y-90 -translate-y-2 pointer-events-none'
                )}
                role="dialog"
                aria-label="Dislike feedback"
                aria-hidden={!showFeedback}
            >
                <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-white dark:bg-gray-900 shadow-xl shadow-red-100/50 dark:shadow-red-900/20 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    What went wrong?
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Your feedback helps us improve
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleDismissFeedback}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="px-4 pb-4 space-y-3">
                        {/* Quick reason chips */}
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_REASONS.map((reason) => (
                                <button
                                    key={reason}
                                    onClick={() => handleReasonSelect(reason)}
                                    className={cn(
                                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150',
                                        selectedReason === reason
                                            ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300 hover:text-red-600 dark:hover:border-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    )}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        {/* Comment textarea */}
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                id={`dislike-comment-${contentId}`}
                                rows={3}
                                maxLength={500}
                                placeholder="Tell us more (required)..."
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                disabled={submittingFeedback}
                                className={cn(
                                    'w-full text-sm rounded-xl border px-3 py-2.5 resize-none',
                                    'bg-gray-50 dark:bg-gray-800',
                                    'border-gray-200 dark:border-gray-700',
                                    'text-gray-800 dark:text-gray-200',
                                    'placeholder:text-gray-400 dark:placeholder:text-gray-600',
                                    'focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300 dark:focus:border-red-700',
                                    'transition-colors duration-150',
                                    submittingFeedback && 'opacity-60 cursor-not-allowed'
                                )}
                            />
                            <span className="absolute bottom-2 right-3 text-xs text-gray-300 dark:text-gray-600 select-none">
                                {feedbackComment.length}/500
                            </span>
                        </div>

                        {/* Submit row */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400 dark:text-gray-600">
                                Anonymous &amp; secure
                            </p>
                            <div className="flex gap-2">
                                <button
                                    id={`dislike-submit-${contentId}`}
                                    onClick={handleFeedbackSubmit}
                                    disabled={submittingFeedback || !feedbackComment.trim()}
                                    className={cn(
                                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg',
                                        'bg-red-500 text-white transition-all duration-150',
                                        'hover:bg-red-600 active:scale-95 shadow-sm',
                                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                                    )}
                                >
                                    {submittingFeedback ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            Sending…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3 h-3" />
                                            Send Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Show existing comment if any */}
                        {existingDislikeComment && !showFeedback && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate">
                                Your feedback: "{existingDislikeComment}"
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
