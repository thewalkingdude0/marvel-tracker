import { createElement, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  Brain,
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Shield,
  Skull,
  Sparkles,
  Trash2,
  Undo2,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'mc_quick_board_v1';
const STATUSES = [
  { id: 'stunned', label: 'Stunned', icon: Zap },
  { id: 'confused', label: 'Confused', icon: Brain },
  { id: 'tough', label: 'Tough', icon: Shield },
];

const freshBoard = () => ({
  villain: { name: 'Villain', hp: 20, statuses: [] },
  hero: { name: 'Hero', hp: 10, statuses: [] },
  mainScheme: { name: 'Main scheme', threat: 0 },
  sideSchemes: [],
});

const loadBoard = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return stored && stored.villain && stored.hero
      ? {
          ...stored,
          sideSchemes: (stored.sideSchemes || []).map((scheme) => ({
            ...scheme,
            owner: scheme.owner || 'villain',
          })),
        }
      : freshBoard();
  } catch {
    return freshBoard();
  }
};

function EditableNumber({ value, label, onCommit, tone }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = Math.max(0, Number.parseInt(draft, 10) || 0);
    onCommit(next);
    setDraft(String(next));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={`Set ${label}`}
        inputMode="numeric"
        type="number"
        min="0"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className={`w-28 border-0 bg-transparent text-center text-7xl font-black leading-none tracking-[-0.07em] outline-none tabular-nums sm:text-8xl ${tone}`}
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
      className={`mc-number min-w-28 px-2 text-center text-7xl font-black leading-none tracking-[-0.07em] outline-none transition focus-visible:ring-2 focus-visible:ring-white/60 sm:text-8xl ${tone}`}
    >
      {value}
    </button>
  );
}

function StepButton({ amount, onClick, accent, label }) {
  const isPositive = amount > 0;
  return (
    <button
      type="button"
      aria-label={`${isPositive ? 'Add' : 'Remove'} ${Math.abs(amount)} ${label}`}
      onClick={onClick}
      className={`mc-cut-button flex h-12 min-w-14 flex-1 items-center justify-center gap-1 border border-white/10 bg-white/[0.045] text-sm font-extrabold text-zinc-300 transition active:translate-y-px ${accent}`}
    >
      {isPositive ? <Plus size={15} strokeWidth={3} /> : <Minus size={15} strokeWidth={3} />}
      {Math.abs(amount)}
    </button>
  );
}

function StatusRow({ statuses, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Conditions">
      {STATUSES.map(({ id, label, icon }) => {
        const active = statuses.includes(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(id)}
            className={`mc-cut-button flex min-h-10 items-center gap-2 border px-3 text-xs font-extrabold uppercase tracking-[0.04em] transition active:translate-y-px ${
              active
                ? id === 'stunned'
                  ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-200'
                  : id === 'confused'
                    ? 'border-violet-300/50 bg-violet-400/15 text-violet-200'
                    : 'border-amber-200/60 bg-amber-300/15 text-amber-100'
                : 'border-white/10 bg-black/20 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
            }`}
          >
            {createElement(icon, { size: 14 })}
            {label}
          </button>
        );
      })}
    </div>
  );
}

