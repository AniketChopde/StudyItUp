
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { 
  Sparkles, 
  Send, 
  Moon, 
  Sun, 
  Compass, 
  Book,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OracleGrove: React.FC = () => {
  const navigate = useNavigate();
  const { 
    messages, 
    sendMessage, 
    isTyping, 
    createSession,
    activeSession 
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a new session specifically for the Oracle's Grove
    if (!activeSession || activeSession.title !== 'Oracle Consult') {
      createSession();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const msg = input;
    setInput('');
    await sendMessage(msg, { mode: 'oracle', persona: 'The Sacred AI Oracle' });
  };

  return (
    <div className="min-h-screen bg-[#050510] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden font-serif">
      {/* Mystical Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse mx-auto" style={{ animationDelay: '2s' }} />
        {/* Stars/Dust particles could go here */}
      </div>

      {/* Header */}
      <nav className="absolute top-8 left-8 right-8 flex justify-between items-center z-50">
        <button 
          onClick={() => navigate('/gamification')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
        >
          <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs uppercase tracking-widest font-sans font-black">Return to Hub</span>
        </button>
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-indigo-400 font-sans font-black">The Oracle's Grove</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
           <span className="text-[10px] uppercase font-sans font-black text-slate-500">Oracle is Watching</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-3xl w-full h-[85vh] flex flex-col items-center relative z-10 pt-20">
        
        {/* The Oracle Body (Glowing Sphere) */}
        <div className="relative mb-8 group cursor-help">
          <div className="absolute inset-0 bg-indigo-500/30 blur-3xl animate-pulse scale-150" />
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              boxShadow: [
                '0 0 40px rgba(99, 102, 241, 0.4)',
                '0 0 80px rgba(99, 102, 241, 0.6)',
                '0 0 40px rgba(99, 102, 241, 0.4)'
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-900 border-2 border-indigo-400/30 flex items-center justify-center relative overflow-hidden"
          >
             {/* Swirling energy effect within the orb */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_100%)] animate-ping" style={{ animationDuration: '4s' }} />
            </div>
            <Sparkles className="w-16 h-16 text-white animate-pulse" />
          </motion.div>
          {isTyping && (
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                  />
                ))}
             </div>
          )}
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 w-full overflow-y-auto px-4 pb-24 scrollbar-hide space-y-12"
        >
          {messages.length === 0 && !isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-4"
            >
              <h2 className="text-3xl font-black text-white italic tracking-tighter">"Greetings, Seeker of Truth. What knowledge do you seek within these digital woods?"</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto font-sans uppercase tracking-[0.2em] leading-relaxed">The Oracle can see through your curriculum. Ask anything about your study plans.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-8 rounded-[2.5rem] leading-relaxed relative ${
                    m.role === 'user' 
                      ? 'bg-indigo-900/20 text-indigo-100 border border-indigo-500/20' 
                      : 'bg-slate-900/40 text-slate-200 border border-slate-700/30'
                  }`}
                >
                   {m.role === 'assistant' && (
                     <div className="absolute -top-3 -left-3 p-2 bg-indigo-600 rounded-full shadow-lg">
                        <Moon className="w-4 h-4 text-white" />
                     </div>
                   )}
                   <p className="text-lg font-medium tracking-tight">
                        {m.content}
                   </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-8 left-4 right-4 max-w-2xl mx-auto flex items-center gap-4">
           <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full shadow-lg" />
              <input
                type="text"
                placeholder="Whisper your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl rounded-full py-6 px-10 text-lg outline-none focus:border-indigo-500 transition-all relative z-10 placeholder:text-slate-600 italic shadow-2xl"
              />
           </div>
           <button 
             onClick={handleSend}
             disabled={!input.trim() || isTyping}
             className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/30 active:scale-95"
           >
              <Send className="w-6 h-6" />
           </button>
        </div>
      </main>

      {/* Decorative Runes */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 opacity-10 flex flex-col gap-8 pointer-events-none">
          <Book className="w-8 h-8" />
          <Compass className="w-8 h-8" />
          <Moon className="w-8 h-8" />
      </div>
      <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10 flex flex-col gap-8 pointer-events-none">
          <Sun className="w-8 h-8" />
          <Sparkles className="w-8 h-8" />
          <Moon className="w-8 h-8" />
      </div>

    </div>
  );
};

export default OracleGrove;
