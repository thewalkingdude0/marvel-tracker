import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Shield, Zap, Skull, Brain, Plus, Minus, Settings, X, 
  BookOpen, Search, Dice5, ChevronRight, AlertTriangle, 
  AlertOctagon, Flame, Activity, RotateCcw, Check, Crosshair, Hexagon, RefreshCw, ArrowRightCircle
} from 'lucide-react';
import marvelData from './marvel_data.json';

const getCardImage = (code) => `https://marvelcdb.com/bundles/cards/${code}.png`;

// --- ANIMATIONS ---
const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "circOut" } },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.1 } }
};

const shakeVariant = {
  shake: { x: [0, -3, 3, -3, 3, 0], transition: { duration: 0.2 } },
  idle: { x: 0 }
};

// --- HELPER: ROBUST PERSISTENCE ---
const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }, [key, value]);
  return [value, setValue];
};

// --- HELPER: VISUALS ---
const getHealthColor = (current, max) => {
  if (!max || max === 0) return "text-white"; 
  const pct = current / max;
  if (pct <= 0.3) return "text-red-500 animate-pulse"; 
  if (pct <= 0.5) return "text-yellow-500"; 
  return "text-white"; 
};

const getStatusStyles = (statusArray) => {
  if (!statusArray || !Array.isArray(statusArray)) return "border-white/10";
  if (statusArray.includes('stunned')) return "grayscale contrast-125 border-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
  if (statusArray.includes('confused')) return "backdrop-blur-sm border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]";
  if (statusArray.includes('tough')) return "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] brightness-110";
  return "border-white/10";
};

