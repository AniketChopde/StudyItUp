import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Map as MapIcon, 
  Target,
  Zap,
  Lock,
  Skull,
  Star,
  FlaskConical,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudyPlanStore } from '../stores/studyPlanStore';
import { useGamificationStore } from '../stores/gamificationStore';

interface DungeonRoom {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'topic' | 'boss' | 'chest';
  title: string;
  status: 'locked' | 'unlocked' | 'completed';
  content?: any;
}

const DungeonDelver: React.FC = () => {
  const { plans } = useStudyPlanStore();
  const { profile } = useGamificationStore();
  
  // For demo, we'll take the first active plan's first subject's chapters
  const activePlan = plans.find(p => p.status === 'active');
  const chapters = activePlan?.chapters || [];
  
  const [selectedRoom, setSelectedRoom] = useState<DungeonRoom | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });

  const dungeonGrid = useMemo(() => {
    const rooms: DungeonRoom[] = [];
    const gridSize = Math.ceil(Math.sqrt(chapters.length + 2));
    
    // Start Room
    rooms.push({ id: 'start', x: 0, y: 0, type: 'start', title: 'Entrance Hall', status: 'completed' });

    chapters.forEach((ch, idx) => {
      const x = (idx + 1) % gridSize;
      const y = Math.floor((idx + 1) / gridSize);
      rooms.push({
        id: ch.id || idx.toString(),
        x,
        y,
        type: idx === chapters.length - 1 ? 'boss' : 'topic',
        title: ch.chapter_name,
        status: ch.status === 'completed' ? 'completed' : (idx === 0 || chapters[idx-1].status === 'completed' ? 'unlocked' : 'locked'),
        content: ch
      });
    });

    return rooms;
  }, [chapters]);

  const handleMove = (room: DungeonRoom) => {
    if (room.status === 'locked') return;
    setPlayerPos({ x: room.x, y: room.y });
    setSelectedRoom(room);
  };

  return (
    <div className="-m-4 lg:-m-8 bg-slate-950 text-white overflow-hidden flex flex-col font-sans min-h-[calc(100vh-4rem)]">
      {/* HUD Layer */}
      <header className="relative z-20 p-4 bg-gradient-to-b from-slate-900 to-transparent flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              <Skull className="text-rose-500 w-5 h-5" />
              Dungeon of {activePlan?.exam_type || 'Knowledge'}
            </h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Invasion in progress • {chapters.filter(c => c.status === 'completed').length} Rooms Cleared</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5 text-yellow-400 font-black text-sm">
               <Zap className="w-3.5 h-3.5 fill-yellow-400" />
               <span>LVL {profile?.level || 1}</span>
             </div>
             <div className="h-1 w-16 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-yellow-500 w-1/2" />
             </div>
           </div>
           <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold shadow-lg ring-1 ring-indigo-400 text-sm">
             {profile?.level || 1}
           </div>
        </div>
      </header>

      {/* Main Dungeon Grid */}
      <main className="flex-1 relative perspective-1000">
        {!activePlan && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-[4rem]">
            <div className="text-center space-y-4">
              <Lock className="w-16 h-16 text-slate-700 mx-auto" />
              <h2 className="text-2xl font-black text-white">PLAN NOT DETECTED</h2>
              <p className="text-slate-500 max-w-xs mx-auto">You need an active study plan to explore this dungeon.</p>
              <Link to="/study-plans" className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">
                Create Expedition
              </Link>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-50" />
        
        <div className="h-full overflow-auto p-12 flex items-center justify-center">
          <div className="relative grid grid-cols-4 gap-6 p-6 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-3xl shadow-2xl">
            {/* Grid Connections (Mockup) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
               {/* Simplified connection lines could be added here */}
            </svg>

            {dungeonGrid.map((room) => {
              const isCurrent = playerPos.x === room.x && playerPos.y === room.y;
              
              return (
                <motion.button
                  key={room.id}
                  whileHover={room.status !== 'locked' ? { scale: 1.05, y: -2 } : {}}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMove(room)}
                  className={`group relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    room.status === 'locked' 
                      ? 'bg-slate-900/50 border-slate-800 text-slate-700' 
                      : room.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                        : 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]'
                  } border`}
                >
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div 
                        layoutId="player"
                        className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-xl shadow-2xl flex items-center justify-center text-indigo-600 border-2 border-indigo-500 ring-4 ring-indigo-500/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Bot className="w-6 h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`p-2 rounded-xl mb-1 transition-transform ${isCurrent ? 'scale-110' : ''}`}>
                    {room.type === 'start' && <MapIcon className="w-6 h-6 opacity-50" />}
                    {room.type === 'topic' && room.status === 'locked' && <Lock className="w-6 h-6" />}
                    {room.type === 'topic' && room.status !== 'locked' && <Target className="w-6 h-6" />}
                    {room.type === 'boss' && <Skull className={`w-6 h-6 ${room.status === 'locked' ? '' : 'text-rose-500'}`} />}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-center px-2 line-clamp-1">{room.title}</span>

                  {/* Room Pulsing Detail */}
                  {room.status === 'unlocked' && !isCurrent && (
                    <div className="absolute -inset-1 border border-indigo-400/50 rounded-3xl animate-pulse" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Control / Info Panel */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div 
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="relative z-30 bg-slate-900 border-t border-slate-800 p-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                selectedRoom.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
              }`}>
                  {selectedRoom.type === 'boss' ? <Skull className="w-8 h-8" /> : <Star className="w-8 h-8" />}
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-[8px] font-black uppercase text-indigo-500 mb-0.5">Room Investigation</p>
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">{selectedRoom.title}</h2>
                <div className="flex gap-4 items-center justify-center md:justify-start">
                  <div className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                    <FlaskConical className="w-3 h-3 text-emerald-500" />
                    Focus: High
                  </div>
                  <div className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2">
                    <Sword className="w-4 h-4 text-rose-500" />
                    Loot: +100 XP
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-slate-700"
                >
                  Close
                </button>
                  <Link 
                    to={selectedRoom.type === 'boss' 
                      ? `/boss-battle?topic=${encodeURIComponent(selectedRoom.title)}&subject=${encodeURIComponent(activePlan?.exam_type || '')}`
                      : `/study-plans/${activePlan?.id}?chapterId=${selectedRoom.id}`
                    }
                  className="flex-1 md:flex-none px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  {selectedRoom.status === 'completed' ? 'Revisit Room' : 'Enter Battle'}
                  <Sword className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical HUD Footer */}
      <footer className="p-4 bg-black/40 border-t border-white/5 flex justify-center gap-8">
        <div className="flex items-center gap-2 text-slate-500">
           <div className="w-3 h-3 rounded-full bg-emerald-500" />
           <span className="text-[10px] font-bold uppercase">Clear Path</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
           <div className="w-3 h-3 rounded-full bg-indigo-500" />
           <span className="text-[10px] font-bold uppercase">Active Mission</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <span className="text-[10px] font-bold uppercase">Unexplored Dark</span>
        </div>
      </footer>
    </div>
  );
};

export default DungeonDelver;
