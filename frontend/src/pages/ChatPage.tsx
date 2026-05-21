import React from 'react';
import { useChatStore } from '../stores/chatStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Send, Bot, User, ArrowLeft, RotateCcw, Sparkles, Layers } from 'lucide-react';
import { VoiceInputButton, ReadAloudButton } from '../components/voice/VoiceButton';
import { formatDate } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export const ChatPage: React.FC = () => {
    const { messages, isTyping, sendMessage, createSession, activeSession, setChatContext } = useChatStore();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [input, setInput] = React.useState('');
    const planId = searchParams.get('planId');
    const chapter = searchParams.get('chapter');
    const chatContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const initChat = async () => {
            if (!activeSession) {
                await createSession();
            }
            
            const query = searchParams.get('query');
            if (query && messages.length === 0) {
                setInput(query);
                // We'll let the user click send or handle it if we want full auto
                // For better UX, let's auto-send if it's a specific trigger
                if (query.includes('7-day breakdown')) {
                   await sendMessage(query);
                }
            }
        };
        initChat();
    }, [activeSession, createSession]);

    React.useEffect(() => {
        const moduleId = searchParams.get('moduleId');
        const examType = searchParams.get('examType');
        const chapterParam = searchParams.get('chapter');
        const topic = searchParams.get('topic');

        const ctx: Record<string, any> = {};
        if (moduleId) ctx.module_id = moduleId;
        if (examType) ctx.exam_type = examType;
        if (chapterParam) ctx.chapter = chapterParam;
        if (topic) ctx.topic = topic;

        if (Object.keys(ctx).length > 0) {
            setChatContext(ctx);
        }
    }, [searchParams, setChatContext]);

    React.useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const message = input;
        setInput('');
        await sendMessage(message);
    };

    const handleRetry = async () => {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
            await sendMessage(lastUserMessage.content);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col w-full max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-0">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    {planId && (
                        <button 
                            onClick={() => navigate(`/study-plans/${planId}`)}
                            className="p-2 hover:bg-accent rounded-xl transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Learning Copilot</h1>
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">
                            {chapter ? `Focus: ${chapter}` : 'AI Study Assistant'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {planId && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl font-bold h-9 text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/5 hidden sm:flex"
                            onClick={() => navigate(`/study-plans/${planId}`)}
                        >
                            View Plan
                        </Button>
                    )}
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-card/50 backdrop-blur-md relative min-h-0">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent min-h-0">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-bounce duration-1000">
                                <Bot className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black">How can I help you study today?</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                                    I can explain complex topics, create detailed study plans, or help you solve tricky problems.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                <button 
                                    onClick={() => setInput(`Give me a detailed 7-day study plan for ${chapter || 'this topic'}`)}
                                    className="p-4 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 text-left transition-all hover:bg-muted group"
                                >
                                    <Layers className="h-4 w-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs font-black uppercase tracking-widest">Deep Daily Plan</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Generate a comprehensive hour-by-hour roadmap.</p>
                                </button>
                                <button 
                                    onClick={() => setInput(`Explain ${chapter || 'the core concepts'} like I'm 5 years old.`)}
                                    className="p-4 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 text-left transition-all hover:bg-muted group"
                                >
                                    <Sparkles className="h-4 w-4 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs font-black uppercase tracking-widest">ELI5 Explanation</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Simplify complex ideas into easy metaphors.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            {message.role === 'assistant' && (
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                            )}

                            <div className="space-y-2 max-w-[85%] sm:max-w-[70%]">
                                <div
                                    className={`rounded-3xl p-6 shadow-md border ${message.role === 'user'
                                        ? 'bg-gradient-to-br from-slate-800 to-black text-white border-transparent rounded-tr-none'
                                        : 'bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/10 rounded-tl-none'
                                        }`}
                                >
                                    <div className={`prose ${message.role === 'user' ? 'prose-invert' : 'prose-zinc dark:prose-invert'} max-w-none text-sm leading-relaxed`}>
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-2">
                                        <div className="flex items-center gap-3">
                                            {message.role === 'assistant' && (
                                                <>
                                                    <ReadAloudButton text={message.content} className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary" />
                                                    <button 
                                                        onClick={handleRetry}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                                        title="Retry response"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">
                                            {formatDate(message.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {message.role === 'user' && (
                                <div className="h-10 w-10 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 border border-border shadow-sm">
                                    <User className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-4 animate-in fade-in duration-300">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="bg-card border border-border rounded-3xl rounded-tl-none p-6 shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                    <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Message list end boundary */}
                </div>

                {/* Input Area */}
                <div className="shrink-0 p-6 md:p-8 bg-gradient-to-t from-card via-card/80 to-transparent pt-12">
                    <div className="relative group max-w-5xl mx-auto flex items-end bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 rounded-[2.5rem] p-2 transition-all shadow-lg">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask a question or request a deeper plan..."
                            className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-6 outline-none font-bold text-sm min-h-[60px] max-h-[200px] resize-none transition-all placeholder:font-bold placeholder:opacity-30"
                            rows={1}
                        />
                        <div className="flex items-center gap-3 p-2">
                            <VoiceInputButton
                                onTranscript={(t) => setInput(prev => prev ? prev + ' ' + t : t)}
                                className="h-12 w-12 rounded-2xl bg-background hover:bg-muted border border-border/50 shadow-sm transition-all"
                            />
                            <Button 
                                onClick={handleSend} 
                                disabled={!input.trim() || isTyping}
                                size="icon"
                                className="h-12 w-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

        </div>
    );
};
