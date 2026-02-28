
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '../stores/quizStore';
import { 
  Shield, 
  Skull, 
  Trophy, 
  Brain,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import toast from 'react-hot-toast';

const BossBattleQuiz: React.FC = () => {
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

  const [userHealth, setUserHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [showDamage, setShowDamage] = useState<{ value: number; type: 'boss' | 'player' } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Parse URL params
  const queryParams = new URLSearchParams(location.search);
  const topic = queryParams.get('topic') || 'General Knowledge';
  const subject = queryParams.get('subject') || 'General';
  const planId = queryParams.get('planId');
  const autoStart = queryParams.get('autoStart') === 'true';

  useEffect(() => {
    if (autoStart && !activeQuiz && !isLoading) {
      generateQuiz(topic, subject, 5, 'medium', null, planId); // Short and intense: 5 questions
    }
  }, [autoStart, activeQuiz, isLoading, topic, subject, planId, generateQuiz]);

  const handleAnswer = async (questionId: string, answer: string) => {
    const currentQ = activeQuiz?.questions[currentQuestion];
    if (!currentQ) return;

    const isCorrect = answer === currentQ.correct_answer;
    submitAnswer(questionId, answer);

    if (isCorrect) {
      const damage = 20;
      setBossHealth(prev => Math.max(0, prev - damage));
      setShowDamage({ value: damage, type: 'boss' });
      setCombatLog(prev => [`CRITICAL HIT! You dealt ${damage} DMG to the Sentinel.`, ...prev.slice(0, 4)]);
      toast.success("Direct Hit!");
    } else {
      const damage = 25;
      setUserHealth(prev => Math.max(0, prev - damage));
      setShowDamage({ value: damage, type: 'player' });
      setIsShaking(true);
      setCombatLog(prev => [`OUCH! The Sentinel counter-attacked for ${damage} DMG.`, ...prev.slice(0, 4)]);
      toast.error("Shields Down!");
      setTimeout(() => setIsShaking(false), 500);
    }

    setTimeout(() => {
      setShowDamage(null);
      if (currentQuestion < (activeQuiz?.questions.length || 0) - 1) {
        nextQuestion();
      } else {
        submitQuiz();
      }
    }, 1500);
  };

  if (isLoading) return <Loading text="Summoning the AI Boss..." />;

  if (results) {
    const victory = results.score >= 70;
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`p-10 rounded-full ${victory ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}
        >
          {victory ? <Trophy className="w-24 h-24" /> : <Skull className="w-24 h-24" />}
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black uppercase tracking-tighter">
            {victory ? 'Victory Achieved!' : 'Defeated by the Sentinel'}
          </h1>
          <p className="text-xl text-slate-500 font-medium">
            {victory 
              ? `You conquered the ${topic} arena with a score of ${Math.round(results.score)}%!` 
              : "The Sentinel was too strong this time. Review your knowledge and return!"}
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={() => { resetQuiz(); navigate('/gamification'); }}
            className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest"
          >
            Return to Hub
          </Button>
          {!victory && (
            <Button 
              variant="outline"
              onClick={() => { resetQuiz(); generateQuiz(topic, subject, 5, 'medium'); }}
              className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest border-2"
            >
              Re-Challenge
            </Button>
          )}
        </div>
      </div>
    );
  }

  const currentQ = activeQuiz?.questions[currentQuestion];

  return (
    <div className={`max-w-5xl mx-auto p-4 space-y-6 transition-all ${isShaking ? 'animate-shake' : ''}`}>
      {/* Combat Stat Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Player Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Scholar</span>
                <h3 className="text-lg font-bold">Maleshkumar</h3>
              </div>
            </div>
            <span className="text-xl font-black text-blue-600">{userHealth}%</span>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-inner">
            <motion.div 
              animate={{ width: `${userHealth}%` }}
              className={`h-full bg-gradient-to-r from-blue-500 to-indigo-600`}
            />
          </div>
        </div>

        {/* Boss Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-end flex-row-reverse">
            <div className="flex items-center gap-2 flex-row-reverse text-right">
              <div className="p-2 bg-red-100 rounded-xl">
                <Skull className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Level 5 Boss</span>
                <h3 className="text-lg font-bold">Concept Sentinel</h3>
              </div>
            </div>
            <span className="text-xl font-black text-red-600">{bossHealth}%</span>
          </div>
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-inner">
            <motion.div 
              animate={{ width: `${bossHealth}%` }}
              className={`h-full bg-gradient-to-l from-red-500 to-rose-600`}
            />
          </div>
        </div>
      </div>

      {/* Battle Scene */}
      <div className="relative aspect-[16/5] bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80" />
        
        {/* Damage Numbers Overlay */}
        <AnimatePresence>
          {showDamage && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -80, scale: 1.2 }}
              exit={{ opacity: 0 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 font-black text-4xl italic z-50 ${
                showDamage.type === 'boss' ? 'text-yellow-400' : 'text-red-500'
              }`}
            >
              -{showDamage.value}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boss Avatar Area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              filter: bossHealth < 30 ? ['hue-rotate(0deg)', 'hue-rotate(90deg)'] : 'none'
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-white flex flex-col items-center"
          >
            <div className={`relative ${bossHealth === 0 ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
              <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="h-32 w-32 bg-gradient-to-br from-slate-700 to-black rounded-full border-2 border-red-500/30 flex items-center justify-center relative">
                <Brain className="w-16 h-16 text-red-500 animate-pulse" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Combat Log */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="space-y-2 max-w-sm">
            {combatLog.map((log, i) => (
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1 - i * 0.2, x: 0 }}
                key={i} 
                className="text-xs font-bold text-white/50"
              >
                {log}
              </motion.p>
            ))}
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Current Phase</span>
            <p className="text-white font-black text-lg">Battle of {topic}</p>
          </div>
        </div>
      </div>

      {/* Question Zone */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Mission Requirement</span>
            <h2 className="text-xl font-black mt-1 leading-tight text-slate-800 dark:text-white">
                {currentQ?.question_text || currentQ?.question || "Question initializing..."}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQ?.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleAnswer(currentQ.question_id, option.charAt(1) === ')' ? option.charAt(0) : String.fromCharCode(65 + index))}
              className="h-14 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative overflow-hidden"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center font-black text-xs text-slate-500 group-hover:text-indigo-600 transition-colors">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="font-bold text-sm text-left">{option.charAt(1) === ')' ? option.substring(3) : option}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BossBattleQuiz;
