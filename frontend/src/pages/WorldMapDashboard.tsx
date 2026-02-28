import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Sword, 
  Map as MapIcon, 
  Mountain, 
  Castle, 
  Cloud,
  ChevronRight,
  Target,
  Users,
  MessageSquare,
  Bot,
  Skull
} from 'lucide-react';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { useGamificationStore } from '../stores/gamificationStore';

const WorldMapDashboard: React.FC = () => {
  const { plans } = useStudyPlanStore();
  const { profile } = useGamificationStore();
  const navigate = useNavigate();

  const subjects = useMemo(() => {
    const subs: Record<string, { name: string; chapters: any[]; completed: number; planId: string }> = {};
    plans.filter(p => p.status === 'active').forEach(plan => {
      plan.chapters.forEach(ch => {
        if (!subs[ch.subject]) {
          subs[ch.subject] = { name: ch.subject, chapters: [], completed: 0, planId: plan.id };
        }
        subs[ch.subject].chapters.push(ch);
        if (ch.status === 'completed') subs[ch.subject].completed++;
      });
    });
    return Object.values(subs);
  }, [plans]);

  const getKingdomIcon = (index: number) => {
    const icons = [Mountain, Castle, Shield, MapIcon];
    const Icon = icons[index % icons.length];
    return <Icon className="w-8 h-8" />;
  };

  const colors = [
    'from-emerald-500 to-teal-700',
    'from-blue-500 to-indigo-700',
    'from-rose-500 to-orange-700',
    'from-purple-500 to-violet-700',
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 lg:p-6 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-20 left-1/4"
        >
          <Cloud className="w-32 h-32" />
        </motion.div>
        <motion.div 
          animate={{ x: [0, -150, 0], y: [0, 80, 0] }}
          transition={{ duration: 25, repeat: Infinity, delay: 5 }}
          className="absolute top-1/3 right-1/4"
        >
          <Cloud className="w-48 h-48" />
        </motion.div>
      </div>

      <header className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
             <MapIcon className="text-indigo-400 w-7 h-7" />
             World of Knowledge
          </h1>
          <p className="text-slate-400 text-sm font-medium">Map your progress through the kingdoms of learning.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800/80 backdrop-blur-md p-2.5 px-4 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg ring-1 ring-indigo-400 ring-offset-2 ring-offset-slate-800">
               {profile?.level || 1}
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Scholar Rank</p>
              <h3 className="font-black text-white text-sm">Level {profile?.level || 1}</h3>
            </div>
          </div>
          
          <Link to="/gamification" className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105">
            <Users className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((sub, idx) => {
            const mastery = Math.round((sub.completed / sub.chapters.length) * 100);
            return (
              <motion.div
                key={sub.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[idx % colors.length]} rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                
                <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 shadow-2xl h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${colors[idx % colors.length]} text-white shadow-lg`}>
                      {getKingdomIcon(idx)}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white">{mastery}%</span>
                      <p className="text-[8px] uppercase font-bold text-slate-500">Conquered</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{sub.name}</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Kingdom of {sub.name.split(' ')[0]}</p>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{sub.completed} REGIONS SECURED</span>
                      <span>{sub.chapters.length - sub.completed} LURKING BOSSES</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mastery}%` }}
                        className={`h-full bg-gradient-to-r ${colors[idx % colors.length]}`}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2.5">
                    <Link 
                      to={`/dungeon-delver?topic=${encodeURIComponent(sub.name)}&subject=${encodeURIComponent(sub.name)}&planId=${sub.planId}`}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2 md:p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-[10px] transition-all shadow-lg"
                    >
                      <Sword className="w-3 h-3" />
                      Invade
                    </Link>
                    <Link 
                      to={`/boss-battle?autoStart=true&topic=${encodeURIComponent(sub.name)}&subject=${encodeURIComponent(sub.name)}&planId=${sub.planId}`}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white p-2 md:p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-[10px] transition-all shadow-lg"
                    >
                      <Skull className="w-3 h-3" />
                      Battle
                    </Link>
                     <Link 
                      to={`/wisdom-trials?topic=${encodeURIComponent(sub.name)}&subject=${encodeURIComponent(sub.name)}&planId=${sub.planId}`}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white p-2 md:p-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-[10px] transition-all shadow-lg"
                    >
                      <Target className="w-3 h-3" />
                      Trial
                    </Link>
                    <Link 
                      to="/gamification"
                      className="w-11 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 p-2.5 rounded-xl flex items-center justify-center transition-all group-hover:rotate-12"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* New Kingdom Entry */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            className="group relative h-full min-h-[400px]"
          >
            <div className="absolute inset-0 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl transition-colors group-hover:bg-slate-800/50 group-hover:border-indigo-500/50" />
            <div className="relative h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500 transition-colors">
                <Target className="w-8 h-8 text-slate-500 group-hover:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-300">Discover New Kingdom</h3>
                <p className="text-xs text-slate-500 mt-1">Find a new subject and begin your conquest.</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Floating Action HUD */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-2xl border border-slate-700 p-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 z-50 ring-1 ring-white/10">
          {[
            { id: 'mentor', icon: Bot, label: 'Mentor NPC', color: 'bg-emerald-500', path: '/chat' },
            { id: 'quests', icon: Target, label: 'Active Quests', color: 'bg-rose-500', path: '/gamification' },
            { id: 'guild', icon: Users, label: 'Guild Hub', color: 'bg-gamification', path: '/gamification' },
            { id: 'oracle', icon: MessageSquare, label: 'Oracle Chat', color: 'bg-amber-500', path: '/chat' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => navigate(item.path)}
              className="group relative"
            >
              <div className={`p-3 rounded-xl ${item.color === 'bg-gamification' ? 'bg-indigo-500' : item.color} text-white shadow-lg hover:scale-110 active:scale-95 transition-all text-sm`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default WorldMapDashboard;
