import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useAnimation, useReducedMotion } from 'framer-motion';
import {
  AlertOctagon,
  Brain,
  Minus,
  Plus,
  RefreshCw,
  RotateCw,
  Shield,
  Skull,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'mc_simple_board_v2';
const DISPLAY_MODE_KEY = 'mc_simple_display_mode';

const createHero = (index = 0) => ({
  id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  name: `Hero ${index + 1}`,
  hp: 0,
  rotation: 0,
  statuses: [],
});

const freshBoard = () => ({
  villainHp: 0,
  villainStatuses: [],
  heroes: [createHero(0)],
  mainThreat: 0,
  sideSchemes: [],
});

const loadBoard = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return freshBoard();

    const heroes = Array.isArray(saved.heroes) && saved.heroes.length
      ? saved.heroes.map((hero, index) => ({
          ...createHero(index),
          ...hero,
          hp: Math.max(0, hero.hp || 0),
          statuses: Array.isArray(hero.statuses) ? hero.statuses : [],
        }))
      : [{
          ...createHero(0),
          hp: Math.max(0, saved.heroHp || 0),
          statuses: Array.isArray(saved.heroStatuses) ? saved.heroStatuses : [],
        }];

    return { ...freshBoard(), ...saved, heroes };
  } catch {
    return freshBoard();
  }
};

const loadDisplayMode = () => {
  try {
    return window.localStorage.getItem(DISPLAY_MODE_KEY) === 'solo' ? 'solo' : 'table';
  } catch {
    return 'table';
  }
};

