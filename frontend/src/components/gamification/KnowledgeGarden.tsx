
import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, TreePine, Flower, Trees } from 'lucide-react';
import { useStudyPlanStore } from '../../stores/studyPlanStore';

const KnowledgeGarden: React.FC = () => {
  const { plans } = useStudyPlanStore();

  // Group progress by subject
  const subjectProgress = plans.reduce((acc, plan) => {
    const totalChapters = plan.chapters.length;
    const completedChapters = plan.chapters.filter(ch => ch.status === 'completed').length;
    const percent = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
    
    if (!acc[plan.exam_type]) {
      acc[plan.exam_type] = {
        name: plan.exam_type,
        percent: percent,
        total: totalChapters,
        completed: completedChapters
      };
    } else {
      // Average it out if multiple plans for same "exam_type" (unlikely but safe)
      acc[plan.exam_type].percent = (acc[plan.exam_type].percent + percent) / 2;
      acc[plan.exam_type].total += totalChapters;
      acc[plan.exam_type].completed += completedChapters;
    }
    return acc;
  }, {} as Record<string, { name: string; percent: number; total: number; completed: number }>);

  const subjects = Object.values(subjectProgress);

  const getPlantIcon = (percent: number) => {
    if (percent === 0) return <Sprout className="w-8 h-8 text-slate-300" />;
    if (percent < 30) return <Sprout className="w-10 h-10 text-emerald-400" />;
    if (percent < 70) return <TreePine className="w-12 h-12 text-emerald-500" />;
    if (percent < 100) return <Trees className="w-14 h-14 text-emerald-600" />;
    return <Flower className="w-16 h-16 text-pink-500 animate-bounce" />;
  };

  const getStageName = (percent: number) => {
    if (percent === 0) return "Seed";
    if (percent < 30) return "Sapling";
    if (percent < 70) return "Growing Tree";
    if (percent < 100) return "Elder Tree";
    return "Blooming Garden";
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {subjects.map((subject) => (
          <motion.div
            key={subject.name}
            whileHover={{ y: -10 }}
            className="group relative bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl p-8 border border-emerald-100 dark:border-emerald-800/50 overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trees className="w-32 h-32 text-emerald-600" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  key={subject.percent}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative z-10 p-6 bg-white dark:bg-slate-800 rounded-full shadow-xl"
                >
                  {getPlantIcon(subject.percent)}
                </motion.div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{subject.name}</h3>
                <div className="flex items-center gap-2 justify-center">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">
                    {getStageName(subject.percent)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {Math.round(subject.percent)}% Mastered
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <div className="h-2 w-full bg-emerald-200/50 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.percent}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  />
                </div>
                <p className="text-center text-[10px] text-slate-400 font-medium">
                  {subject.completed} of {subject.total} Chapters Completed
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
            <Sprout className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-400 font-medium">No plans found. Start learning to grow your garden!</p>
          </div>
        )}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-indigo-500/20">
        <div className="space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-bold">Nature Rewards the Persistent</h2>
          <p className="text-indigo-100 max-w-lg">
            Your Knowledge Garden grows as you complete modules. Master every chapter to see your garden in full bloom and earn rare achievement badges.
          </p>
        </div>
        <button className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-2xl hover:scale-105 transition-transform">
          View Ranking Info
        </button>
      </div>
    </div>
  );
};

export default KnowledgeGarden;