function HealthCard({ actor, kind, onNameChange, onChange, onStatusToggle }) {
  const villain = kind === 'villain';
  return (
    <Motion.section
      layout
      className={`mc-panel relative overflow-hidden border p-5 shadow-2xl sm:p-6 ${
        villain
          ? 'border-rose-400/20 bg-[#171014] shadow-rose-950/20'
          : 'border-sky-400/20 bg-[#0d151c] shadow-sky-950/20'
      }`}
    >
      <div className={`mc-slash pointer-events-none absolute right-0 top-0 h-full w-16 opacity-20 ${villain ? 'text-rose-500' : 'text-sky-400'}`} />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`mc-cut-button grid h-10 w-10 place-items-center border ${villain ? 'border-rose-400/30 bg-rose-500/15 text-rose-300' : 'border-sky-400/30 bg-sky-500/15 text-sky-300'}`}>
              {villain ? <Skull size={19} /> : <Shield size={19} />}
            </div>
            <div>
              <p className="mc-micro text-zinc-500">{villain ? 'Threat / enemy' : 'Identity / player'}</p>
              <input
                aria-label={`${kind} name`}
                value={actor.name}
                maxLength={28}
                onChange={(event) => onNameChange(event.target.value)}
                className="mc-display w-full border-0 bg-transparent text-xl uppercase tracking-wide text-white outline-none placeholder:text-zinc-600"
                placeholder={villain ? 'Villain' : 'Hero'}
              />
            </div>
          </div>
          <span className="mc-micro hidden text-zinc-600 sm:block">HP // TAP TO EDIT</span>
        </div>

        <div className="my-7 flex justify-center">
          <EditableNumber value={actor.hp} label={`${kind} health`} onCommit={(value) => onChange(value - actor.hp)} tone={villain ? 'text-rose-400' : 'text-sky-300'} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[-5, -1, 1, 5].map((amount) => (
            <StepButton
              key={amount}
              amount={amount}
              label={`${kind} health`}
              onClick={() => onChange(amount)}
              accent={villain ? 'hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200' : 'hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-200'}
            />
          ))}
        </div>

        <div className="mt-4 border-t border-white/[0.1] pt-4">
          <StatusRow statuses={actor.statuses} onToggle={onStatusToggle} />
        </div>
      </div>
    </Motion.section>
  );
}

