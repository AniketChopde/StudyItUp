
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  Flame, 
  Skull, 
  Trophy,
  Sparkles,
  Target
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import toast from 'react-hot-toast';

const WisdomTrials: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeQuiz,
    currentQuestion,
    results,
    isLoading,
    generateQuiz,
    submitAnswer,
    submitQuiz,
    nextQuestion,
    resetQuiz
  } = useQuizStore();

  const [timeLeft, setTimeLeft] = useState(15);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Parse URL params
  const queryParams = new URLSearchParams(location.search);
  const topic = queryParams.get('topic') || 'General Knowledge';
  const subject = queryParams.get('subject') || 'General';
  const planId = queryParams.get('planId');

  useEffect(() => {
    // Start the trial immediately with params from URL
    if (!activeQuiz && !isLoading) {
      generateQuiz(topic, subject, 10, 'hard', null, planId);
    }
  }, [topic, subject, planId, activeQuiz, isLoading, generateQuiz]);

  useEffect(() => {
    if (timeLeft > 0 && activeQuiz && !results && !isGameOver) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !results && !isGameOver) {
      handleTimeout();
    }
  }, [timeLeft, activeQuiz, results, isGameOver]);

  const handleTimeout = () => {
    toast.error("Time's Up! Trial Failed.");
    setIsGameOver(true);
  };

  const handleAnswer = async (questionId: string, answer: string) => {
    const currentQ = activeQuiz?.questions[currentQuestion];
    if (!currentQ) return;

    const isCorrect = answer === currentQ.correct_answer;
    submitAnswer(questionId, answer);

    if (isCorrect) {
      setCombo(prev => prev + 1);
      setTimeLeft(prev => Math.min(prev + 5, 20)); // Add 5s back on correct
      toast.success(`COMBO x${combo + 1}! Time extended!`);
    } else {
      setCombo(0);
      setTimeLeft(prev => Math.max(0, prev - 3)); // Penalty
      toast.error("Incorrect! Time lost!");
    }

    if (currentQuestion < (activeQuiz?.questions.length || 0) - 1) {
      nextQuestion();
    } else {
      submitQuiz();
    }
  };

  if (isLoading) return <Loading text="Initializing Wisdom Trials..." />;

  if (results || isGameOver) {
    const victory = results && results.score >= 80;
    return (
      <div className="-m-4 lg:-m-8 min-h-[calc(100vh-4rem)] bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-4 font-sans text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`p-6 rounded-2xl ${victory ? 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]'}`}
        >
          {victory ? <Trophy className="w-16 h-16 text-white" /> : <Skull className="w-16 h-16 text-white" />}
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
            {victory ? 'Trial Conquered' : 'Trial Failed'}
          </h1>
          <p className="text-lg text-slate-400 font-bold uppercase tracking-widest">
            {victory ? `Final Combo: ${combo} | Score: ${Math.round(results.score)}%` : 'The wisdom meter was too fast...'}
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={() => { resetQuiz(); navigate('/gamification'); }}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-slate-800"
          >
            Return to Hub
          </Button>
          <Button 
            onClick={() => { resetQuiz(); setTimeLeft(15); setCombo(0); setIsGameOver(false); generateQuiz(topic, subject, 10, 'hard', null, planId); }}
            className="h-12 px-8 rounded-xl font-black uppercase tracking-widest bg-amber-500"
          >
            Retry Trial
          </Button>
        </div>
      </div>
    );
  }

  const currentQ = activeQuiz?.questions[currentQuestion];

  return (
    <div className="-m-4 lg:-m-8 min-h-[calc(100vh-4rem)] bg-slate-950 text-white p-4 flex flex-col items-center overflow-hidden font-sans">
      
      {/* Trial Header */}
      <nav className="w-full max-w-5xl flex justify-between items-center mb-8 relative z-10">
        <div className="flex-1" />
        <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-black tracking-[0.4em] text-amber-500 mb-1">High Energy Mode</span>
            <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <h1 className="text-xl font-black italic tracking-tighter">Wisdom Trials</h1>
            </div>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="px-4 py-1 bg-slate-900 border border-slate-800 rounded-full flex items-center gap-2">
                <Flame className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-black">COMBO {combo}</span>
            </div>
        </div>
      </nav>

      {/* The Wisdom Meter (Timer) */}
      <div className="w-full max-w-2xl mb-8 space-y-2">
         <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                <span className="text-lg font-black">{timeLeft}s</span>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Question {currentQuestion + 1} of 10</span>
         </div>
         <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <motion.div 
               animate={{ 
                  width: `${(timeLeft / 20) * 100}%`,
                  backgroundColor: timeLeft < 5 ? '#f43f5e' : '#f59e0b' 
               }}
               className="h-full rounded-full transition-colors"
            />
         </div>
      </div>

      {/* Active Area */}
      <main className="flex-1 w-full max-w-2xl flex flex-col justify-center space-y-6">
        <div className="text-center relative">
            <AnimatePresence mode="wait">
                <motion.h2 
                    key={currentQuestion}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-2xl font-black leading-tight tracking-tight px-4"
                >
                    {currentQ?.question_text || currentQ?.question || "Summoning Knowledge..."}
                </motion.h2>
            </AnimatePresence>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-10">
                <Sparkles className="w-16 h-16 text-amber-500" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-fr">
            {currentQ?.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswer(currentQ.question_id, option.charAt(1) === ')' ? option.charAt(0) : String.fromCharCode(65 + index))}
                  className="h-16 rounded-xl bg-slate-900 border-2 border-slate-800 hover:border-amber-500 hover:bg-slate-800 transition-all font-black text-sm text-left px-6 relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-5 transition-opacity" />
                    <div className="flex items-center gap-3">
                        <span className="text-amber-500 opacity-50 font-sans text-xs">{String.fromCharCode(65 + index)}</span>
                        <span>{option.charAt(1) === ')' ? option.substring(3) : option}</span>
                    </div>
                </Button>
            ))}
        </div>
      </main>

    </div>
  );
};

export default WisdomTrials;
