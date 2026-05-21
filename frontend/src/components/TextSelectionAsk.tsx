/**
 * TextSelectionAsk — ChatGPT-style text selection popup.
 *
 * When the user selects any text inside the wrapped container, a floating
 * tooltip appears with quick actions:
 *   • "Ask AI"     — opens an inline mini chat panel prefilled with the selected text
 *   • "Explain"    — instantly asks "Explain: <selected text>"
 *   • "Summarize"  — instantly asks "Summarize: <selected text>"
 *
 * Usage:
 *   <TextSelectionAsk context={{ topic: 'Machine Learning', chapter: 'Supervised Learning' }}>
 *     {/* your lesson content here *\/}
 *   </TextSelectionAsk>
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquareQuote, Sparkles, FileText, Send, X, Bot, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { chatService } from '../api/services';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface TextSelectionAskProps {
    children: React.ReactNode;
    context?: Record<string, any>; // e.g. { topic, chapter, exam_type }
    className?: string;
}

interface TooltipPos {
    x: number;
    y: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSelectedText(): string {
    return window.getSelection()?.toString().trim() ?? '';
}

function getSelectionRect(): DOMRect | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    return sel.getRangeAt(0).getBoundingClientRect();
}

// ─── Component ───────────────────────────────────────────────────────────────

export const TextSelectionAsk: React.FC<TextSelectionAskProps> = ({
    children,
    context = {},
    className,
}) => {
    const [selectedText, setSelectedText] = useState('');
    const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
    const [showPanel, setShowPanel] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() =>
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        })
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Scroll to latest message ──────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Focus input when panel opens ──────────────────────────────────────
    useEffect(() => {
        if (showPanel) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [showPanel]);

    // ── Text selection detection ──────────────────────────────────────────
    const handleSelectionChange = useCallback(() => {
        // Small delay so the browser finishes updating the selection
        setTimeout(() => {
            const text = getSelectedText();
            const rect = getSelectionRect();

            if (!text || text.length < 3 || !rect) {
                // Only hide tooltip if panel is also closed
                if (!showPanel) {
                    setTooltipPos(null);
                    setSelectedText('');
                }
                return;
            }

            // Check the selection is inside our container
            const container = containerRef.current;
            if (!container) return;
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;
            const range = sel.getRangeAt(0);
            if (!container.contains(range.commonAncestorContainer)) {
                if (!showPanel) {
                    setTooltipPos(null);
                    setSelectedText('');
                }
                return;
            }

            setSelectedText(text);

            // Position tooltip just above the selection midpoint
            const containerRect = container.getBoundingClientRect();
            const x = rect.left + rect.width / 2 - containerRect.left;
            const y = rect.top - containerRect.top - 8; // 8px gap above selection
            setTooltipPos({ x, y });
        }, 50);
    }, [showPanel]);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [handleSelectionChange]);

    // ── Close tooltip on outside click ────────────────────────────────────
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                panelRef.current?.contains(target) ||
                containerRef.current?.contains(target)
            ) return;
            setTooltipPos(null);
            setSelectedText('');
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // ── Send a message to the AI ──────────────────────────────────────────
    const sendToAI = useCallback(async (userMessage: string) => {
        if (!userMessage.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatService.sendMessage({
                session_id: sessionId,
                message: userMessage,
                context: {
                    ...context,
                    selected_text: selectedText,
                    instruction: 'The user selected text from their study material and wants to ask about it. Be concise and educational.',
                },
            });

            const aiMsg: Message = {
                role: 'assistant',
                content: response.data.message,
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '⚠️ Sorry, I couldn\'t get a response. Please try again.' },
            ]);
        } finally {
            setLoading(false);
        }
    }, [loading, sessionId, context, selectedText]);

    // ── Quick action handlers ─────────────────────────────────────────────
    const openPanelWith = useCallback((prefillMsg: string) => {
        setShowPanel(true);
        setTooltipPos(null);
        // If a quick action, auto-send it
        if (prefillMsg !== '__open__') {
            sendToAI(prefillMsg);
        }
    }, [sendToAI]);

    const handleAskClick = () => {
        openPanelWith('__open__');
        setInput(`"${selectedText.substring(0, 80)}${selectedText.length > 80 ? '…' : ''}" — `);
    };

    const handleExplainClick = () => {
        openPanelWith(`Explain this in simple terms: "${selectedText}"`);
    };

    const handleSummarizeClick = () => {
        openPanelWith(`Give me a concise summary of: "${selectedText}"`);
    };

    const handleSend = () => {
        if (input.trim()) sendToAI(input.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const closePanel = () => {
        setShowPanel(false);
        setMessages([]);
        setInput('');
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {children}

            {/* ── Floating Selection Tooltip ──────────────────────────── */}
            {tooltipPos && !showPanel && selectedText && (
                <div
                    className={cn(
                        'absolute z-50 flex items-center gap-0.5 p-1',
                        'bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl',
                        'border border-white/10',
                        'animate-in fade-in zoom-in-95 duration-150',
                    )}
                    style={{
                        left: `${tooltipPos.x}px`,
                        top: `${tooltipPos.y}px`,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Ask AI */}
                    <button
                        onClick={handleAskClick}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
                            'text-white hover:bg-white/10 transition-colors',
                        )}
                        title="Ask AI about selected text"
                    >
                        <MessageSquareQuote className="w-3.5 h-3.5 text-violet-400" />
                        Ask AI
                    </button>

                    {/* Small arrow pointing down */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full"
                        style={{
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid rgb(17 24 39)',
                        }}
                    />
                </div>
            )}

            {/* ── Mini Chat Panel (slides in from the right) ─────────── */}
            {showPanel && (
                <div
                    ref={panelRef}
                    className={cn(
                        'fixed right-0 top-0 h-full z-50 flex flex-col',
                        'w-[min(420px,100vw)]',
                        'bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800',
                        'animate-in slide-in-from-right duration-300',
                    )}
                    role="dialog"
                    aria-label="Ask AI about selected text"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Ask AI</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                                    About selected text
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closePanel}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Selected text context badge */}
                    {selectedText && (
                        <div className="mx-4 mt-3 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800/40 shrink-0">
                            <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mb-1">
                                Selected Text
                            </p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic">
                                "{selectedText}"
                            </p>
                        </div>
                    )}

                    {/* Quick suggestion chips */}
                    {messages.length === 0 && (
                        <div className="px-4 pt-3 flex flex-wrap gap-1.5 shrink-0">
                            {[
                                { label: '⚡ Explain simply', msg: `Explain this simply: "${selectedText?.substring(0, 120)}"` },
                                { label: '📝 Summarize', msg: `Summarize: "${selectedText?.substring(0, 120)}"` },
                                { label: '❓ Why important?', msg: `Why is this important: "${selectedText?.substring(0, 120)}"?` },
                                { label: '🔗 Real-world example', msg: `Give a real-world example of: "${selectedText?.substring(0, 120)}"` },
                            ].map(({ label, msg }) => (
                                <button
                                    key={label}
                                    onClick={() => sendToAI(msg)}
                                    disabled={loading}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-40"
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
                        {messages.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-gray-400 dark:text-gray-600">
                                <Sparkles className="w-8 h-8 opacity-40" />
                                <p className="text-sm font-medium">Ask anything about the selected text</p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex gap-2',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start',
                                    'animate-in fade-in slide-in-from-bottom-2 duration-200',
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-1">
                                        <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                                        msg.role === 'user'
                                            ? 'bg-gray-900 text-white dark:bg-gray-700 rounded-tr-sm'
                                            : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm',
                                    )}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex gap-2 items-start animate-in fade-in duration-200">
                                <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 mt-1">
                                    <Loader2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-spin" />
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 focus-within:border-violet-400 dark:focus-within:border-violet-600 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a follow-up question…"
                                rows={1}
                                disabled={loading}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none min-h-[24px] max-h-[100px] py-1 font-medium"
                                style={{ fieldSizing: 'content' } as React.CSSProperties}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className={cn(
                                    'flex items-center justify-center w-8 h-8 rounded-xl transition-all',
                                    input.trim() && !loading
                                        ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed',
                                )}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-1.5 font-medium">
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