function SchemeCard({ scheme, isMain = false, onNameChange, onChange, onRemove, onOwnerChange }) {
  const owner = isMain ? 'main' : scheme.owner || 'villain';
  const isPlayer = owner === 'player';
  const label = isMain ? 'Main scheme threat' : `${scheme.name || 'Side scheme'} threat`;
  const palette = isMain
    ? {
        panel: 'border-amber-300/35 bg-[#171308]',
        icon: 'border-amber-300/30 bg-amber-300/10 text-amber-200',
        text: 'text-amber-200',
        hover: 'hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-100',
      }
    : isPlayer
      ? {
          panel: 'border-cyan-300/35 bg-[#08171a]',
          icon: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200',
          text: 'text-cyan-200',
          hover: 'hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100',
        }
      : {
          panel: 'border-rose-400/35 bg-[#190b10]',
          icon: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
          text: 'text-rose-300',
          hover: 'hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-100',
        };

  return (
    <Motion.section
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`mc-panel relative overflow-hidden border p-4 ${palette.panel}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${isMain ? 'bg-amber-300' : isPlayer ? 'bg-cyan-300' : 'bg-rose-500'}`} />
      <div className="flex items-center gap-3">
        <div className={`mc-cut-button grid h-9 w-9 shrink-0 place-items-center border ${palette.icon}`}>
          {isMain ? <Sparkles size={16} /> : isPlayer ? <Shield size={16} /> : <Skull size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isMain ? (
              <span className="mc-micro text-amber-200/70">PRIMARY OBJECTIVE</span>
            ) : (
              <button
                type="button"
                onClick={() => onOwnerChange(isPlayer ? 'villain' : 'player')}
                className={`mc-micro transition hover:text-white ${isPlayer ? 'text-cyan-300' : 'text-rose-300'}`}
                title={`Move to ${isPlayer ? 'villain' : 'player'} schemes`}
              >
                {isPlayer ? 'PLAYER SIDE SCHEME' : 'VILLAIN SIDE SCHEME'} // SWITCH
              </button>
            )}
          </div>
          <label className="group flex items-center gap-2">
            <input
              aria-label={`${isMain ? 'Main' : 'Side'} scheme name`}
              value={scheme.name}
              maxLength={36}
              onChange={(event) => onNameChange(event.target.value)}
              className="mc-display min-w-0 flex-1 truncate border-0 border-b border-dashed border-white/15 bg-transparent text-base uppercase tracking-wide text-zinc-100 outline-none transition focus:border-white/60 placeholder:text-zinc-600"
              placeholder={isMain ? 'Main scheme' : isPlayer ? 'Player side scheme' : 'Villain side scheme'}
            />
            <Pencil size={11} className="shrink-0 text-zinc-600 transition group-focus-within:text-white" />
          </label>
        </div>
        {!isMain && (
          <button type="button" aria-label={`Remove ${scheme.name || 'side scheme'}`} onClick={onRemove} className="mc-cut-button grid h-10 w-10 shrink-0 place-items-center border border-white/5 text-zinc-600 transition hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-300">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <StepButton amount={-1} label={label} onClick={() => onChange(-1)} accent={palette.hover} />
        <EditableNumber value={scheme.threat} label={label} onCommit={(value) => onChange(value - scheme.threat)} tone={`${palette.text} !text-5xl sm:!text-6xl`} />
        <StepButton amount={1} label={label} onClick={() => onChange(1)} accent={palette.hover} />
      </div>
    </Motion.section>
  );
}

export default function QuickBoard({ onOpenClassic }) {
  const [board, setBoard] = useState(loadBoard);
  const [history, setHistory] = useState([]);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  }, [board]);

  const changeBoard = (updater, remember = true) => {
    if (remember) setHistory((items) => [...items.slice(-19), board]);
    setBoard(updater);
  };

  const adjustActor = (kind, amount) => {
    changeBoard((current) => ({ ...current, [kind]: { ...current[kind], hp: Math.max(0, current[kind].hp + amount) } }));
  };

  const renameActor = (kind, name) => {
    changeBoard((current) => ({ ...current, [kind]: { ...current[kind], name } }), false);
  };

  const toggleStatus = (kind, status) => {
    changeBoard((current) => {
      const statuses = current[kind].statuses.includes(status)
        ? current[kind].statuses.filter((item) => item !== status)
        : [...current[kind].statuses, status];
      return { ...current, [kind]: { ...current[kind], statuses } };
    });
  };

  const adjustMainScheme = (amount) => {
    changeBoard((current) => ({ ...current, mainScheme: { ...current.mainScheme, threat: Math.max(0, current.mainScheme.threat + amount) } }));
  };

  const updateSideScheme = (id, update, remember = true) => {
    changeBoard((current) => ({
      ...current,
      sideSchemes: current.sideSchemes.map((scheme) => scheme.id === id ? update(scheme) : scheme),
    }), remember);
  };

  const addSideScheme = (owner) => {
    changeBoard((current) => ({
      ...current,
      sideSchemes: [
        ...current.sideSchemes,
        {
          id: `${Date.now()}-${current.sideSchemes.length}`,
          name: owner === 'player' ? 'Player side scheme' : 'Villain side scheme',
          owner,
          threat: 0,
        },
      ],
    }));
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setBoard(previous);
    setHistory((items) => items.slice(0, -1));
  };

  return (
    <div className="mc-grid min-h-screen bg-[#070809] text-white selection:bg-amber-200 selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-20 top-24 h-[32rem] w-36 rotate-12 bg-rose-600/[0.035]" />
        <div className="absolute -left-16 bottom-24 h-64 w-28 -rotate-12 bg-cyan-300/[0.025]" />
      </div>

      <header className="sticky top-0 z-30 border-b-4 border-[#e62429] bg-[#070809]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="marvel-wordmark">MARVEL</div>
            <div>
              <h1 className="text-sm font-black uppercase leading-none tracking-[0.2em] text-white">Champions</h1>
              <p className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 sm:block">Game board · saved automatically</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" aria-label="Undo last change" title="Undo last change" disabled={!history.length} onClick={undo} className="mc-cut-button grid h-10 w-10 place-items-center border border-white/10 bg-black/30 text-zinc-400 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><Undo2 size={17} /></button>
            <button type="button" onClick={() => setShowReset(true)} className="mc-cut-button grid h-10 w-10 place-items-center border border-white/10 bg-black/30 text-zinc-400 transition hover:border-white/30 hover:text-white" aria-label="Start a new board" title="Start a new board"><RotateCcw size={16} /></button>
            <button type="button" onClick={onOpenClassic} className="mc-cut-button flex h-10 items-center gap-1 border border-white/10 bg-black/30 px-3 text-xs font-bold text-zinc-300 transition hover:border-white/30 hover:text-white">Classic <ChevronRight size={14} /></button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffca28]">Heroes versus villains</p>
            <h2 className="comic-title text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">Game Board</h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 animate-pulse bg-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Live · tap values to edit</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <HealthCard kind="villain" actor={board.villain} onNameChange={(name) => renameActor('villain', name)} onChange={(amount) => adjustActor('villain', amount)} onStatusToggle={(status) => toggleStatus('villain', status)} />
          <HealthCard kind="hero" actor={board.hero} onNameChange={(name) => renameActor('hero', name)} onChange={(amount) => adjustActor('hero', amount)} onStatusToggle={(status) => toggleStatus('hero', status)} />
        </div>

        <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
          <SchemeCard
            isMain
            scheme={board.mainScheme}
            onNameChange={(name) => changeBoard((current) => ({ ...current, mainScheme: { ...current.mainScheme, name } }), false)}
            onChange={adjustMainScheme}
          />

          <section className="mc-panel border border-white/10 bg-[#0b0c0e] p-3">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/10 px-1 pb-3">
              <div>
                <p className="mc-micro text-zinc-600">OBJECTIVE CHANNELS</p>
                <h3 className="mc-display text-xl uppercase tracking-wider text-zinc-100">Side Schemes</h3>
              </div>
              <span className="mc-micro text-zinc-700">TAP LABELS TO RENAME</span>
            </div>

            <div className="space-y-5">
              {[
                { owner: 'villain', label: 'Villain schemes', icon: Skull, tone: 'text-rose-300', button: 'border-rose-400/30 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20' },
                { owner: 'player', label: 'Player schemes', icon: Shield, tone: 'text-cyan-200', button: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20' },
              ].map((lane) => {
                const laneSchemes = board.sideSchemes.filter((scheme) => (scheme.owner || 'villain') === lane.owner);
                return (
                  <div key={lane.owner}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className={`flex items-center gap-2 ${lane.tone}`}>
                        {createElement(lane.icon, { size: 13 })}
                        <span className="mc-micro">{lane.label}</span>
                        <span className="mc-micro text-zinc-700">[{laneSchemes.length}]</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSideScheme(lane.owner)}
                        className={`mc-cut-button flex h-9 items-center gap-1.5 border px-3 text-[10px] font-black uppercase tracking-wider transition active:translate-y-px ${lane.button}`}
                      >
                        <Plus size={13} strokeWidth={3} /> Add {lane.owner}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {laneSchemes.map((scheme) => (
                          <SchemeCard
                            key={scheme.id}
                            scheme={scheme}
                            onNameChange={(name) => updateSideScheme(scheme.id, (item) => ({ ...item, name }), false)}
                            onOwnerChange={(owner) => updateSideScheme(scheme.id, (item) => ({ ...item, owner }))}
                            onChange={(amount) => updateSideScheme(scheme.id, (item) => ({ ...item, threat: Math.max(0, item.threat + amount) }))}
                            onRemove={() => changeBoard((current) => ({ ...current, sideSchemes: current.sideSchemes.filter((item) => item.id !== scheme.id) }))}
                          />
                        ))}
                      </AnimatePresence>

                      {!laneSchemes.length && (
                        <button
                          type="button"
                          onClick={() => addSideScheme(lane.owner)}
                          className="mc-cut-button flex w-full items-center justify-center gap-2 border border-dashed border-white/10 px-4 py-5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition hover:border-white/20 hover:text-zinc-500"
                        >
                          <Plus size={14} /> No {lane.label.toLowerCase()} in play
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {showReset && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReset(false); }}>
            <Motion.div initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, scale: 0.98 }} role="dialog" aria-modal="true" aria-labelledby="reset-title" className="mc-panel w-full max-w-sm border border-white/15 bg-[#121317] p-6 shadow-2xl">
              <div className="mc-cut-button mb-5 grid h-11 w-11 place-items-center bg-rose-500 text-white"><RotateCcw size={19} /></div>
              <h2 id="reset-title" className="mc-display text-2xl uppercase tracking-wide text-white">Start a fresh board?</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">This clears the quick counters only. Your classic tracker and all of its saved data stay untouched.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setShowReset(false)} className="mc-cut-button h-11 border border-white/10 text-sm font-bold text-zinc-300 hover:bg-white/[0.05]">Keep game</button>
                <button type="button" onClick={() => { changeBoard(() => freshBoard()); setShowReset(false); }} className="mc-cut-button h-11 bg-rose-500 text-sm font-black text-white hover:bg-rose-400">New board</button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
