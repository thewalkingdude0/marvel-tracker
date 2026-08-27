import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useAnimation, useReducedMotion } from 'framer-motion';
import {
  AlertOctagon,
  Brain,
  Minus,
  Plus,
  RefreshCw,
  Shield,
  Skull,
  Trash2,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'mc_simple_board_v2';

const freshBoard = () => ({
  villainHp: 0,
  heroHp: 0,
  villainStatuses: [],
  heroStatuses: [],
  mainThreat: 0,
  sideSchemes: [],
});

const loadBoard = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...freshBoard(), ...saved } : freshBoard();
  } catch {
    return freshBoard();
  }
};

function TactileButton({ children, onClick, className = '', label }) {
  const press = () => {
    navigator.vibrate?.(8);
    onClick?.();
  };

  return (
    <Motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.94 }}
      onClick={press}
      className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gray-800 font-bold shadow-lg transition-colors hover:bg-gray-700 ${className}`}
    >
      <span className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Motion.button>
  );
}

function EditableNumber({ value, label, onCommit, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = Math.max(0, Number.parseInt(draft, 10) || 0);
    onCommit(next);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        min="0"
        aria-label={`Set ${label}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') setEditing(false);
        }}
        className={`w-20 border-0 bg-transparent text-center font-black outline-none tabular-nums ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${label}: ${value}. Tap to enter an exact value.`}
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      className={`w-20 rounded-lg text-center font-black outline-none tabular-nums transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/50 ${className}`}
    >
      {value}
    </button>
  );
}

const STATUS_TYPES = ['stunned', 'confused', 'tough'];

const getStatusStyles = (statuses) => {
  if (!statuses || !Array.isArray(statuses)) return 'border-white/10';
  if (statuses.includes('stunned')) return 'grayscale contrast-125 border-green-500/80 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
  if (statuses.includes('confused')) return 'backdrop-blur-sm border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
  if (statuses.includes('tough')) return 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] brightness-110';
  return 'border-white/10';
};

function StatusToggle({ type, active, onToggle }) {
  const config = {
    stunned: { color: 'bg-green-500', icon: <Zap size={12} fill="currentColor" /> },
    confused: { color: 'bg-purple-500', icon: <Brain size={12} fill="currentColor" /> },
    tough: { color: 'bg-yellow-500', icon: <Shield size={12} fill="currentColor" /> },
  };
  const { color, icon } = config[type];
  return (
    <Motion.button
      type="button"
      aria-label={`${active ? 'Remove' : 'Apply'} ${type}`}
      aria-pressed={active}
      animate={{
        scale: active ? 1 : 0.9,
        opacity: active ? 1 : 0.3,
        filter: active ? 'grayscale(0%)' : 'grayscale(100%)',
      }}
      whileTap={{ scale: 0.85 }}
      onClick={onToggle}
      className={`group/btn relative overflow-hidden rounded-md border border-white/20 p-1.5 text-white shadow-md transition-all ${active ? color : 'bg-gray-800'}`}
    >
      <span className="absolute inset-0 translate-y-full bg-white/20 transition-transform duration-300 group-hover/btn:translate-y-0" />
      <span className="relative z-10">{icon}</span>
    </Motion.button>
  );
}

function HealthDial({ value, label, onChange, tone, icon }) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-gray-900/80 p-2 shadow-2xl backdrop-blur-xl">
      <div className="mb-1 flex items-center justify-center gap-1.5 opacity-70">
        {icon}
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-3 px-1">
        <TactileButton label={`Remove one ${label}`} onClick={() => onChange(-1)} className="h-10 w-10 !p-0">
          <Minus size={16} />
        </TactileButton>
        <Motion.div
          key={value}
          initial={{ scale: 1.28, y: -2, filter: 'blur(3px)' }}
          animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 430, damping: 22 }}
        >
          <EditableNumber value={value} label={label} onCommit={(next) => onChange(next - value)} className={`text-4xl ${tone}`} />
        </Motion.div>
        <TactileButton label={`Add one ${label}`} onClick={() => onChange(1)} className="h-10 w-10 !p-0">
          <Plus size={16} />
        </TactileButton>
      </div>
    </div>
  );
}