function TactileButton({ children, onClick, className = '', label, disabled = false }) {
  const press = () => {
    if (disabled) return;
    navigator.vibrate?.(8);
    onClick?.();
  };

  return (
    <Motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
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

function CharacterPanel({ type, name, hp, statuses, onHpChange, onStatusToggle, onNameChange, onRemove, onRotate, canRemove = false, canRotate = false }) {
  const villain = type === 'villain';
  const fallbackName = villain ? 'Villain' : 'Hero';
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
          {villain ? (
            <h2 className="text-2xl font-black uppercase leading-none text-red-400">Villain</h2>
          ) : (
            <input
              aria-label="Hero name"
              value={name}
              maxLength={24}
              onChange={(event) => onNameChange(event.target.value)}
              className="min-w-0 flex-1 border-0 border-b border-dashed border-blue-300/20 bg-transparent text-2xl font-black uppercase leading-none text-blue-300 outline-none transition focus:border-blue-300/70"
              placeholder="Hero name"
            />
          )}
          <div className="flex shrink-0 gap-1">
            {STATUS_TYPES.map((status) => (
              <StatusToggle
                key={status}
                type={status}
                active={statuses.includes(status)}
                onToggle={() => onStatusToggle(status)}
              />
            ))}
            {!villain && canRotate && (
              <button
                type="button"
                aria-label={`Rotate ${name || fallbackName} clockwise`}
                title="Rotate hero card"
                onClick={onRotate}
                className="ml-1 grid h-7 w-7 place-items-center rounded-md border border-blue-300/20 bg-blue-900/40 text-blue-300 transition hover:border-blue-300/50 hover:bg-blue-800/60 hover:text-white"
              >
                <RotateCw size={12} />
              </button>
            )}
            {!villain && canRemove && (
              <button
                type="button"
                aria-label={`Remove ${name || fallbackName}`}
                onClick={onRemove}
                className="ml-1 grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-gray-800 text-gray-500 transition hover:border-red-400/40 hover:bg-red-900/40 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <HealthDial
          value={hp}
          label={`${name || fallbackName} HP`}
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
  const [displayMode, setDisplayMode] = useState(loadDisplayMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  useEffect(() => {
    window.localStorage.setItem(DISPLAY_MODE_KEY, displayMode);
  }, [displayMode]);

  const adjustVillainHp = (amount) => {
    setBoard((current) => ({ ...current, villainHp: Math.max(0, current.villainHp + amount) }));
  };

  const toggleVillainStatus = (status) => {
    setBoard((current) => ({
      ...current,
      villainStatuses: current.villainStatuses.includes(status)
        ? current.villainStatuses.filter((item) => item !== status)
        : [...current.villainStatuses, status],
    }));
  };

  const updateHero = (id, update) => {
    setBoard((current) => ({
      ...current,
      heroes: current.heroes.map((hero) => hero.id === id ? update(hero) : hero),
    }));
  };

  const adjustHeroHp = (id, amount) => {
    updateHero(id, (hero) => ({ ...hero, hp: Math.max(0, hero.hp + amount) }));
  };

  const toggleHeroStatus = (id, status) => {
    updateHero(id, (hero) => ({
      ...hero,
      statuses: hero.statuses.includes(status)
        ? hero.statuses.filter((item) => item !== status)
        : [...hero.statuses, status],
    }));
  };

  const addHero = () => {
    setDisplayMode('table');
    setBoard((current) => current.heroes.length >= 4
      ? current
      : { ...current, heroes: [...current.heroes, createHero(current.heroes.length)] });
  };

  const removeHero = (id) => {
    setBoard((current) => current.heroes.length === 1
      ? current
      : { ...current, heroes: current.heroes.filter((hero) => hero.id !== id) });
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

  const renderHero = (hero, canRotate = true) => {
    const rotation = canRotate ? hero.rotation || 0 : 0;
    const isSideways = rotation % 180 !== 0;

    return (
      <div
        key={hero.id}
        className={`flex items-center justify-center transition-all duration-300 ${isSideways ? 'mt-6 aspect-square' : 'min-h-[140px]'}`}
      >
        <div
          className="w-full transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <CharacterPanel
            type="hero"
            name={hero.name}
            hp={hero.hp}
            statuses={hero.statuses}
            canRemove={board.heroes.length > 1}
            canRotate={canRotate}
            onNameChange={(name) => updateHero(hero.id, (item) => ({ ...item, name }))}
            onHpChange={(amount) => adjustHeroHp(hero.id, amount)}
            onStatusToggle={(status) => toggleHeroStatus(hero.id, status)}
            onRotate={() => updateHero(hero.id, (item) => ({ ...item, rotation: ((item.rotation || 0) + 90) % 360 }))}
            onRemove={() => removeHero(hero.id)}
          />
        </div>
      </div>
    );
  };

  const schemeBoard = (
    <section>
      <div className="rounded-xl border border-yellow-500/30 bg-gray-900/80 p-1 shadow-lg backdrop-blur-xl">
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
      </div>

      <div className="mt-3 border-y border-white/10 py-3">
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
      </div>
    </section>
  );

  const leftHeroes = board.heroes.filter((_, index) => index % 2 === 0);
  const rightHeroes = board.heroes.filter((_, index) => index % 2 === 1);

  return (
    <div className={`relative mx-auto min-h-screen overflow-x-hidden bg-[#050508] p-3 pb-16 font-sans text-white selection:bg-red-500 selection:text-white sm:p-4 ${displayMode === 'solo' ? 'max-w-xl' : 'max-w-7xl lg:px-6'}`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-[20%] -top-[20%] h-[50%] w-[80%] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] h-[50%] w-[80%] rounded-full bg-red-900/10 blur-[120px]" />
      </div>

      <header className="relative z-10 mb-4 flex items-center justify-between">
        <h1 className="text-lg font-black italic tracking-tighter text-white drop-shadow-xl sm:text-xl">
          MARVEL <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">CHAMPIONS</span>
        </h1>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-white/5 bg-gray-900 p-0.5">
            <button
              type="button"
              onClick={() => setDisplayMode('solo')}
              aria-label="Solo mode"
              aria-pressed={displayMode === 'solo'}
              title="Solo mode"
              className={`flex h-8 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase transition ${displayMode === 'solo' ? 'bg-blue-700 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Shield size={13} /><span className="hidden sm:inline">Solo</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('table')}
              aria-label="Table mode"
              aria-pressed={displayMode === 'table'}
              title="Table mode"
              className={`flex h-8 items-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase transition ${displayMode === 'table' ? 'bg-blue-700 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              <Users size={13} /><span className="hidden sm:inline">Table</span>
            </button>
          </div>
          <button
            type="button"
            onClick={addHero}
            disabled={board.heroes.length >= 4}
            aria-label="Add another hero"
            title="Add hero"
            className="grid h-9 w-9 place-items-center rounded-lg border border-blue-400/20 bg-blue-700 text-white shadow-lg transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-600"
          >
            <Plus size={17} />
          </button>
          <button
            type="button"
            onClick={resetBoard}
            aria-label="Start a new game"
            title="Start a new game"
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/5 bg-gray-800 text-gray-400 shadow-lg transition-colors hover:bg-gray-700 hover:text-white"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {displayMode === 'solo' ? (
        <main className="relative z-10 flex flex-col gap-3">
          <CharacterPanel
            type="villain"
            name="Villain"
            hp={board.villainHp}
            statuses={board.villainStatuses}
            onHpChange={adjustVillainHp}
            onStatusToggle={toggleVillainStatus}
          />
          {schemeBoard}
          <AnimatePresence initial={false}>{board.heroes[0] && renderHero(board.heroes[0], false)}</AnimatePresence>
        </main>
      ) : (
        <main className="relative z-10 grid items-start gap-3 lg:grid-cols-[minmax(235px,1fr)_minmax(310px,1.15fr)_minmax(235px,1fr)]">
          <section className="order-2 grid gap-3 sm:grid-cols-2 lg:order-1 lg:grid-cols-1" aria-label="Heroes seated on the left">
            <AnimatePresence initial={false}>
              {leftHeroes.map((hero) => renderHero(hero))}
            </AnimatePresence>
          </section>

          <section className="order-1 flex flex-col gap-3 lg:order-2" aria-label="Central encounter">
            <CharacterPanel
              type="villain"
              name="Villain"
              hp={board.villainHp}
              statuses={board.villainStatuses}
              onHpChange={adjustVillainHp}
              onStatusToggle={toggleVillainStatus}
            />
            {schemeBoard}
          </section>

          <section className="order-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1" aria-label="Heroes seated on the right">
            <AnimatePresence initial={false}>
              {rightHeroes.map((hero) => renderHero(hero))}
            </AnimatePresence>
          </section>
        </main>
      )}
    </div>
  );
}
