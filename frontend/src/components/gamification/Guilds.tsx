import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Trophy, 
  MessageSquare, 
  Plus, 
  Search, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { useGamificationStore } from '../../stores/gamificationStore';

const Guilds: React.FC = () => {
  const { profile, guilds, fetchGuilds, joinGuild, leaveGuild, createGuild } = useGamificationStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGuilds();
  }, [fetchGuilds]);

  const userGuild = profile?.guild;

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userGuild) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black">{userGuild.name}</h2>
              <p className="text-slate-500 font-medium">Level {userGuild.level} Alliance</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <div className="bg-slate-100 dark:bg-slate-800 p-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-700">
               <p className="text-[10px] uppercase font-bold text-slate-500">Guild XP</p>
               <h4 className="text-xl font-black text-indigo-600">{userGuild.total_xp.toLocaleString()}</h4>
             </div>
             <div className="bg-slate-100 dark:bg-slate-800 p-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-700">
               <p className="text-[10px] uppercase font-bold text-slate-500">Members</p>
               <h4 className="text-xl font-black text-emerald-600">{userGuild.member_count} / 50</h4>
             </div>
             <button 
               onClick={() => {
                 if (window.confirm('Are you sure you want to leave this alliance? Your contributions will remain, but you will lose access to the Strategy Room.')) {
                   leaveGuild();
                 }
               }}
               className="p-4 px-6 rounded-2xl border-2 border-rose-500/20 text-rose-500 font-bold hover:bg-rose-500/10 transition-all active:scale-95"
             >
               Leave Alliance
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                 <h3 className="text-2xl font-bold">Party Mission: Exam Conquest</h3>
                 <p className="text-indigo-100/80 max-w-md">Collaborate with your guild members to achieve a combined score of 85% in the upcoming practice tests.</p>
                 <div className="flex items-center gap-4 pt-4">
                   <div className="flex -space-x-3">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-indigo-400">
                          {String.fromCharCode(64 + i)}
                       </div>
                     ))}
                   </div>
                   <span className="text-sm font-bold text-indigo-200">12 members active now</span>
                 </div>
               </div>
               <Trophy className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10" />
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-indigo-500" />
                 Alliance Strategy Room
               </h3>
               <div className="space-y-6 opacity-60 italic text-slate-400 py-10 text-center">
                  <p>Encrypted alliance communication. Start a thread below.</p>
                  <button className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all">Send Strategy Note</button>
               </div>
            </div>
          </div>

          <aside className="space-y-6">
             <div className="bg-slate-50 dark:bg-slate-700/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-600">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Guild Perks
                </h3>
                <ul className="space-y-3">
                   {[
                     { label: 'Wisdom Share', active: true, desc: '+5% XP in group study' },
                     { label: 'Shield Wall', active: false, desc: 'Locked at Guild Lev 15' },
                     { label: 'XP Reservoir', active: false, desc: 'Locked at Guild Lev 20' }
                   ].map((perk, i) => (
                     <li key={i} className={`p-3 rounded-2xl flex flex-col gap-1 ${perk.active ? 'bg-white dark:bg-slate-800 shadow-sm border border-emerald-100 dark:border-emerald-900/30' : 'opacity-40 grayscale'}`}>
                        <span className="text-xs font-black uppercase text-indigo-600">{perk.label}</span>
                        <span className="text-[10px] text-slate-500">{perk.desc}</span>
                     </li>
                   ))}
                </ul>
             </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">Alliances</h2>
          <p className="text-slate-500 font-medium">Join or create a guild to forge your path together.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 px-6 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Founder Guild
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search for an alliance..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 outline-none p-4 pl-16 rounded-[2rem] font-medium transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuilds.map((guild) => (
          <motion.div 
            key={guild.id}
            whileHover={{ y: -5 }}
            className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-500 uppercase">Lv. {guild.level}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold group-hover:text-indigo-600 transition-colors">{guild.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{guild.description}</p>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700">
               <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                 <Users className="w-4 h-4" />
                 {guild.member_count} Members
               </div>
               <button 
                 onClick={() => joinGuild(guild.id)}
                 className="flex items-center gap-1 text-sm font-black text-indigo-600 hover:gap-2 transition-all p-2 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20"
               >
                 Join
                 <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-700 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black">Founder an Alliance</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-rose-500">
                   <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Alliance Name</label>
                  <input 
                    type="text" 
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                    placeholder="e.g. The Quantum Scholars"
                    className="w-full bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Alliance Decree (Description)</label>
                  <textarea 
                    rows={3}
                    value={newGuildDesc}
                    onChange={(e) => setNewGuildDesc(e.target.value)}
                    placeholder="What is your guild's primary focus?"
                    className="w-full bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (newGuildName && newGuildDesc) {
                    await createGuild(newGuildName, newGuildDesc);
                    setShowCreateModal(false);
                    setNewGuildName('');
                    setNewGuildDesc('');
                  }
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                Assemble Alliance
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Guilds;