// --- UI COMPONENTS ---
const TactileButton = ({ onClick, children, color = "bg-blue-600", className, disabled, size="normal" }) => (
  <motion.button 
    whileHover={!disabled ? { scale: 1.02 } : {}} 
    whileTap={!disabled ? { scale: 0.96 } : {}} 
    onClick={onClick} 
    disabled={disabled} 
    className={`
      ${disabled ? 'bg-gray-800/50 opacity-50 cursor-not-allowed' : color} 
      ${className} 
      relative overflow-hidden font-bold rounded-lg shadow-lg border border-white/10
      flex items-center justify-center gap-2 select-none transition-all backdrop-blur-md
      ${size === 'small' ? 'py-1 px-2 text-[10px]' : 'py-2 px-4'}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    <span className="relative z-10 flex items-center gap-2">{children}</span>
  </motion.button>
);

const AnimatedNumber = ({ value, color }) => (
  <motion.div 
    key={value}
    initial={{ scale: 1.2, opacity: 0.5, filter: "blur(4px)" }}
    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
    transition={{ duration: 0.15 }}
    className={`text-4xl font-black ${color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tabular-nums tracking-tighter`}
  >
    {value}
  </motion.div>
);

const StatDial = ({ value, max, label, onChange, icon }) => {
  const colorClass = getHealthColor(value, max);
  return (
    <div className="relative group/dial">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl pointer-events-none" />
      <div className="flex flex-col items-center p-2 bg-gray-900/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl relative z-10">
        <div className="flex items-center gap-1.5 mb-1 opacity-70">
          {icon}
          <h3 className="text-gray-400 uppercase tracking-[0.2em] text-[8px] font-bold">{label}</h3>
        </div>
        <div className="flex items-center justify-between w-full gap-3 px-1">
          <TactileButton onClick={() => onChange(-1)} color="bg-gray-800 hover:bg-gray-700" className="w-10 h-10 !rounded-lg !p-0 border border-white/10"><Minus size={16} /></TactileButton>
          <AnimatedNumber value={value} color={colorClass} />
          <TactileButton onClick={() => onChange(1)} color="bg-gray-800 hover:bg-gray-700" className="w-10 h-10 !rounded-lg !p-0 border border-white/10"><Plus size={16} /></TactileButton>
        </div>
      </div>
    </div>
  );
};

const UnitCard = ({ unit, type, onDamage, onDefeat, onRestore }) => {
  const isZero = unit.val <= 0;
  const isScheme = type === 'side_scheme';
  const isAlly = type === 'ally';
  const icons = unit.icons || [];
  const [imgError, setImgError] = useState(false);

  const baseBorder = isScheme ? "border-yellow-500/30 bg-yellow-900/20 shadow-yellow-900/10" : isAlly ? "border-blue-500/30 bg-blue-900/20 shadow-blue-900/10" : "border-orange-500/30 bg-orange-900/20 shadow-orange-900/10";
  const hpColor = !isScheme ? getHealthColor(unit.val, unit.max) : "text-white";

  return (
    <motion.div layout initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className={`relative overflow-hidden rounded-xl border ${baseBorder} flex flex-col justify-between shadow-lg h-24 backdrop-blur-md group`}>
      {unit.code && !imgError ? (<><img src={getCardImage(unit.code)} onError={() => setImgError(true)} className="absolute inset-0 w-full h-full object-cover object-[center_25%] opacity-40 mix-blend-overlay pointer-events-none transition-transform group-hover:scale-110 duration-700" alt="" /><div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent`} /></>) : (<div className={`absolute inset-0 opacity-10 bg-gray-800 flex items-center justify-center overflow-hidden`}><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50"></div><Hexagon size={32} className="text-white/20 rotate-12" /></div>)}
      <div className="flex justify-between items-start relative z-10 p-1.5">
        <div className="flex-1 pr-1"><span className={`font-black text-[9px] uppercase tracking-wide leading-tight line-clamp-2 text-white drop-shadow-md`}>{unit.name}</span>{icons.length > 0 && (<div className="flex gap-1 mt-0.5">{icons.includes('crisis') && <AlertOctagon size={8} className="text-red-500 animate-pulse" fill="currentColor" />}{icons.includes('hazard') && <Flame size={8} className="text-orange-500" fill="currentColor" />}{icons.includes('acceleration') && <Activity size={8} className="text-yellow-500" />}</div>)}</div>
        <button onClick={() => onDefeat(unit.id)} className="text-white/30 hover:text-white bg-black/40 hover:bg-red-600/80 rounded p-0.5 transition-colors backdrop-blur-sm"><X size={10} /></button>
      </div>
      <div className="p-1.5 relative z-10"><div className="flex items-center justify-between bg-black/60 backdrop-blur-xl rounded-lg p-0.5 border border-white/10"><button onClick={() => onDamage(unit.id, -1)} className="p-1.5 text-gray-400 hover:text-white active:scale-90 transition-transform"><Minus size={10}/></button><span className={`text-sm font-black ${isZero ? 'text-red-500 animate-pulse' : hpColor}`}>{unit.val}</span><button onClick={() => onDamage(unit.id, 1)} className="p-1.5 text-gray-400 hover:text-white active:scale-90 transition-transform"><Plus size={10}/></button></div></div>
      {isZero && (<div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center backdrop-blur-md gap-2"><div className="flex gap-2"><button onClick={() => onRestore(unit.id)} className="bg-gray-700 hover:bg-gray-600 text-white p-1.5 rounded-full shadow-lg border border-gray-500 hover:scale-110 transition-transform"><RotateCcw size={14} /></button><button onClick={() => onDefeat(unit.id)} className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg border border-red-400 hover:scale-110 transition-transform"><Check size={14} /></button></div></div>)}
    </motion.div>
  );
};

const StatusToggle = ({ type, active, onToggle }) => {
  const config = { stunned: { color: "bg-green-500", icon: <Zap size={12} fill="currentColor" /> }, confused: { color: "bg-purple-500", icon: <Brain size={12} fill="currentColor" /> }, tough: { color: "bg-yellow-500", icon: <Shield size={12} fill="currentColor" /> } };
  const { color, icon } = config[type];
  return (
    <motion.button onClick={onToggle} animate={{ scale: active ? 1 : 0.9, opacity: active ? 1 : 0.3, filter: active ? 'grayscale(0%)' : 'grayscale(100%)' }} whileTap={{ scale: 0.85 }} className={`p-1.5 rounded-md text-white shadow-md border border-white/20 ${active ? color : 'bg-gray-800'} transition-all relative overflow-hidden group/btn`}><div className={`absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300`} />{icon}</motion.button>
  );
};

