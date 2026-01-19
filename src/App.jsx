import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Shield, Zap, Skull, Brain, Plus, Minus, ArrowRightCircle, Settings, X, 
  BookOpen, Search, Dice5, ChevronRight, AlertTriangle, 
  AlertOctagon, Flame, Activity, RotateCcw, Check, Menu, Crosshair, Hexagon
} from 'lucide-react';
import marvelData from './marvel_data.json';

const getCardImage = (code) => `https://marvelcdb.com/bundles/cards/${code}.png`;

// --- ANIMATIONS (Turbo Mode) ---
const modalVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15, ease: "circOut" } },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.02, duration: 0.2 } })
};

const shakeVariant = {
  shake: { x: [0, -3, 3, -3, 3, 0], transition: { duration: 0.2 } },
  idle: { x: 0 }
};

// --- UI COMPONENTS ---

const TactileButton = ({ onClick, children, color = "bg-blue-600", className, disabled, size="normal" }) => (
  <motion.button 
    whileHover={!disabled ? { scale: 1.02, brightness: 1.1 } : {}} 
    whileTap={!disabled ? { scale: 0.96 } : {}} 
    onClick={onClick} 
    disabled={disabled} 
    className={`
      ${disabled ? 'bg-gray-800/50 opacity-50 cursor-not-allowed' : color} 
      ${className} 
      relative overflow-hidden font-bold rounded-xl shadow-lg border border-white/10
      flex items-center justify-center gap-2 select-none transition-all backdrop-blur-md
      ${size === 'small' ? 'py-1.5 px-3 text-xs' : 'py-3 px-6'}
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
    className={`text-5xl font-black ${color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tabular-nums tracking-tighter`}
  >
    {value}
  </motion.div>
);

// The Classic "Stark Tech" Dial (Restored)
const StatDial = ({ value, label, color, onChange, icon }) => (
  <div className="relative group/dial">
    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
    <div className="flex flex-col items-center p-3 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl relative z-10">
      <div className="flex items-center gap-2 mb-1 opacity-70">
        {icon}
        <h3 className="text-gray-400 uppercase tracking-[0.2em] text-[9px] font-bold">{label}</h3>
      </div>
      <div className="flex items-center justify-between w-full gap-4 px-2">
        <TactileButton onClick={() => onChange(-1)} color="bg-gray-800 hover:bg-gray-700" className="w-12 h-12 !rounded-xl !p-0 border border-white/10"><Minus size={20} /></TactileButton>
        <AnimatedNumber value={value} color={color} />
        <TactileButton onClick={() => onChange(1)} color="bg-gray-800 hover:bg-gray-700" className="w-12 h-12 !rounded-xl !p-0 border border-white/10"><Plus size={20} /></TactileButton>
      </div>
    </div>
  </div>
);

const UnitCard = ({ unit, type, onDamage, onDefeat, onRestore }) => {
  const isZero = unit.val <= 0;
  const isScheme = type === 'side_scheme';
  const isAlly = type === 'ally';
  const icons = unit.icons || [];
  const [imgError, setImgError] = useState(false);

  // Compact styles for 3-column layout
  const styles = isScheme 
    ? { border: "border-yellow-500/30", bg: "bg-yellow-900/20", text: "text-yellow-100", glow: "shadow-yellow-900/10" }
    : isAlly 
      ? { border: "border-blue-500/30", bg: "bg-blue-900/20", text: "text-blue-100", glow: "shadow-blue-900/10" }
      : { border: "border-orange-500/30", bg: "bg-orange-900/20", text: "text-orange-100", glow: "shadow-orange-900/10" };

  return (
    <motion.div 
      layout 
      initial={{ scale: 0.9, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      exit={{ scale: 0.8, opacity: 0 }} 
      className={`relative overflow-hidden rounded-xl border ${styles.border} ${styles.bg} flex flex-col justify-between shadow-lg ${styles.glow} h-32 backdrop-blur-md group`}
    >
      {/* Image with Fallback Pattern */}
      {unit.code && !imgError ? (
        <>
          <img src={getCardImage(unit.code)} onError={() => setImgError(true)} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay pointer-events-none transition-transform group-hover:scale-110 duration-700" alt="" />
          <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent`} />
        </>
      ) : (
        <div className={`absolute inset-0 opacity-10 ${styles.bg} flex items-center justify-center overflow-hidden`}>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-50"></div>
           <Hexagon size={48} className="text-white/20 rotate-12" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start relative z-10 p-2">
        <div className="flex-1 pr-1">
          <span className={`font-black text-[10px] uppercase tracking-wide leading-tight line-clamp-2 ${styles.text} drop-shadow-md`}>{unit.name}</span>
          {icons.length > 0 && (
            <div className="flex gap-1 mt-1">
              {icons.includes('crisis') && <AlertOctagon size={10} className="text-red-500 animate-pulse" fill="currentColor" />}
              {icons.includes('hazard') && <Flame size={10} className="text-orange-500" fill="currentColor" />}
              {icons.includes('acceleration') && <Activity size={10} className="text-yellow-500" />}
            </div>
          )}
        </div>
        <button onClick={() => onDefeat(unit.id)} className="text-white/30 hover:text-white bg-black/40 hover:bg-red-600/80 rounded-md p-1 transition-colors backdrop-blur-sm"><X size={12} /></button>
      </div>

      {/* Controls */}
      <div className="p-2 relative z-10">
        <div className="flex items-center justify-between bg-black/60 backdrop-blur-xl rounded-lg p-0.5 border border-white/10">
          <button onClick={() => onDamage(unit.id, -1)} className="p-2 text-gray-400 hover:text-white active:scale-90 transition-transform"><Minus size={12}/></button>
          <span className={`text-lg font-black ${isZero ? 'text-red-500 animate-pulse' : 'text-white'}`}>{unit.val}</span>
          <button onClick={() => onDamage(unit.id, 1)} className="p-2 text-gray-400 hover:text-white active:scale-90 transition-transform"><Plus size={12}/></button>
        </div>
      </div>

      {/* Defeated Overlay */}
      {isZero && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center backdrop-blur-md gap-2">
          <div className="flex gap-2">
            <button onClick={() => onRestore(unit.id)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg border border-gray-500 hover:scale-110 transition-transform"><RotateCcw size={16} /></button>
            <button onClick={() => onDefeat(unit.id)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg border border-red-400 hover:scale-110 transition-transform"><Check size={16} /></button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// FIX: Added 'group/btn' to isolate hover
const StatusToggle = ({ type, active, onToggle }) => {
  const config = { 
    stunned: { color: "bg-green-500", icon: <Zap size={14} fill="currentColor" /> }, 
    confused: { color: "bg-purple-500", icon: <Brain size={14} fill="currentColor" /> }, 
    tough: { color: "bg-yellow-500", icon: <Shield size={14} fill="currentColor" /> } 
  };
  const { color, icon } = config[type];
  
  return (
    <motion.button 
      onClick={onToggle} 
      animate={{ 
        scale: active ? 1 : 0.9, 
        opacity: active ? 1 : 0.3,
        filter: active ? 'grayscale(0%)' : 'grayscale(100%)'
      }}
      whileTap={{ scale: 0.85 }}
      className={`p-2 rounded-lg text-white shadow-md border border-white/20 ${active ? color : 'bg-gray-800'} transition-all relative overflow-hidden group/btn`}
    >
      <div className={`absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300`} />
      {icon}
    </motion.button>
  );
};

export default function App() {
  const [villain, setVillain] = useState({ name: "Setup Game", hp: 0, maxHp: 0, status: [], stages: [0,0,0], stageIdx: 0, set_code: "" });
  const [hero, setHero] = useState({ name: "Select Hero", hp: 0, maxHp: 0, status: [] });
  const [mainScheme, setMainScheme] = useState({ name: "Select Main Scheme", threat: 0, target: 0, accel: 0 });
  
  const [units, setUnits] = useState([]); 
  const [round, setRound] = useState(1);
  const [playerCount, setPlayerCount] = useState(1);
  const [showSetup, setShowSetup] = useState(true);
  const [showSummon, setShowSummon] = useState(false);
  const [showSchemeSelect, setShowSchemeSelect] = useState(false); 
  const [schemeSearch, setSchemeSearch] = useState("");
  const [activeTab, setActiveTab] = useState('minions');
  const [searchTerm, setSearchTerm] = useState("");
  const [summonTerm, setSummonTerm] = useState("");
  const [listSeed, setListSeed] = useState(0);

  // Animation Controls
  const villainControls = useAnimation();
  const heroControls = useAnimation();
  const schemeControls = useAnimation();

  // --- LOGIC ---
  const openSetup = () => { setSearchTerm(""); setShowSetup(true); };

  const selectVillain = (v) => {
    const startHp = (v.stages[0] || 10) * playerCount;
    setVillain({ ...v, hp: startHp, maxHp: startHp, status: [], stageIdx: 0 });
    setSchemeSearch("");
    setShowSchemeSelect(true); 
  };

  const setStage = (idx) => { 
    if (!villain.stages) return; 
    const newHp = (villain.stages[idx] || 10) * playerCount; 
    setVillain(prev => ({ ...prev, hp: newHp, maxHp: newHp, stageIdx: idx })); 
  };

  const selectScheme = (card) => {
    let targetVal = card.target;
    if (!card.fixed && targetVal > 0) targetVal = targetVal * playerCount;
    setMainScheme({ name: card.name, threat: card.init, target: targetVal, accel: card.accel || 0, fixed: card.fixed, code: card.code });
    setShowSchemeSelect(false);
  };

  const modThreat = (n) => {
    if (n > 0) schemeControls.start('shake');
    setMainScheme(prev => {
      const newThreat = Math.max(0, prev.threat + n);
      return { ...prev, threat: newThreat };
    });
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
    if (mainScheme.target > 0 && mainScheme.threat + 1 + mainScheme.accel >= mainScheme.target) {
        setSchemeSearch(""); 
        setShowSchemeSelect(true); 
    } else {
        modThreat(1 + mainScheme.accel);
        setRound(r => r + 1);
    }
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
  
  const getFilteredList = (list) => {
    let filtered = list.filter(item => item.name.toLowerCase().includes(summonTerm));
    if (!summonTerm && listSeed > 0) filtered = [...filtered].sort(() => Math.random() - 0.5);
    return filtered.slice(0, 20);
  };

  const getSchemes = () => {
    let list = marvelData.schemes;
    if (schemeSearch) list = list.filter(s => s.name.toLowerCase().includes(schemeSearch.toLowerCase()));
    else if (villain.set_code) {
        list = [...list].sort((a, b) => {
            const aMatch = a.set_code === villain.set_code;
            const bMatch = b.set_code === villain.set_code;
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return (a.code || "").localeCompare(b.code || "");
        });
    }
    return list.slice(0, 50);
  };

  const sideSchemes = units.filter(u => u.type === 'side_scheme');
  const minions = units.filter(u => u.type === 'minion');
  const allies = units.filter(u => u.type === 'ally');

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans p-4 pb-32 max-w-xl mx-auto overflow-x-hidden relative selection:bg-red-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[50%] bg-red-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
      </div>

      <header className="flex justify-between items-center mb-8 z-50 relative">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-xl">
            MARVEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">CHAMPIONS</span>
          </h1>
          <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Tactical Interface</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-gray-400 bg-gray-900/80 border border-white/10 px-3 py-1.5 rounded-lg font-mono shadow-inner">
            RND <span className="text-white">{round}</span>
          </div>
          <button onClick={openSetup} className="p-2.5 bg-gray-800 rounded-xl hover:bg-gray-700 border border-white/5 transition-colors shadow-lg"><Settings size={18} className="text-gray-400"/></button>
        </div>
      </header>

      {/* SETUP & SCHEME MODALS */}
      <AnimatePresence>
        {showSetup && (
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md h-[90vh] flex flex-col relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-3xl text-white tracking-tight">SETUP</h2>
                <TactileButton onClick={() => setShowSetup(false)} color="bg-gradient-to-r from-green-600 to-green-500" size="small" className="!rounded-full shadow-green-900/50 shadow-lg">START MISSION</TactileButton>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-2xl border border-white/10 mb-6 backdrop-blur-sm">
                <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Team Size</div>
                <div className="flex gap-2">{[1,2,3,4].map(n => <button key={n} onClick={()=>setPlayerCount(n)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all border ${playerCount===n ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-black/40 border-transparent text-gray-600'}`}>{n}</button>)}</div>
              </div>
              <div className="relative mb-6"><Search size={18} className="absolute left-4 top-4 text-gray-500" /><input type="text" placeholder="Search Database..." value={searchTerm} className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none transition-colors" onChange={e=>setSearchTerm(e.target.value.toLowerCase())}/></div>
              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                <section><h3 className="text-blue-500 text-xs font-black uppercase tracking-[0.2em] mb-3 sticky top-0 bg-black py-2 z-10 flex items-center gap-2"><Shield size={12}/> Heroes</h3><div className="grid grid-cols-2 gap-2">{marvelData.heroes.filter(h=>h.name.toLowerCase().includes(searchTerm)).map((h, i) => <motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={h.name} onClick={()=>setHero({...h, status:[]})} className={`p-4 rounded-xl text-left text-xs font-bold transition-all border relative overflow-hidden group ${hero.name===h.name ? 'border-blue-500 bg-blue-900/20 text-white' : 'border-white/5 bg-gray-900/40 text-gray-400'}`}>{h.name}</motion.button>)}</div></section>
                <section><h3 className="text-red-500 text-xs font-black uppercase tracking-[0.2em] mb-3 sticky top-0 bg-black py-2 z-10 flex items-center gap-2"><Skull size={12}/> Villains</h3><div className="grid grid-cols-2 gap-2">{marvelData.villains.filter(v=>v.name.toLowerCase().includes(searchTerm)).map((v, i) => <motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={v.name} onClick={()=>selectVillain(v)} className={`p-4 rounded-xl text-left text-xs font-bold transition-all border relative overflow-hidden group ${villain.name===v.name ? 'border-red-500 bg-red-900/20 text-white' : 'border-white/5 bg-gray-900/40 text-gray-400'}`}>{v.name}</motion.button>)}</div></section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchemeSelect && (
          <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg h-[80vh] bg-gray-900 border border-gray-700 rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 to-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
              <div className="flex justify-between items-center mb-6"><h2 className="font-black text-2xl text-yellow-500 uppercase tracking-tighter">Main Scheme</h2><button onClick={()=>setShowSchemeSelect(false)}><X className="text-gray-400"/></button></div>
              <div className="relative mb-4"><Search size={18} className="absolute left-4 top-3.5 text-gray-500" /><input type="text" autoFocus placeholder="Search Schemes..." className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-yellow-500 focus:outline-none transition-colors" value={schemeSearch} onChange={e=>setSchemeSearch(e.target.value)}/></div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">{getSchemes().map((s, i) => <motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={s.code} onClick={()=>selectScheme(s)} className="w-full text-left p-4 bg-gray-800/50 rounded-xl border border-white/5 hover:bg-gray-700 hover:border-yellow-500/50 flex justify-between items-center group transition-all"><div><span className="font-bold text-white group-hover:text-yellow-400 transition-colors block mb-1">{s.name}</span><div className="flex gap-2 text-[10px] text-gray-500 font-mono"><span className="bg-black/30 px-1.5 py-0.5 rounded">TGT: {s.fixed ? s.target : `${s.target}/p`}</span><span className="bg-black/30 px-1.5 py-0.5 rounded">ACC: {s.accel}</span></div></div><ChevronRight size={16} className="text-gray-600 group-hover:text-yellow-500" /></motion.button>)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-8 relative z-10">
        
        {/* VILLAIN SECTION */}
        <motion.section 
          animate={villainControls}
          variants={shakeVariant}
          className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-red-500/30 bg-gray-900 group"
        >
          {/* FALLBACK IMAGE LOGIC */}
          {villain.code ? (
            <>
              <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply" />
              <img src={getCardImage(villain.code)} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay mask-gradient-b transition-transform duration-[20s] ease-linear scale-100 group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/80 to-transparent" />
            </>
          ) : (
             <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center mask-gradient-b"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"/><Skull size={120} className="text-red-900/20 opacity-50" /></div>
          )}
          
          <div className="relative z-10 p-6 pt-24">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-white drop-shadow-sm leading-[0.9]">{villain.name}</h2>
                <div className="flex gap-1 mt-3">
                  {[0, 1, 2].map((stage, idx) => (
                    <button key={stage} onClick={() => setStage(idx)} className={`text-[10px] font-black tracking-wider px-3 py-1 rounded-md border transition-all ${villain.stageIdx === idx ? 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-black/60 border-white/10 text-gray-500 hover:text-white'}`}>STAGE {["I", "II", "III"][idx]}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {['stunned', 'confused', 'tough'].map(s => (<StatusToggle key={s} type={s} active={villain.status.includes(s)} onToggle={() => toggleStatus(setVillain, s)} />))}
              </div>
            </div>
            <StatDial label="Villain Hit Points" value={villain.hp} color="text-red-500" onChange={(v) => modVillainHp(v)} icon={<Skull size={14} className="text-red-500"/>} />
          </div>
        </motion.section>

        {/* SCHEME SECTION */}
        <motion.section animate={schemeControls} variants={shakeVariant} className="relative">
          <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-red-500/50 to-yellow-500/50" />
          <div className="bg-gray-900/80 border border-yellow-500/30 rounded-[2rem] p-1 shadow-[0_0_30px_rgba(234,179,8,0.1)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 cursor-pointer group" onClick={() => { setSchemeSearch(""); setShowSchemeSelect(true); }}>
                  <h3 className="text-yellow-400 font-bold text-lg leading-tight truncate group-hover:text-white transition-colors">{mainScheme.name}</h3>
                  <Settings size={14} className="text-yellow-600 group-hover:text-yellow-400 transition-colors" />
                </div>
                <div className="flex gap-3 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  <span className="flex items-center gap-1"><Crosshair size={10}/> Target: <span className="text-white">{mainScheme.target > 0 ? mainScheme.target : '?'}</span></span>
                  <span className="flex items-center gap-1"><Activity size={10}/> Accel: <span className="text-white">+{mainScheme.accel}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-1.5 border border-white/5">
                <TactileButton onClick={() => modThreat(-1)} color="bg-gray-800 hover:bg-gray-700" className="w-10 h-10 !rounded-xl !p-0"><Minus size={18}/></TactileButton>
                <span className="text-3xl font-black text-yellow-500 w-12 text-center tabular-nums">{mainScheme.threat}</span>
                <TactileButton onClick={() => modThreat(1)} color="bg-gray-800 hover:bg-gray-700" className="w-10 h-10 !rounded-xl !p-0"><Plus size={18}/></TactileButton>
              </div>
            </div>
          </div>
        </motion.section>

        {/* REINFORCEMENTS GRID - 3 COLUMNS */}
        {(sideSchemes.length > 0 || minions.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>
              {sideSchemes.map(u => <UnitCard key={u.id} unit={u} type="side_scheme" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}
              {minions.map(u => <UnitCard key={u.id} unit={u} type="minion" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}
            </AnimatePresence>
          </div>
        )}

        {/* HERO SECTION */}
        <div className="pt-8 border-t border-white/10 relative">
          <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-24 h-[2px] bg-blue-500/50 blur-[2px]" />
          
          {allies.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-6">
              {allies.map(u => <UnitCard key={u.id} unit={u} type="ally" onDamage={modUnitVal} onDefeat={removeUnit} onRestore={restoreUnit} />)}
            </div>
          )}

          <motion.section 
            animate={heroControls}
            variants={shakeVariant}
            className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-blue-500/30 bg-gray-900 min-h-[240px] flex flex-col justify-end p-6"
          >
            {/* FALLBACK IMAGE LOGIC */}
            {hero.code ? (
              <>
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
                <img src={getCardImage(hero.code)} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay mask-gradient-t" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
              </>
            ) : (
               <div className="absolute inset-0 bg-blue-900/10 flex items-center justify-center mask-gradient-t"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"/><Shield size={120} className="text-blue-900/20 opacity-50" /></div>
            )}
            
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-white">{hero.name}</h2>
                <div className="flex gap-2">
                  {['stunned', 'confused', 'tough'].map(s => (<StatusToggle key={s} type={s} active={hero.status.includes(s)} onToggle={() => toggleStatus(setHero, s)} />))}
                </div>
              </div>
              <StatDial label="Hero Hit Points" value={hero.hp} color="text-blue-400" onChange={(v) => modHeroHp(v)} icon={<Shield size={14} className="text-blue-400"/>} />
            </div>
          </motion.section>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50 flex gap-4 justify-center items-end bg-gradient-to-t from-[#050508] via-[#050508]/95 to-transparent h-32">
        <TactileButton onClick={() => setShowSummon(true)} className="pointer-events-auto !rounded-2xl w-14 h-14 !p-0 bg-gray-800 border-white/20 shadow-xl"><BookOpen size={24} className="text-blue-400" /></TactileButton>
        <TactileButton 
          onClick={advanceGame} 
          color="bg-gradient-to-r from-red-600 to-red-500" 
          className="pointer-events-auto flex-1 max-w-sm !rounded-2xl shadow-red-900/40 shadow-xl border-red-400/30 group"
        >
          <div className="flex flex-col items-start">
            <span className="text-red-200/60 text-[10px] font-bold uppercase tracking-widest">End Phase</span>
            <span className="text-lg font-black uppercase flex items-center gap-2">Advance Round <ArrowRightCircle className="group-hover:translate-x-1 transition-transform"/></span>
          </div>
        </TactileButton>
      </div>

      {/* SUMMON DRAWER */}
      <AnimatePresence>
        {showSummon && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl z-[90] bg-[#0a0a0f] border-t border-white/10 rounded-t-[2rem] p-6 h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h2 className="font-black text-2xl text-white">REINFORCEMENTS</h2><button onClick={()=>setShowSummon(false)} className="p-2 bg-gray-800 rounded-full"><X className="text-gray-400"/></button></div>
            <div className="flex gap-2 mb-6 p-1 bg-gray-900 rounded-xl">{['minions','allies','schemes'].map(t => <button key={t} onClick={()=>setActiveTab(t)} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab===t ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>)}</div>
            <div className="flex gap-2 mb-4"><div className="flex-1 bg-black/50 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-blue-500/50"><Search size={18} className="text-gray-500 mr-3"/><input className="bg-transparent outline-none w-full text-white py-4 placeholder-gray-600" placeholder="Search cards..." onChange={e=>setSummonTerm(e.target.value.toLowerCase())}/></div><button onClick={()=>setListSeed(Math.random())} className="bg-gray-800 w-14 rounded-xl border border-white/10 flex items-center justify-center hover:bg-gray-700"><Dice5 size={22} className="text-blue-400"/></button></div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {activeTab==='minions' && getFilteredList(marvelData.minions).map((m,i)=><motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={m.name} onClick={()=>addUnit(m,'minion')} className="w-full text-left p-4 bg-gray-800/40 rounded-xl border-l-4 border-orange-500 hover:bg-gray-800 transition-colors flex justify-between"><span className="font-bold">{m.name}</span><span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">HP: {m.hp}</span></motion.button>)}
              {activeTab==='allies' && getFilteredList(marvelData.allies).map((a,i)=><motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={a.name} onClick={()=>addUnit(a,'ally')} className="w-full text-left p-4 bg-gray-800/40 rounded-xl border-l-4 border-blue-500 hover:bg-gray-800 transition-colors flex justify-between"><span className="font-bold">{a.name}</span><span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">HP: {a.hp}</span></motion.button>)}
              {activeTab==='schemes' && getFilteredList(marvelData.side_schemes).map((s,i)=><motion.button custom={i} variants={cardVariants} initial="hidden" animate="visible" key={s.name} onClick={()=>addUnit(s,'side_scheme')} className="w-full text-left p-4 bg-gray-800/40 rounded-xl border-l-4 border-yellow-500 hover:bg-gray-800 transition-colors flex justify-between"><span className="font-bold">{s.name}</span><span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">INIT: {s.init}</span></motion.button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}