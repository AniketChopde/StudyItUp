import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Flame, 
  Target, 
  TreePine, 
  GitFork, 
  Medal, 
  Zap,
  Star,
  Award,
  Brain,
  MessageSquare,
  Map,
  Sword,
  Coins,
  Shield,
  Gem,
  Clock,
  FlaskConical,
  ShoppingBag,
  Package,
  History,
  ShieldHalf
} from 'lucide-react';
import { useGamificationStore } from '../stores/gamificationStore';
import { useAuthStore } from '../stores/authStore';
import KnowledgeGarden from '../components/gamification/KnowledgeGarden';
import SkillTree from '../components/gamification/SkillTree';
import Guilds from '../components/gamification/Guilds';
import AvatarEvolution from '../components/gamification/AvatarEvolution';
import { useStudyPlanStore } from '../stores/studyPlanStore';

const GamificationHub: React.FC = () => {
  const { profile, leaderboard, fetchProfile, fetchLeaderboard, buyPowerUp, isLoading } = useGamificationStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'journey' | 'garden' | 'leaderboard' | 'armoury' | 'guilds' | 'replay'>('journey');
  const [buyingItem, setBuyingItem] = useState<string | null>(null);

  const getRank = (level: number, stats: any) => {
    // Incorporating stats into rank logic to acknowledge specialization
    const totalStats = (stats?.logic || 0) + (stats?.memory || 0) + (stats?.grind || 0);
    const glowIntensity = Math.min(20, totalStats / 10);
    
    if (level < 5) return { title: 'Beginner Scholar', icon: '🐣', color: 'text-slate-400', glow: `0 0 ${glowIntensity}px rgba(148,163,184,0.3)` };
    if (level < 10) return { title: 'Knowledge Seeker', icon: '📜', color: 'text-emerald-400', glow: `0 0 ${glowIntensity}px rgba(52,211,153,0.3)` };
    if (level < 15) return { title: 'Elite Strategist', icon: '⚔️', color: 'text-blue-400', glow: `0 0 ${glowIntensity}px rgba(96,165,250,0.3)` };
    if (level < 25) return { title: 'Grandmaster', icon: '👑', color: 'text-purple-400', glow: `0 0 ${glowIntensity}px rgba(192,132,252,0.4)` };
    return { title: 'Living Legend', icon: '🌌', color: 'text-pink-400', glow: `0 0 ${glowIntensity}px rgba(244,114,182,0.5)` };
  };

  const rank = getRank(profile?.level || 1, profile?.stats);

  const statSpecialization = useMemo(() => {
    if (!profile?.stats) return "";
    const { logic, memory, grind } = profile.stats;
    if (logic > memory && logic > grind) return "Precision Striker";
    if (memory > logic && memory > grind) return "Sage Guardian";
    if (grind > logic && grind > memory) return "Iron Scholar";
    return "Balanced Warrior";
  }, [profile?.stats]);

  useEffect(() => {
    fetchProfile();
    fetchLeaderboard();
  }, [fetchProfile, fetchLeaderboard]);

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Zap className="w-12 h-12 text-yellow-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy className="w-48 h-48 -mr-12 -mt-12" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                <Trophy className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gamification Hub</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span 
                    style={{ textShadow: rank.glow }}
                    className={`text-[10px] font-black uppercase tracking-widest ${rank.color} bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1 transition-all duration-1000`}
                  >
                    {rank.icon} {rank.title} • {statSpecialization}
                  </span>
                  <span className="text-indigo-100/60 text-xs">•</span>
                  <p className="text-indigo-100 text-xs font-medium">Welcome back, {user?.full_name?.split(' ')[0] || 'Scholar'}!</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold">{profile?.streak?.current_streak || 0} Day Streak</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Medal className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold">Level {profile?.level || 1}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-inner">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-bold">{profile?.total_xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-400/20 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-amber-400/30">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-100">{profile?.coins || 0} Coins</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-48 space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span>Next Level</span>
              <span>{profile?.xp_to_next_level || 0} XP needed</span>
            </div>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (profile?.total_xp || 0) / ((profile?.level || 1) * 10 || 1))}%` }}
                className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Character & Quests */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Character Attributes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-indigo-500" />
              Character Attributes
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Logic (INT)', value: profile?.stats?.logic || 0, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-500', desc: 'STEM Mastery' },
                { label: 'Memory (WIS)', value: profile?.stats?.memory || 0, icon: Star, color: 'text-purple-500', bg: 'bg-purple-500', desc: 'Retention' },
                { label: 'Grind (STR)', value: profile?.stats?.grind || 0, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500', desc: 'Consistency' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-[8px] text-slate-400 font-medium ml-5">{stat.desc}</p>
                    </div>
                    <span className="text-base font-black">{stat.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      className={`h-full ${stat.bg} opacity-80`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                Daily Quests
              </h2>
              <span className="text-[10px] text-slate-400">Resets in 12h</span>
            </div>

            <div className="space-y-4">
              {profile?.active_quests?.map((quest) => {
                const { plans } = useStudyPlanStore.getState();
                const activePlan = plans.find(p => p.status === 'active') || plans[0];

                const getQuestRoute = (type: string) => {
                  const baseParams = activePlan 
                    ? `&topic=${encodeURIComponent(activePlan.exam_type || 'General')}&subject=${encodeURIComponent(activePlan.exam_type || 'General')}&planId=${activePlan.id}`
                    : `&topic=${encodeURIComponent('General Knowledge')}&subject=${encodeURIComponent('General')}`;

                  switch(type) {
                    case 'quiz': return `/boss-battle?autoStart=true${baseParams}`;
                    case 'chapter': return `/dungeon-delver?${baseParams.substring(1)}`;
                    case 'chat': return `/wisdom-trials?${baseParams.substring(1)}`;
                    default: return '#';
                  }
                };

                const getQuestIcon = (type: string) => {
                  switch(type) {
                    case 'quiz': return <Sword className="w-4 h-4 text-rose-500" />;
                    case 'chapter': return <Map className="w-4 h-4 text-emerald-500" />;
                    case 'chat': return <MessageSquare className="w-4 h-4 text-amber-500" />;
                    default: return <Target className="w-4 h-4 text-indigo-500" />;
                  }
                };

                return (
                  <Link 
                    key={quest.id} 
                    to={getQuestRoute(quest.requirement_type)}
                    className="group block relative p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          {getQuestIcon(quest.requirement_type)}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold group-hover:text-indigo-600 transition-colors">{quest.title}</h3>
                          {!quest.is_completed && <span className="text-[10px] text-slate-400">Mission Active • Click to start</span>}
                          {quest.is_completed && <span className="text-[10px] text-green-500 font-bold">Mission Accomplished</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-500">+{quest.xp_reward} XP</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (quest.current_count / quest.target_count) * 100)}%` }}
                          className={`h-full ${quest.is_completed ? 'bg-green-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{quest.current_count}/{quest.target_count} Completed</span>
                        {quest.is_completed && <Award className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-emerald-500" />
              Your Inventory
            </h2>
            <div className="space-y-3">
              {profile?.inventory && profile.inventory.length > 0 ? (
                profile.inventory.map((item) => (
                  <div key={item.item_key} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{item.name}</span>
                        <span className="text-[8px] text-slate-400">Ready to use</span>
                      </div>
                    </div>
                    <span className="p-0.5 px-2 bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-600 rounded-lg text-[10px] font-black">
                      x{item.quantity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400">Armoury is empty.</p>
                  <button onClick={() => setActiveTab('armoury')} className="text-xs text-indigo-500 font-bold hover:underline">Visit Store</button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content: Tabs */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {[
              { id: 'journey', label: 'Your Journey', icon: GitFork },
              { id: 'armoury', label: 'Study Armoury', icon: ShoppingBag },
              { id: 'guilds', label: 'Alliances', icon: ShieldHalf },
              { id: 'garden', label: 'Knowledge Garden', icon: TreePine },
              { id: 'replay', label: 'Battle Log', icon: History },
              { id: 'leaderboard', label: 'Global Rank', icon: Medal },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-indigo-500'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 min-h-[500px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'journey' && (
                <motion.div
                  key="journey"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <div className="p-4 space-y-6">
                    <AvatarEvolution />
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <GitFork className="w-5 h-5 text-indigo-500" />
                        Skill Tree Progression
                      </h3>
                      <SkillTree />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'garden' && (
                <motion.div
                  key="garden"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 h-full"
                >
                  <KnowledgeGarden />
                </motion.div>
              )}

              {activeTab === 'armoury' && (
                <motion.div
                  key="armoury"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Study Armoury</h2>
                      <p className="text-slate-500 text-sm">Convert your Study Coins into strategic tactical gear.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 p-3 px-5 rounded-2xl border border-amber-200 dark:border-amber-800">
                      <Coins className="w-6 h-6 text-yellow-500 shadow-sm" />
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{profile?.coins || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { key: 'focus_potion', name: 'Focus Potion', desc: 'Dims UI distractions for 15 mins. Perfect for deep study.', cost: 150, icon: FlaskConical, color: 'text-indigo-500' },
                      { key: 'time_warp', name: 'Time Warp', desc: 'Adds 10 extra minutes during your next Quiz/Test.', cost: 200, icon: Clock, color: 'text-blue-500' },
                      { key: 'hint_gem', name: 'Hint Gem', desc: 'Reveal part of an answer during a Boss Battle.', cost: 100, icon: Gem, color: 'text-emerald-500' },
                      { key: 'shield', name: 'XP Shield', desc: 'Protect your XP from being drained on failed questions.', cost: 300, icon: Shield, color: 'text-rose-500' }
                    ].map((item) => (
                      <div key={item.key} className="relative group p-6 rounded-3xl bg-slate-50 dark:bg-slate-700/50 border border-transparent hover:border-amber-400 transition-all">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <item.icon className={`w-8 h-8 ${item.color}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            <div className="flex items-center justify-between pt-4">
                              <div className="flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-yellow-500" />
                                <span className="font-bold text-sm">{item.cost}</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  try {
                                    setBuyingItem(item.key);
                                    await buyPowerUp(item.key);
                                  } catch (err) {} finally {
                                    setBuyingItem(null);
                                  }
                                }}
                                disabled={buyingItem === item.key || (profile?.coins || 0) < item.cost}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  (profile?.coins || 0) >= item.cost 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md flex items-center gap-2' 
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {buyingItem === item.key ? (
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                                    <Zap className="w-3 h-3" />
                                  </motion.div>
                                ) : 'Craft Item'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-3xl bg-indigo-600 text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                       <h3 className="font-bold flex items-center gap-2">
                         <GitFork className="w-5 h-5" />
                         Study Multiplier: x{profile?.streak?.streak_multiplier || '1.0'}
                       </h3>
                       <p className="text-xs opacity-80">Keep your streak alive to increase your XP gains and earn legendary shields!</p>
                    </div>
                    <Flame className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10" />
                  </div>
                </motion.div>
              )}

              {activeTab === 'guilds' && (
                <motion.div
                  key="guilds"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Guilds />
                </motion.div>
              )}

              {activeTab === 'replay' && (
                <motion.div
                  key="replay"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Battle Log</h2>
                      <p className="text-slate-500">Your recent academic victories and tactical reports.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { type: 'Quiz Victory', topic: 'Modern Physics', date: '2 hours ago', xp: 150, coins: 25, badge: 'Sage' },
                      { type: 'Chapter Conquered', topic: 'Organic Chemistry', date: 'Yesterday', xp: 300, coins: 50, badge: 'Scholar' },
                      { type: 'Arena Draw', topic: 'Algebraic Structures', date: '3 days ago', xp: 45, coins: 10, badge: null }
                    ].map((battle, i) => (
                      <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner">
                              <History className="w-6 h-6 text-indigo-500 opacity-60" />
                           </div>
                           <div>
                              <h4 className="font-bold">{battle.type}: {battle.topic}</h4>
                              <p className="text-xs text-slate-400 font-medium">{battle.date} • Strategic Victory</p>
                           </div>
                        </div>
                        <div className="text-right space-y-1">
                           <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-indigo-600">+{battle.xp} XP</span>
                              <span className="text-sm font-black text-amber-500">+{battle.coins} CP</span>
                           </div>
                           {battle.badge && (
                             <span className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">Title Awarded: {battle.badge}</span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Leaderboard</h2>
                      <p className="text-slate-500">The world's top scholars this week.</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl">
                      <Medal className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.username} className={`flex items-center justify-between p-4 rounded-2xl ${
                        index < 3 ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-700/30'
                      }`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-8 font-black ${
                            index === 0 ? 'text-yellow-500 text-xl' : 
                            index === 1 ? 'text-slate-400 text-lg' : 
                            index === 2 ? 'text-orange-500' : 'text-slate-300'
                          }`}>
                            #{index + 1}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {entry.username.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold flex items-center gap-2">
                              {entry.username}
                              {index < 3 && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="text-xs text-slate-500">Level {entry.level} • {entry.badges_count} Badges</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-indigo-600">{entry.total_xp.toLocaleString()}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">XP Points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GamificationHub;