function CharacterPanel({ type, hp, statuses, onHpChange, onStatusToggle }) {
  const villain = type === 'villain';
  const name = villain ? 'Villain' : 'Hero';
  const controls = useAnimation();
  const reduceMotion = useReducedMotion();
  const previousHp = useRef(hp);

  useEffect(() => {
    const previous = previousHp.current;
    previousHp.current = hp;
    if (previous === hp || reduceMotion) return;

    if (hp < previous) {
      controls.start({
        x: [0, -7, 6, -4, 3, 0],
        scale: [1, 0.985, 1.006, 1],
        transition: { duration: 0.34 },
      });
    } else {
      controls.start({
        y: [0, -3, 0],
        scale: [1, 1.018, 1],
        transition: { duration: 0.38 },
      });
    }
  }, [controls, hp, reduceMotion]);

  return (
    <Motion.section
      animate={controls}
      className={`relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-2xl border bg-gray-900 p-3 shadow-2xl transition-all duration-500 ${
        villain
          ? 'border-red-500/20 bg-gradient-to-br from-[#211923] to-[#131622]'
          : 'border-blue-500/20 bg-gradient-to-br from-[#111c30] to-[#111827]'
      } ${getStatusStyles(statuses)}`}
    >
      <div className={`pointer-events-none absolute inset-0 flex items-center justify-center ${villain ? 'text-red-900/20' : 'text-blue-900/20'}`}>
        {villain ? <Skull size={82} strokeWidth={1.3} /> : <Shield size={82} strokeWidth={1.3} />}
      </div>

      <div className="relative z-10">
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2 className={`text-2xl font-black uppercase leading-none ${villain ? 'text-red-400' : 'text-blue-300'}`}>{name}</h2>
          <div className="flex gap-1">
            {STATUS_TYPES.map((status) => (
              <StatusToggle
                key={status}
                type={status}
                active={statuses.includes(status)}
                onToggle={() => onStatusToggle(status)}
              />
            ))}
          </div>
        </div>
        <HealthDial
          value={hp}
          label={`${name} HP`}
          onChange={onHpChange}
          tone="text-white"
          icon={villain ? <Skull size={10} className="text-red-500" /> : <Shield size={10} className="text-blue-400" />}
        />
      </div>
    </Motion.section>
  );
}

function ThreatControl({ value, label, onChange, tone = 'text-yellow-400' }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/40 p-1">
      <TactileButton label={`Remove one threat from ${label}`} onClick={() => onChange(-1)} className="h-8 w-8 !p-0">
        <Minus size={14} />
      </TactileButton>
      <Motion.div
        key={value}
        initial={{ scale: 1.45, rotate: value % 2 ? -3 : 3, color: '#fff' }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      >
        <EditableNumber value={value} label={`${label} threat`} onCommit={(next) => onChange(next - value)} className={`!w-10 text-xl ${tone}`} />
      </Motion.div>
      <TactileButton label={`Add one threat to ${label}`} onClick={() => onChange(1)} className="h-8 w-8 !p-0">
        <Plus size={14} />
      </TactileButton>
    </div>
  );
}