export default function App() {
  const safeData = marvelData || { heroes: [], villains: [], schemes: [], minions: [], allies: [], side_schemes: [] };

  const [villain, setVillain] = useStickyState({ name: "Setup Game", hp: 0, maxHp: 0, status: [], stages: [0,0,0], stageIdx: 0, set_code: "" }, 'mc_villain');
  const [hero, setHero] = useStickyState({ name: "Select Hero", hp: 0, maxHp: 0, status: [] }, 'mc_hero');
  const [mainScheme, setMainScheme] = useStickyState({ name: "Select Main Scheme", threat: 0, target: 0, baseTarget: 0, accel: 0 }, 'mc_scheme');
  const [units, setUnits] = useStickyState([], 'mc_units');
  const [round, setRound] = useStickyState(1, 'mc_round');
  const [playerCount, setPlayerCount] = useStickyState(1, 'mc_players');

  const [showSetup, setShowSetup] = useState(false);
  const [showSummon, setShowSummon] = useState(false);
  const [showSchemeSelect, setShowSchemeSelect] = useState(false);
  const [showSchemeComplete, setShowSchemeComplete] = useState(false);
  const [setupTab, setSetupTab] = useState('heroes'); 

  const [schemeSearch, setSchemeSearch] = useState("");
  const [activeTab, setActiveTab] = useState('minions');
  const [searchTerm, setSearchTerm] = useState("");
  const [summonTerm, setSummonTerm] = useState("");
  const [listSeed, setListSeed] = useState(0);

  const villainControls = useAnimation();
  const heroControls = useAnimation();
  const schemeControls = useAnimation();

  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    };
    requestWakeLock();
    const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { if (wakeLock) wakeLock.release(); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, []);

  // --- SAFE MATH UPDATE (No Loops) ---
  useEffect(() => {
    if (!safeData || !safeData.schemes) return;

    // 1. Force Recalculate Main Scheme
    const originalScheme = safeData.schemes.find(s => 
      (s.code && s.code === mainScheme.code) || 
      s.name === mainScheme.name
    );

    if (originalScheme) {
        const base = originalScheme.target || 0;
        const newTarget = base * playerCount;
        
        // CRITICAL: Only set state if values are DIFFERENT. This stops the freeze.
        if (mainScheme.target !== newTarget || mainScheme.baseTarget !== base) {
             setMainScheme(prev => ({ ...prev, baseTarget: base, target: newTarget }));
        }
    }

    // 2. Force Recalculate Villain Max HP
    if (villain.stages && villain.stages.length > 0) {
         const baseHp = villain.stages[villain.stageIdx] || 0;
         const newMax = baseHp * playerCount;
         
         if (villain.maxHp !== newMax) {
             setVillain(prev => ({
                 ...prev,
                 maxHp: newMax,
                 hp: (round === 1) ? newMax : prev.hp
             }));
         }
    }
  }, [playerCount, mainScheme.name, villain.name, villain.stageIdx]); 

  // Setup Popup Logic
  useEffect(() => { 
    if (villain && villain.name === "Setup Game") setShowSetup(true); 
  }, [villain.name]); 

  // Scheme Completion Logic
  useEffect(() => {
    if (mainScheme.target > 0 && mainScheme.threat >= mainScheme.target) {
      setShowSchemeComplete(true);
    } else {
      setShowSchemeComplete(false); // Auto-hide if condition clears
    }
  }, [mainScheme.threat, mainScheme.target]);

  const openSetup = () => { setSearchTerm(""); setShowSetup(true); };

  const resetGame = () => {
    setVillain({ name: "Setup Game", hp: 0, maxHp: 0, status: [], stages: [0,0,0], stageIdx: 0, set_code: "" });
    setHero({ name: "Select Hero", hp: 0, maxHp: 0, status: [] });
    setMainScheme({ name: "Select Main Scheme", threat: 0, target: 0, baseTarget: 0, accel: 0 });
    setUnits([]);
    setRound(1);
    setPlayerCount(1);
    setShowSchemeComplete(false);
  };

  const selectVillain = (v) => {
    const startHp = (v.stages[0] || 10) * playerCount;
    setVillain({ ...v, hp: startHp, maxHp: startHp, status: [], stageIdx: 0 });
    setSchemeSearch("");
    setShowSchemeSelect(true); 
  };

  const setStage = (idx) => { 
    if (!villain.stages) return; 
    setVillain(prev => ({ ...prev, stageIdx: idx })); // useEffect will catch this change and update HP
  };

  const selectScheme = (card) => {
    const base = card.target || 0;
    const finalTarget = base * playerCount;
    
    setMainScheme({ 
      name: card.name, 
      threat: card.init || 0, 
      target: finalTarget, 
      baseTarget: base, 
      accel: card.accel || 0, 
      fixed: card.fixed, 
      code: card.code 
    });
    setShowSchemeSelect(false);
    setShowSchemeComplete(false);
  };

  const modThreat = (n) => {
    if (n > 0) schemeControls.start('shake');
    setMainScheme(prev => ({ ...prev, threat: Math.max(0, prev.threat + n) }));
  };

  const modVillainHp = (n) => {
    if (n < 0) villainControls.start('shake');
    setVillain(p => ({ ...p, hp: Math.max(0, p.hp + n) }));
  };

  const modHeroHp = (n) => {
    if (n < 0) heroControls.start('shake');
    setHero(p => ({ ...p, hp: Math.max(0, p.hp + n) }));
  };

  const advanceGame = () => {
    modThreat(1 + mainScheme.accel);
    setRound(r => r + 1);
  };

  const toggleStatus = (setter, type) => setter(p => ({ ...p, status: p.status.includes(type) ? p.status.filter(s => s !== type) : [...p.status, type] }));
  
  const addUnit = (template, type) => {
    const startVal = type === 'side_scheme' ? (template.init || 0) : (template.hp || 0);
    setUnits(prev => [...prev, { ...template, id: Date.now(), val: startVal, max: startVal, type }]);
    setShowSummon(false);
  };
  
  const modUnitVal = (id, amount) => setUnits(prev => prev.map(u => { if (u.id !== id) return u; return { ...u, val: Math.max(0, u.val + amount) }; }));
  const restoreUnit = (id) => setUnits(prev => prev.map(u => { if (u.id !== id) return u; return { ...u, val: 1 }; }));
  const removeUnit = (id) => setUnits(prev => prev.filter(u => u.id !== id));
  
  const filteredHeroes = useMemo(() => (safeData.heroes || []).filter(h => h.name.toLowerCase().includes(searchTerm)), [searchTerm, safeData]);
  const filteredVillains = useMemo(() => (safeData.villains || []).filter(v => v.name.toLowerCase().includes(searchTerm)), [searchTerm, safeData]);
  const filteredSchemes = useMemo(() => {
    let list = safeData.schemes || [];
    if (schemeSearch) return list.filter(s => s.name.toLowerCase().includes(schemeSearch.toLowerCase())).slice(0, 50);
    if (villain.set_code) list = [...list].sort((a, b) => (a.set_code === villain.set_code ? -1 : 1));
    return list.slice(0, 50);
  }, [schemeSearch, villain.set_code, safeData]);

  const getFilteredList = (list) => {
    if (!list) return []; 
    let filtered = list.filter(item => item.name.toLowerCase().includes(summonTerm));
    if (!summonTerm && listSeed > 0) filtered = [...filtered].sort(() => Math.random() - 0.5);
    return filtered.slice(0, 20);
  };

  const sideSchemes = units.filter(u => u.type === 'side_scheme');
  const minions = units.filter(u => u.type === 'minion');
  const allies = units.filter(u => u.type === 'ally');

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans p-3 pb-24 max-w-xl mx-auto overflow-x-hidden relative selection:bg-red-500 selection:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[50%] bg-red-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
      </div>

      <header className="flex justify-between items-center mb-4 z-50 relative">
        <div><h1 className="text-xl font-black italic tracking-tighter text-white drop-shadow-xl">MARVEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">CHAMPIONS</span></h1></div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-bold text-gray-400 bg-gray-900/80 border border-white/10 px-2 py-1 rounded-lg font-mono shadow-inner">RND <span className="text-white">{round}</span></div>
          <button onClick={openSetup} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 border border-white/5 transition-colors shadow-lg"><Settings size={16} className="text-gray-400"/></button>
        </div>
      </header>

      {/* NEW: SCHEME COMPLETE ALERT */}
      <AnimatePresence>
        {showSchemeComplete && (
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-yellow-500" />
                <AlertTriangle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Scheme Completed!</h2>
                <p className="text-gray-400 text-sm mb-6">The main scheme has reached its target threat level.</p>
                <div className="flex flex-col gap-3">
                    <TactileButton onClick={() => { setShowSchemeComplete(false); setShowSchemeSelect(true); }} color="bg-yellow-600 hover:bg-yellow-500" className="w-full">SELECT NEXT STAGE</TactileButton>
                    <button onClick={() => setShowSchemeComplete(false)} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white py-2">Dismiss / Game Over</button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSetup && (
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-3">
            <div className="w-full max-w-lg w-[95%] h-[90vh] flex flex-col relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-black text-2xl text-white tracking-tight">SETUP</h2>
                <div className="flex gap-2">
                    <button onClick={resetGame} className="p-2 bg-red-900/30 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-900/50"><RefreshCw size={16} /></button>
                    <TactileButton onClick={() => setShowSetup(false)} color="bg-gradient-to-r from-green-600 to-green-500" size="small">START</TactileButton>
                </div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-xl border border-white/10 mb-4 backdrop-blur-sm">
                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Team Size</div>
                <div className="flex gap-2">{[1,2,3,4].map(n => <button key={n} onClick={()=>setPlayerCount(n)} className={`flex-1 py-2 rounded-lg font-black text-xs transition-all border ${playerCount===n ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black/40 border-transparent text-gray-600'}`}>{n}</button>)}</div>
              </div>
              
              <div className="flex gap-2 mb-4 p-1 bg-gray-900 rounded-lg border border-white/10">
                <button onClick={() => setSetupTab('heroes')} className={`flex-1 py-2 rounded-md text-xs font-black uppercase tracking-wider transition-all ${setupTab === 'heroes' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>HEROES</button>
                <button onClick={() => setSetupTab('villains')} className={`flex-1 py-2 rounded-md text-xs font-black uppercase tracking-wider transition-all ${setupTab === 'villains' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>VILLAINS</button>
              </div>

              <div className="relative mb-4"><Search size={16} className="absolute left-3 top-3 text-gray-500" /><input type="text" placeholder="Search..." value={searchTerm} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-base text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" onChange={e=>setSearchTerm(e.target.value.toLowerCase())}/></div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {setupTab === 'heroes' && (
                  <section><h3 className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sticky top-0 bg-black py-1 z-10 flex items-center gap-2"><Shield size={10}/> Heroes</h3><div className="grid grid-cols-2 gap-2">{filteredHeroes.map(h => <motion.button key={h.name} onClick={()=>setHero({ ...h, hp: h.hp, maxHp: h.hp, status: [] })} className={`p-3 rounded-lg text-left text-xs font-bold transition-all border relative overflow-hidden group ${hero.name===h.name ? 'border-blue-500 bg-blue-900/20 text-white' : 'border-white/5 bg-gray-900/40 text-gray-400'}`}>{h.name}</motion.button>)}</div></section>
                )}
                {setupTab === 'villains' && (
                  <section><h3 className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 sticky top-0 bg-black py-1 z-10 flex items-center gap-2"><Skull size={10}/> Villains</h3><div className="grid grid-cols-2 gap-2">{filteredVillains.map(v => <motion.button key={v.name} onClick={()=>selectVillain(v)} className={`p-3 rounded-lg text-left text-xs font-bold transition-all border relative overflow-hidden group ${villain.name===v.name ? 'border-red-500 bg-red-900/20 text-white' : 'border-white/5 bg-gray-900/40 text-gray-400'}`}>{v.name}</motion.button>)}</div></section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchemeSelect && (
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3">
            <div className="w-full max-w-lg w-[95%] h-[90vh] bg-gray-900 border border-gray-700 rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              <div className="flex justify-between items-center mb-4"><h2 className="font-black text-xl text-yellow-500 uppercase tracking-tighter">Main Scheme</h2><button onClick={()=>setShowSchemeSelect(false)}><X className="text-gray-400" size={18}/></button></div>
              <div className="relative mb-4"><Search size={16} className="absolute left-3 top-3 text-gray-500" /><input type="text" placeholder="Search..." className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-base text-white focus:border-yellow-500 focus:outline-none transition-colors" value={schemeSearch} onChange={e=>setSchemeSearch(e.target.value)}/></div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">{filteredSchemes.map(s => <motion.button key={s.code} onClick={()=>selectScheme(s)} className="w-full text-left p-3 bg-gray-800/50 rounded-lg border border-white/5 hover:bg-gray-700 hover:border-yellow-500/50 flex justify-between items-center group transition-all"><div><span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors block mb-0.5">{s.name}</span><div className="flex gap-2 text-[9px] text-gray-500 font-mono"><span className="bg-black/30 px-1 py-0.5 rounded">TGT: {s.fixed ? s.target : `${s.target}/p`}</span><span className="bg-black/30 px-1 py-0.5 rounded">ACC: {s.accel}</span></div></div><ChevronRight size={14} className="text-gray-600 group-hover:text-yellow-500" /></motion.button>)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 relative z-10">
        <motion.section animate={villainControls} variants={shakeVariant} className={`relative rounded-2xl overflow-hidden shadow-2xl border bg-gray-900 group min-h-[140px] flex flex-col justify-end transition-all duration-500 ${getStatusStyles(villain.status)}`}>
          {villain.code ? (<><div className="absolute inset-0 bg-red-900/20 mix-blend-multiply" /><img src={getCardImage(villain.code)} className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-60 mix-blend-overlay mask-gradient-b transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/80 to-transparent" /></>) : (<div className="absolute inset-0 bg-red-900/10 flex items-center justify-center mask-gradient-b"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"/><Skull size={80} className="text-red-900/20 opacity-50" /></div>)}
          <div className="relative z-10 p-3 pt-12">
            <div className="flex justify-between items-end mb-3">
              <div><h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-white drop-shadow-sm leading-none">{villain.name}</h2><div className="flex gap-1 mt-1.5">{[0, 1, 2].map((stage, idx) => <button key={stage} onClick={() => setStage(idx)} className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded border transition-all ${villain.stageIdx === idx ? 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/60 border-white/10 text-gray-500'}`}>{["I", "II", "III"][idx]}</button>)}</div></div>
              <div className="flex gap-1">{['stunned', 'confused', 'tough'].map(s => (<StatusToggle key={s} type={s} active={villain.status.includes(s)} onToggle={() => toggleStatus(setVillain, s)} />))}</div>
            </div>
            <StatDial label="Villain HP" value={villain.hp} max={villain.maxHp} onChange={(v) => modVillainHp(v)} icon={<Skull size={10} className="text-red-500"/>} />
          </div>
        </motion.section>

        <motion.section animate={schemeControls} variants={shakeVariant} className="relative">
          <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-red-500/50 to-yellow-500/50" />
          <div className="bg-gray-900/80 border border-yellow-500/30 rounded-xl p-1 shadow-[0_0_20px_rgba(234,179,8,0.1)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5 cursor-pointer group" onClick={() => { setSchemeSearch(""); setShowSchemeSelect(true); }}><h3 className="text-yellow-400 font-bold text-sm leading-tight truncate group-hover:text-white transition-colors">{mainScheme.name}</h3><Settings size={12} className="text-yellow-600 group-hover:text-yellow-400 transition-colors" /></div><div className="flex gap-2 text-[9px] uppercase font-bold tracking-widest text-gray-500"><span className="flex items-center gap-1"><Crosshair size={8}/> <span className="text-white">{mainScheme.target > 0 ? mainScheme.target : '?'}</span></span><span className="flex items-center gap-1"><Activity size={8}/> <span className="text-white">+{mainScheme.accel}</span></span></div></div>
              <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5"><TactileButton onClick={() => modThreat(-1)} color="bg-gray-800 hover:bg-gray-700" className="w-8 h-8 !rounded-md !p-0"><Minus size={14}/></TactileButton><span className="text-xl font-black text-yellow-500 w-8 text-center tabular-nums">{mainScheme.threat}</span><TactileButton onClick={() => modThreat(1)} color="bg-gray-800 hover:bg-gray-700" className="w-8 h-8 !rounded-md !p-0"><Plus size={14}/></TactileButton></div>
            </div>
          </div>
        </motion.section>

        {(sideSchemes.length > 0 || minions.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>{sideSchemes.map(u => <UnitCard key={u.id} unit={u} type="side_scheme" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}{minions.map(u => <UnitCard key={u.id} unit={u} type="minion" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}</AnimatePresence>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 relative">
          <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-12 h-[1px] bg-blue-500/50 blur-[1px]" />
          {allies.length > 0 && <div className="grid grid-cols-3 gap-2 mb-3">{allies.map(u => <UnitCard key={u.id} unit={u} type="ally" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}</div>}
          <motion.section animate={heroControls} variants={shakeVariant} className={`relative rounded-2xl overflow-hidden shadow-2xl border bg-gray-900 min-h-[140px] flex flex-col justify-end p-3 transition-all duration-500 ${getStatusStyles(hero.status)}`}>
            {hero.code ? (<><div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" /><img src={getCardImage(hero.code)} className="absolute inset-0 w-full h-full object-cover object-[center_20%] opacity-50 mix-blend-overlay mask-gradient-t" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" /></>) : (<div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center mask-gradient-t"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"/><Shield size={80} className="text-blue-900/20 opacity-50" /></div>)}
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2"><div><h2 className="text-xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-white leading-none">{hero.name}</h2></div><div className="flex gap-1">{['stunned', 'confused', 'tough'].map(s => (<StatusToggle key={s} type={s} active={hero.status.includes(s)} onToggle={() => toggleStatus(setHero, s)} />))}</div></div>
              <StatDial label="Hero HP" value={hero.hp} max={hero.maxHp} onChange={(v) => modHeroHp(v)} icon={<Shield size={10} className="text-blue-400"/>} />
            </div>
          </motion.section>
        </div>
      </div>

      {/* SUMMON DRAWER */}
      <AnimatePresence>
        {showSummon && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-[90] w-full max-w-xl mx-auto bg-[#0a0a0f] border-t border-white/10 rounded-t-2xl p-4 h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4"><h2 className="font-black text-xl text-white">REINFORCEMENTS</h2><button onClick={()=>setShowSummon(false)} className="p-1 bg-gray-800 rounded-full"><X className="text-gray-400" size={18}/></button></div>
            <div className="flex gap-2 mb-4 p-1 bg-gray-900 rounded-lg">{['minions','allies','schemes'].map(t => <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab===t ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>)}</div>
            <div className="flex gap-2 mb-4"><div className="flex-1 bg-black/50 border border-white/10 rounded-lg flex items-center px-3 transition-colors focus-within:border-blue-500/50"><Search size={16} className="text-gray-500 mr-2"/><input className="bg-transparent outline-none w-full text-white py-3 text-base placeholder-gray-600" placeholder="Search cards..." onChange={e=>setSummonTerm(e.target.value.toLowerCase())}/></div><button onClick={()=>setListSeed(Math.random())} className="bg-gray-800 w-12 rounded-lg border border-white/10 flex items-center justify-center hover:bg-gray-700"><Dice5 size={20} className="text-blue-400"/></button></div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {getFilteredList(activeTab === 'minions' ? safeData.minions : activeTab === 'allies' ? safeData.allies : safeData.side_schemes).map((u, i) => (
                <motion.button key={u.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} custom={i} onClick={()=>addUnit(u, activeTab === 'minions' ? 'minion' : activeTab === 'allies' ? 'ally' : 'side_scheme')} className={`w-full text-left p-3 bg-gray-800/40 rounded-lg border-l-4 ${activeTab === 'minions' ? 'border-orange-500' : activeTab === 'allies' ? 'border-blue-500' : 'border-yellow-500'} hover:bg-gray-800 transition-colors flex justify-between`}>
                  <span className="font-bold text-sm">{u.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono bg-black/40 px-1.5 py-0.5 rounded">{activeTab === 'side_scheme' ? `INIT: ${u.init}` : `HP: ${u.hp}`}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}