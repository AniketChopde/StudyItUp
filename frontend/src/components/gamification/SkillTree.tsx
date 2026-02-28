
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  CheckCircle2, 
  BookOpen,
  Zap,
  GitFork
} from 'lucide-react';
import { useStudyPlanStore } from '../../stores/studyPlanStore';
import { Link } from 'react-router-dom';

const SkillTree: React.FC = () => {
  const { plans } = useStudyPlanStore();
  
  // Use the first active plan as the primary skill tree
  const activePlan = useMemo(() => {
    return plans.find(p => p.status === 'active') || plans[0];
  }, [plans]);

  if (!activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-4">
        <GitFork className="w-16 h-16 text-slate-200" />
        <p className="text-slate-400 font-medium">No active study plan to visualize.</p>
        <Link to="/study-plans" className="text-indigo-600 font-bold hover:underline">
          Create a Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="relative p-6 overflow-y-auto max-h-[600px]">
      <div className="max-w-md mx-auto relative">
        {/* Connection Line */}
        <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-700 -translate-x-1/2 z-0" />

        <div className="space-y-12 relative z-10">
          <div className="flex flex-col items-center text-center space-y-1.5 mb-8">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">{activePlan.exam_type} Journey</h3>
            <p className="text-xs text-slate-500">Unlock your potential node by node.</p>
          </div>

          {activePlan.chapters.sort((a, b) => a.order_index - b.order_index).map((chapter, index) => {
            const isCompleted = chapter.status === 'completed';
            const isAvailable = index === 0 || activePlan.chapters[index - 1].status === 'completed';
            const isLocked = !isAvailable && !isCompleted;
            const isLeft = index % 2 === 0;

            return (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`relative flex flex-col ${isLeft ? 'items-start -ml-24' : 'items-end -mr-24'} ${isLocked ? 'opacity-60' : ''}`}
              >
                {/* Node Container */}
                <div className={`flex items-center gap-6 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Node */}
                  <Link 
                    to={`/study-plans/${activePlan.id}?chapterId=${chapter.id}`}
                    className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                        : isLocked 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 grayscale' 
                          : 'bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 shadow-xl shadow-indigo-500/20 hover:scale-110'
                    }`}
                  >
                    {/* Mastery Ring */}
                    {!isLocked && (
                      <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="42"
                          className="fill-none stroke-current opacity-20"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="50%"
                          cy="50%"
                          r="42"
                          className="fill-none stroke-current"
                          strokeWidth="4"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: isCompleted ? 1 : 0.3 }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </svg>
                    )}

                    {isCompleted ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : isLocked ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-8 h-8" />
                    )}

                    {/* Tooltip on hover */}
                    {!isLocked && (
                      <div className={`absolute top-0 ${isLeft ? 'left-full ml-6' : 'right-full mr-6'} w-40 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 dark:border-slate-700 pointer-events-none z-50`}>
                        <h4 className="font-bold text-xs mb-1">{chapter.chapter_name}</h4>
                        <div className="flex items-center gap-1 text-[8px] text-slate-400 font-bold uppercase">
                          <Zap className="w-2.5 h-2.5 text-yellow-500" />
                          {chapter.weightage_percent}% Mastery Potential
                        </div>
                      </div>
                    )}
                  </Link>

                  <div className={`${isLeft ? 'text-left' : 'text-right'}`}>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${
                      isCompleted ? 'text-green-500' : isLocked ? 'text-slate-400' : 'text-indigo-600'
                    }`}>
                      {isCompleted ? 'Node Mastered' : isLocked ? 'Node Locked' : 'Active Channel'}
                    </span>
                    <p className="text-xs font-bold mt-0.5 text-slate-700 dark:text-slate-200">
                      {chapter.chapter_name}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