function SideSchemeCard({ scheme, onRename, onThreatChange, onRemove }) {
  const player = scheme.owner === 'player';
  return (
    <Motion.article
      layout
      initial={{ opacity: 0, scale: 0.9, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, rotate: -2 }}
      transition={{ type: 'spring', stiffness: 380, damping: 25 }}
      className={`relative overflow-hidden rounded-xl border p-2.5 shadow-lg ${
        player
          ? 'border-blue-500/30 bg-blue-950/30'
          : 'border-yellow-500/30 bg-yellow-950/20'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`mb-1 flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.16em] ${player ? 'text-blue-400' : 'text-yellow-500'}`}>
            {player ? <Shield size={9} /> : <AlertOctagon size={9} />}
            {player ? 'Player side scheme' : 'Villain side scheme'}
          </div>
          <input
            aria-label={`${player ? 'Player' : 'Villain'} side scheme name`}
            value={scheme.name}
            onChange={(event) => onRename(event.target.value)}
            maxLength={36}
            className="w-full border-0 border-b border-dashed border-white/15 bg-transparent pb-1 text-xs font-black text-white outline-none transition focus:border-white/50"
          />
        </div>
        <button
          type="button"
          aria-label={`Remove ${scheme.name}`}
          onClick={onRemove}
          className="rounded-md p-1.5 text-gray-600 transition hover:bg-red-900/40 hover:text-red-400"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex justify-end">
        <ThreatControl value={scheme.threat} label={scheme.name} onChange={onThreatChange} tone={player ? 'text-blue-300' : 'text-yellow-400'} />
      </div>
    </Motion.article>
  );
}

export default function SimpleBoard() {
  const [board, setBoard] = useState(loadBoard);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const adjustHp = (type, amount) => {
    const key = type === 'villain' ? 'villainHp' : 'heroHp';
    setBoard((current) => ({ ...current, [key]: Math.max(0, current[key] + amount) }));
  };

  const toggleStatus = (type, status) => {
    const key = type === 'villain' ? 'villainStatuses' : 'heroStatuses';
    setBoard((current) => ({
      ...current,
      [key]: current[key].includes(status)
        ? current[key].filter((item) => item !== status)
        : [...current[key], status],
    }));
  };

  const addSideScheme = (owner) => {
    setBoard((current) => ({
      ...current,
      sideSchemes: [
        ...current.sideSchemes,
        {
          id: `${Date.now()}-${current.sideSchemes.length}`,
          owner,
          name: owner === 'player' ? 'Player Side Scheme' : 'Villain Side Scheme',
          threat: 0,
        },
      ],
    }));
  };

  const updateSideScheme = (id, update) => {
    setBoard((current) => ({
      ...current,
      sideSchemes: current.sideSchemes.map((scheme) => scheme.id === id ? update(scheme) : scheme),
    }));
  };

  const resetBoard = () => {
    if (window.confirm('Start a new game? This clears the current counters and side schemes.')) {
      setBoard(freshBoard());
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-xl overflow-x-hidden bg-[#050508] p-3 pb-16 font-sans text-white selection:bg-red-500 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[20%] -top-[20%] h-[50%] w-[80%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] h-[50%] w-[80%] rounded-full bg-red-900/10 blur-[120px]" />
      </div>

      <header className="relative z-10 mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black italic tracking-tighter text-white drop-shadow-xl">
          MARVEL <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">CHAMPIONS</span>
        </h1>
        <button
          type="button"
          onClick={resetBoard}
          aria-label="Start a new game"
          className="rounded-lg border border-white/5 bg-gray-800 p-2 text-gray-400 shadow-lg transition-colors hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      <main className="relative z-10 flex flex-col gap-3">
        <CharacterPanel
          type="villain"
          hp={board.villainHp}
          statuses={board.villainStatuses}
          onHpChange={(amount) => adjustHp('villain', amount)}
          onStatusToggle={(status) => toggleStatus('villain', status)}
        />

        <section className="rounded-xl border border-yellow-500/30 bg-gray-900/80 p-1 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold leading-tight text-yellow-400">Main Scheme</h2>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-gray-600">Threat</p>
            </div>
            <ThreatControl
              value={board.mainThreat}
              label="Main Scheme"
              onChange={(amount) => setBoard((current) => ({ ...current, mainThreat: Math.max(0, current.mainThreat + amount) }))}
            />
          </div>
        </section>

        <section className="border-y border-white/10 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-gray-300">Side Schemes</h2>
              <p className="mt-0.5 text-[9px] text-gray-600">Tap a scheme name to label it</p>
            </div>
            <div className="flex gap-2">
              <TactileButton label="Add villain side scheme" onClick={() => addSideScheme('villain')} className="h-9 !bg-yellow-700 px-3 text-[10px] text-white hover:!bg-yellow-600">
                <AlertOctagon size={13} /> Villain
              </TactileButton>
              <TactileButton label="Add player side scheme" onClick={() => addSideScheme('player')} className="h-9 !bg-blue-700 px-3 text-[10px] text-white hover:!bg-blue-600">
                <Shield size={13} /> Player
              </TactileButton>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {board.sideSchemes.map((scheme) => (
                <SideSchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  onRename={(name) => updateSideScheme(scheme.id, (item) => ({ ...item, name }))}
                  onThreatChange={(amount) => updateSideScheme(scheme.id, (item) => ({ ...item, threat: Math.max(0, item.threat + amount) }))}
                  onRemove={() => setBoard((current) => ({ ...current, sideSchemes: current.sideSchemes.filter((item) => item.id !== scheme.id) }))}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        <CharacterPanel
          type="hero"
          hp={board.heroHp}
          statuses={board.heroStatuses}
          onHpChange={(amount) => adjustHp('hero', amount)}
          onStatusToggle={(status) => toggleStatus('hero', status)}
        />
      </main>
    </div>
  );
}
