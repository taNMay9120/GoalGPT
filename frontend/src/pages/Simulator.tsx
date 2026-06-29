import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Trophy, Play, RotateCcw, FastForward, Loader2 } from 'lucide-react';

/* ─────────────── Types ─────────────── */
interface MatchState {
  id: number;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  penaltyInfo: string;
  winner: string | null;
  probabilities: Record<string, number> | null;
  loading: boolean;
}

/* ─────────────── Constants ─────────────── */
// 2026 FIFA World Cup – confirmed Round of 32 fixtures
const R32_PRESET = [
  { id: 1,  team1: 'South Africa',       team2: 'Canada'                  },
  { id: 2,  team1: 'Netherlands',        team2: 'Morocco'                 },
  { id: 3,  team1: 'Germany',            team2: 'Paraguay'                },
  { id: 4,  team1: 'France',             team2: 'Sweden'                  },
  { id: 5,  team1: 'Belgium',            team2: 'Senegal'                 },
  { id: 6,  team1: 'USA',               team2: 'Bosnia and Herzegovina'  },
  { id: 7,  team1: 'Spain',              team2: 'Austria'                 },
  { id: 8,  team1: 'Portugal',           team2: 'Croatia'                 },
  { id: 9,  team1: "Côte d'Ivoire",      team2: 'Norway'                  },
  { id: 10, team1: 'Mexico',             team2: 'Ecuador'                 },
  { id: 11, team1: 'Switzerland',        team2: 'Algeria'                 },
  { id: 12, team1: 'Australia',          team2: 'Egypt'                   },
  { id: 13, team1: 'Brazil',             team2: 'Japan'                   },
  { id: 14, team1: 'England',            team2: 'Congo DR'                },
  { id: 15, team1: 'Argentina',          team2: 'Cape Verde'              },
  { id: 16, team1: 'Colombia',           team2: 'Ghana'                   },
];

const FLAGS: Record<string, string> = {
  'Argentina': '🇦🇷', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Belgium': '🇧🇪',
  'Bosnia and Herzegovina': '🇧🇦', 'Brazil': '🇧🇷', 'Canada': '🇨🇦', 'Cape Verde': '🇨🇻',
  'Colombia': '🇨🇴', "Côte d'Ivoire": '🇨🇮', 'Congo DR': '🇨🇩', 'Croatia': '🇭🇷',
  'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'France': '🇫🇷',
  'Germany': '🇩🇪', 'Ghana': '🇬🇭', 'Japan': '🇯🇵', 'Mexico': '🇲🇽',
  'Morocco': '🇲🇦', 'Netherlands': '🇳🇱', 'Norway': '🇳🇴', 'Paraguay': '🇵🇾',
  'Portugal': '🇵🇹', 'Senegal': '🇸🇳', 'South Africa': '🇿🇦', 'Spain': '🇪🇸',
  'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'USA': '🇺🇸', 'Algeria': '🇩🇿',
  'TBD': '🛡️',
};

// Bracket geometry
const SLOT_H  = 112; // px – vertical space per R32 slot
const CARD_H  = 86;  // px – match card height
const CARD_W  = 214; // px – match card width
const CONN_W  = 48;  // px – SVG connector column width
const TOTAL_H = 16 * SLOT_H; // = 1792 px

const ROUND_NAMES  = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
const ROUND_COUNTS = [16, 8, 4, 2, 1];
const MOBILE_TABS  = ['R32', 'R16', 'QF', 'SF', 'F'] as const;
type MobileTab = typeof MOBILE_TABS[number];

/* ─────────────── Bracket math ─────────────── */
function centerY(round: number, idx: number): number {
  const mult = Math.pow(2, round);
  return (mult * idx + mult / 2) * SLOT_H;
}
function cardTopY(round: number, idx: number): number {
  return centerY(round, idx) - CARD_H / 2;
}

/* ─────────────── Sub-components ─────────────── */

/** Single match card – absolutely positioned inside its round column */
function MatchCard({
  match, round, matchIndex, onSimulate, simulatingAll,
}: {
  match: MatchState; round: number; matchIndex: number;
  onSimulate: () => void; simulatingAll: boolean;
}) {
  const top = cardTopY(round, matchIndex);
  const isTbd    = match.team1 === 'TBD' || match.team2 === 'TBD';
  const isPlayed = match.winner !== null;
  const isReady  = !isTbd && !isPlayed && !match.loading;

  const t1won = isPlayed && match.winner === match.team1;
  const t2won = isPlayed && match.winner === match.team2;

  const f1 = FLAGS[match.team1] ?? '🏳️';
  const f2 = FLAGS[match.team2] ?? '🏳️';

  return (
    <div
      style={{ position: 'absolute', top, left: 0, width: CARD_W, height: CARD_H }}
      className={`
        rounded-xl border overflow-hidden select-none transition-all duration-300
        ${match.loading  ? 'border-brand-gold/70 ring-2 ring-brand-gold/20 animate-pulse' :
          isTbd          ? 'border-dark-border/25 bg-dark-bg/20 opacity-40' :
          isPlayed       ? 'border-dark-border bg-dark-card' :
                           'border-dark-border bg-dark-card hover:border-brand-gold/40 hover:shadow-lg hover:shadow-brand-gold/5'}
      `}
    >
      {/* ── Card header bar ── */}
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-dark-border/30 bg-dark-bg/40">
        <span className="text-[9px] font-bold text-dark-muted/70 uppercase tracking-widest">
          {round === 0 ? `Match ${match.id}` : `${ROUND_NAMES[round]} ${matchIndex + 1}`}
        </span>
        <div className="flex items-center gap-1">
          {match.loading && (
            <span className="text-[8px] font-black text-brand-goldLight animate-pulse">LIVE</span>
          )}
          {isPlayed && (
            <span className="text-[8px] font-black text-brand-accent bg-brand-accent/15 border border-brand-accent/25 px-1.5 py-0.5 rounded-full">FT</span>
          )}
          {match.penaltyInfo && (
            <span className="text-[8px] font-bold text-brand-goldLight">{match.penaltyInfo}</span>
          )}
          {isReady && !simulatingAll && (
            <button
              onClick={e => { e.stopPropagation(); onSimulate(); }}
              title="Simulate match"
              className="text-brand-gold hover:text-brand-goldLight font-bold text-xs cursor-pointer px-1 hover:bg-brand-gold/10 rounded transition-colors"
            >
              ▶
            </button>
          )}
        </div>
      </div>

      {/* ── Team 1 ── */}
      <div className={`flex items-center justify-between px-2.5 py-[7px] transition-colors ${t1won ? 'bg-brand-gold/10' : t2won ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[15px] leading-none shrink-0">{f1}</span>
          <span className={`text-[11px] font-semibold truncate ${t1won ? 'text-brand-goldLight font-black' : 'text-dark-text'}`}>
            {match.team1}
          </span>
        </div>
        <span className={`text-sm font-black ml-2 shrink-0 w-4 text-right ${t1won ? 'text-brand-goldLight' : 'text-dark-text'}`}>
          {match.score1 !== null ? match.score1 : ''}
        </span>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-dark-border/20 mx-2.5" />

      {/* ── Team 2 ── */}
      <div className={`flex items-center justify-between px-2.5 py-[7px] transition-colors ${t2won ? 'bg-brand-gold/10' : t1won ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[15px] leading-none shrink-0">{f2}</span>
          <span className={`text-[11px] font-semibold truncate ${t2won ? 'text-brand-goldLight font-black' : 'text-dark-text'}`}>
            {match.team2}
          </span>
        </div>
        <span className={`text-sm font-black ml-2 shrink-0 w-4 text-right ${t2won ? 'text-brand-goldLight' : 'text-dark-text'}`}>
          {match.score2 !== null ? match.score2 : ''}
        </span>
      </div>
    </div>
  );
}

/** Round column – relative container holding absolutely positioned cards */
function RoundColumn({
  round, matches, onSimulate, simulatingAll,
}: {
  round: number; matches: MatchState[];
  onSimulate: (i: number) => void; simulatingAll: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: CARD_W, height: TOTAL_H, flexShrink: 0 }}>
      {matches.map((m, i) => (
        <MatchCard
          key={m.id}
          match={m} round={round} matchIndex={i}
          onSimulate={() => onSimulate(i)}
          simulatingAll={simulatingAll}
        />
      ))}
    </div>
  );
}

/** SVG bracket connector lines between two adjacent rounds */
function Connector({ fromRound }: { fromRound: number }) {
  const targetCount = ROUND_COUNTS[fromRound + 1];
  const stroke = '#334155';
  return (
    <svg width={CONN_W} height={TOTAL_H} style={{ flexShrink: 0, display: 'block' }}>
      {Array.from({ length: targetCount }, (_, i) => {
        const y1 = centerY(fromRound, 2 * i);
        const y2 = centerY(fromRound, 2 * i + 1);
        const yt = centerY(fromRound + 1, i);
        const mx = CONN_W / 2;
        return (
          <g key={i}>
            <line x1={0}    y1={y1} x2={mx}      y2={y1} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
            <line x1={0}    y1={y2} x2={mx}      y2={y2} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
            <line x1={mx}   y1={y1} x2={mx}      y2={y2} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
            <line x1={mx}   y1={yt} x2={CONN_W}  y2={yt} stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────── Main Simulator ─────────────── */
export const Simulator: React.FC = () => {
  const [roundOf32,    setRoundOf32]    = useState<MatchState[]>([]);
  const [roundOf16,    setRoundOf16]    = useState<MatchState[]>([]);
  const [quarterfinals,setQuarterfinals]= useState<MatchState[]>([]);
  const [semifinals,   setSemifinals]   = useState<MatchState[]>([]);
  const [finals,       setFinals]       = useState<MatchState[]>([]);
  const [champion,        setChampion]        = useState<string | null>(null);
  const [simulatingAll,   setSimulatingAll]   = useState(false);
  const [currentRound,    setCurrentRound]    = useState<'R32'|'R16'|'QF'|'SF'|'F'|'COMPLETE'>('R32');
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 1100);
  const [mobileTab,       setMobileTab]       = useState<MobileTab>('R32');
  // Deterministic mode: winner is always the highest-probability team (no randomness)
  const [deterministicMode, setDeterministicMode] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const makeEmpty = (n: number): MatchState[] =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1, team1: 'TBD', team2: 'TBD', score1: null, score2: null,
      penaltyInfo: '', winner: null, probabilities: null, loading: false,
    }));

  const initBracket = () => {
    setRoundOf32(R32_PRESET.map(m => ({
      id: m.id, team1: m.team1, team2: m.team2, score1: null, score2: null,
      penaltyInfo: '', winner: null, probabilities: null, loading: false,
    })));
    setRoundOf16(makeEmpty(8));
    setQuarterfinals(makeEmpty(4));
    setSemifinals(makeEmpty(2));
    setFinals(makeEmpty(1));
    setChampion(null);
    setCurrentRound('R32');
    setMobileTab('R32');
    setSimulatingAll(false);
  };

  useEffect(() => { initBracket(); }, []);

  /* ── Prediction helper ── */
  const runPrediction = async (team1: string, team2: string) => {
    try {
      const res = await apiService.predictMatch({ team1, team2 });
      const p1 = res.probabilities[team1] ?? 0.33;
      const p2 = res.probabilities[team2] ?? 0.33;
      const pd = res.probabilities['Draw']  ?? 0.34;

      // ── DETERMINISTIC: always pick the higher-probability team ──
      // ── PROBABILISTIC: random roll weighted by the model's odds ──
      const p_adv = p1 / (p1 + p2 || 1);
      const winner = deterministicMode
        ? (p1 >= p2 ? team1 : team2)
        : (Math.random() < p_adv ? team1 : team2);
      const isW1 = winner === team1;

      let s1 = 0, s2 = 0, pen = '';
      if (!deterministicMode && Math.random() < pd) {
        // Probabilistic draw → resolved by penalty shootout
        const g = Math.floor(Math.random() * 3);
        s1 = g; s2 = g;
        const pw = 4 + Math.floor(Math.random() * 2);
        pen = isW1 ? `(${pw}-${pw - 1} pen)` : `(${pw - 1}-${pw} pen)`;
      } else {
        // Deterministic or non-draw: winning margin reflects probability gap
        const gap = Math.round(Math.abs(p1 - p2) * 6); // 0-3 goals from gap
        const margin = Math.max(1, gap);
        if (isW1) { s1 = margin + (deterministicMode ? 0 : Math.floor(Math.random() * 2)); s2 = Math.max(0, s1 - margin); }
        else      { s2 = margin + (deterministicMode ? 0 : Math.floor(Math.random() * 2)); s1 = Math.max(0, s2 - margin); }
      }
      return { winner, score1: s1, score2: s2, penaltyInfo: pen, probabilities: res.probabilities };
    } catch {
      // Fallback if API fails
      const winner = deterministicMode ? team1 : (Math.random() < 0.5 ? team1 : team2);
      return {
        winner, score1: winner === team1 ? 2 : 1, score2: winner === team2 ? 2 : 1,
        penaltyInfo: '', probabilities: { [team1]: 0.5, [team2]: 0.5 },
      };
    }
  };

  /* ── Propagate winner to next round ── */
  const propagate = (
    round: 'R32'|'R16'|'QF'|'SF'|'F',
    matchIndex: number,
    winner: string,
  ) => {
    const next = Math.floor(matchIndex / 2);
    const isT1 = matchIndex % 2 === 0;
    const place = (setter: React.Dispatch<React.SetStateAction<MatchState[]>>) => {
      setter(prev => prev.map((m, i) => i === next
        ? { ...m, team1: isT1 ? winner : m.team1, team2: !isT1 ? winner : m.team2 }
        : m));
    };
    if (round === 'R32') place(setRoundOf16);
    else if (round === 'R16') place(setQuarterfinals);
    else if (round === 'QF')  place(setSemifinals);
    else if (round === 'SF')  place(setFinals);
    else if (round === 'F')   { setChampion(winner); setCurrentRound('COMPLETE'); }
  };

  /* ── Simulate single match ── */
  const simulateMatch = async (
    round: 'R32'|'R16'|'QF'|'SF'|'F',
    idx: number,
  ) => {
    const getter = {
      R32: roundOf32, R16: roundOf16, QF: quarterfinals, SF: semifinals, F: finals,
    }[round];
    const setter = {
      R32: setRoundOf32, R16: setRoundOf16, QF: setQuarterfinals, SF: setSemifinals, F: setFinals,
    }[round];
    const match = getter[idx];
    if (!match || match.winner || match.team1 === 'TBD' || match.team2 === 'TBD') return;

    setter(prev => prev.map((m, i) => i === idx ? { ...m, loading: true } : m));
    const result = await runPrediction(match.team1, match.team2);
    setter(prev => prev.map((m, i) => i === idx ? { ...m, ...result, loading: false } : m));
    propagate(round, idx, result.winner);
  };

  /* ── Simulate entire bracket (single-pass local arrays to avoid React batching) ── */
  const simulateTournament = async () => {
    setSimulatingAll(true);

    const r32 = roundOf32.map(m => ({ ...m }));
    const r16 = roundOf16.map(m => ({ ...m }));
    const qf  = quarterfinals.map(m => ({ ...m }));
    const sf  = semifinals.map(m => ({ ...m }));
    const f   = finals.map(m => ({ ...m }));

    const runRound = async (
      arr: MatchState[],
      setArr: React.Dispatch<React.SetStateAction<MatchState[]>>,
      nextArr: MatchState[] | null,
      setNextArr: React.Dispatch<React.SetStateAction<MatchState[]>> | null,
    ) => {
      for (let i = 0; i < arr.length; i++) {
        const m = arr[i];
        if (m.winner || m.team1 === 'TBD' || m.team2 === 'TBD') continue;
        setArr(prev => prev.map((x, j) => j === i ? { ...x, loading: true } : x));
        await new Promise(r => setTimeout(r, 60));
        const result = await runPrediction(m.team1, m.team2);
        arr[i] = { ...m, ...result, loading: false };
        setArr([...arr]);
        if (nextArr && setNextArr) {
          const ni = Math.floor(i / 2); const isT1 = i % 2 === 0;
          nextArr[ni] = {
            ...nextArr[ni],
            team1: isT1 ? result.winner : nextArr[ni].team1,
            team2: !isT1 ? result.winner : nextArr[ni].team2,
          };
          setNextArr([...nextArr]);
        }
      }
    };

    await runRound(r32, setRoundOf32, r16, setRoundOf16); setCurrentRound('R16');
    await runRound(r16, setRoundOf16, qf, setQuarterfinals); setCurrentRound('QF');
    await runRound(qf,  setQuarterfinals, sf, setSemifinals); setCurrentRound('SF');
    await runRound(sf,  setSemifinals, f, setFinals); setCurrentRound('F');

    // Final
    const m = f[0];
    if (m.team1 !== 'TBD' && m.team2 !== 'TBD' && !m.winner) {
      setFinals(prev => prev.map((x, i) => i === 0 ? { ...x, loading: true } : x));
      await new Promise(r => setTimeout(r, 70));
      const result = await runPrediction(m.team1, m.team2);
      f[0] = { ...m, ...result, loading: false };
      setFinals([...f]);
      setChampion(result.winner);
    }
    setCurrentRound('COMPLETE');
    setSimulatingAll(false);
  };

  /* ── Simulate current round ── */
  const simulateRound = async () => {
    setSimulatingAll(true);
    const roundMap: Record<string, [MatchState[], React.Dispatch<React.SetStateAction<MatchState[]>>, string]> = {
      R32: [roundOf32, setRoundOf32, 'R16'],
      R16: [roundOf16, setRoundOf16, 'QF'],
      QF:  [quarterfinals, setQuarterfinals, 'SF'],
      SF:  [semifinals, setSemifinals, 'F'],
      F:   [finals, setFinals, 'COMPLETE'],
    };
    const entry = roundMap[currentRound];
    if (!entry) { setSimulatingAll(false); return; }
    const [matches, , nextName] = entry;
    for (let i = 0; i < matches.length; i++) {
      if (!matches[i].winner && matches[i].team1 !== 'TBD' && matches[i].team2 !== 'TBD') {
        await simulateMatch(currentRound as any, i);
      }
    }
    setCurrentRound(nextName as any);
    setSimulatingAll(false);
  };

  /* ── Guard: show loader until state is initialized ── */
  if (roundOf32.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-brand-goldLight" />
        <p className="text-sm text-dark-muted font-bold animate-pulse">Loading 2026 World Cup bracket…</p>
      </div>
    );
  }

  /* ── All rounds as [label, array, setter] ── */
  const allRounds: [string, MatchState[], React.Dispatch<React.SetStateAction<MatchState[]>>][] = [
    ['Round of 32',   roundOf32,     setRoundOf32],
    ['Round of 16',   roundOf16,     setRoundOf16],
    ['Quarterfinals', quarterfinals, setQuarterfinals],
    ['Semifinals',    semifinals,    setSemifinals],
    ['Final',         finals,        setFinals],
  ];

  /* ── Mobile match list for active tab ── */
  const mobileData: Record<MobileTab, MatchState[]> = {
    R32: roundOf32, R16: roundOf16, QF: quarterfinals, SF: semifinals, F: finals,
  };
  const mobileRoundIdx: Record<MobileTab, number> = { R32: 0, R16: 1, QF: 2, SF: 3, F: 4 };
  const mobileRoundKey: Record<MobileTab, 'R32'|'R16'|'QF'|'SF'|'F'> = {
    R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', F: 'F',
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4">
      {/* ── Page title ── */}
      <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-center">
        GoalGPT <span className="text-gradient">2026 World Cup Bracket</span>
      </h1>
      <p className="text-dark-muted text-center mb-8 text-sm">
        AI-powered predictions for every match of the 2026 FIFA World Cup knockout stage.
      </p>

      {/* ── Control bar ── */}
      <div className="glass-panel p-4 mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Mode explainer */}
        <div className="flex flex-col gap-1 max-w-md">
          <p className="text-xs text-dark-muted leading-relaxed">
            Click <strong className="text-brand-gold">▶</strong> on any card to predict it, or use the buttons to run an entire round or the full bracket.
          </p>
          <div className={`flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
            deterministicMode
              ? 'border-brand-gold/40 bg-brand-gold/8 text-brand-goldLight'
              : 'border-dark-border/40 bg-dark-bg/30 text-dark-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${deterministicMode ? 'bg-brand-goldLight' : 'bg-dark-muted'}`} />
            {deterministicMode
              ? '🔒 Deterministic — same champion every run (highest-probability team always wins)'
              : '🎲 Probabilistic — realistic variability based on model odds (different each run)'}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Deterministic toggle */}
          <button
            onClick={() => setDeterministicMode(m => !m)}
            disabled={simulatingAll}
            title={deterministicMode
              ? 'Switch to probabilistic mode (random, realistic)'
              : 'Switch to deterministic mode (same result every time)'}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
              deterministicMode
                ? 'border-brand-gold/50 bg-brand-gold/10 text-brand-goldLight hover:bg-brand-gold/15'
                : 'border-dark-border hover:bg-dark-border/50 text-dark-muted hover:text-dark-text'
            }`}
          >
            {deterministicMode ? '🔒' : '🎲'}
            {deterministicMode ? 'Deterministic' : 'Probabilistic'}
          </button>
          <button
            onClick={initBracket}
            disabled={simulatingAll}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-dark-border hover:bg-dark-border/50 text-dark-text disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={simulateRound}
            disabled={simulatingAll || currentRound === 'COMPLETE'}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-dark-border/60 hover:bg-dark-border text-dark-text disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {simulatingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Simulate Round
          </button>
          <button
            onClick={simulateTournament}
            disabled={simulatingAll || currentRound === 'COMPLETE'}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-gold to-brand-goldLight hover:brightness-110 text-white shadow shadow-brand-gold/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {simulatingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FastForward className="h-3.5 w-3.5" />}
            Simulate All
          </button>
        </div>
      </div>

      {/* ── Champion trophy ── */}
      {champion && (
        <div className="mb-8 glass-panel p-6 border-brand-gold/40 bg-gradient-to-r from-brand-gold/10 to-transparent flex items-center gap-5 rounded-2xl shadow-xl shadow-brand-gold/10">
          <div className="p-4 bg-brand-gold/15 rounded-2xl border border-brand-gold/30">
            <Trophy className="h-10 w-10 text-brand-goldLight" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-dark-muted tracking-widest">2026 World Cup Champion</p>
            <p className="text-2xl font-black text-gradient mt-0.5">{FLAGS[champion] ?? ''} {champion}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MOBILE – round tabs + vertical match list
          ══════════════════════════════════════════ */}
      {isMobile && (
        <div>
          {/* Tab bar */}
          <div className="flex border border-dark-border/60 rounded-2xl p-1 mb-6 bg-dark-bg/60 overflow-x-auto gap-1">
            {MOBILE_TABS.map(tab => {
              const labels: Record<MobileTab, string> = {
                R32: 'R32', R16: 'R16', QF: 'Quarters', SF: 'Semis', F: 'Final',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-center ${
                    mobileTab === tab
                      ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                      : 'text-dark-muted hover:text-dark-text'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Matches for active tab */}
          <div className="space-y-3">
            {mobileData[mobileTab].map((match, i) => {
              const rIdx = mobileRoundIdx[mobileTab];
              const rKey = mobileRoundKey[mobileTab];
              const isTbd = match.team1 === 'TBD' || match.team2 === 'TBD';
              const isPlayed = !!match.winner;
              const isReady = !isTbd && !isPlayed && !match.loading;
              const f1 = FLAGS[match.team1] ?? '🏳️';
              const f2 = FLAGS[match.team2] ?? '🏳️';
              const t1won = isPlayed && match.winner === match.team1;
              const t2won = isPlayed && match.winner === match.team2;
              return (
                <div
                  key={match.id}
                  className={`glass-panel rounded-xl overflow-hidden border transition-all ${
                    match.loading ? 'border-brand-gold/60 animate-pulse' :
                    isTbd ? 'border-dark-border/25 opacity-40' :
                    isPlayed ? 'border-dark-border' :
                    'border-dark-border hover:border-brand-gold/40'
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-dark-bg/40 border-b border-dark-border/30">
                    <span className="text-[9px] font-bold text-dark-muted uppercase tracking-widest">
                      {ROUND_NAMES[rIdx]} · Match {i + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {match.loading && <span className="text-[8px] font-black text-brand-goldLight animate-pulse">LIVE</span>}
                      {isPlayed && <span className="text-[8px] font-black text-brand-accent bg-brand-accent/15 border border-brand-accent/25 px-1.5 rounded-full">FT</span>}
                      {match.penaltyInfo && <span className="text-[8px] text-brand-goldLight font-bold">{match.penaltyInfo}</span>}
                      {isReady && !simulatingAll && (
                        <button onClick={() => simulateMatch(rKey, i)}
                          className="text-brand-gold hover:text-brand-goldLight text-xs font-bold cursor-pointer px-1.5 hover:bg-brand-gold/10 rounded transition-colors">
                          ▶ Predict
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center justify-between px-3 py-2 ${t1won ? 'bg-brand-gold/10' : t2won ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{f1}</span>
                      <span className={`text-sm font-semibold ${t1won ? 'text-brand-goldLight font-black' : 'text-dark-text'}`}>{match.team1}</span>
                    </div>
                    <span className={`text-base font-black ${t1won ? 'text-brand-goldLight' : 'text-dark-text'}`}>
                      {match.score1 !== null ? match.score1 : '–'}
                    </span>
                  </div>
                  <div className="h-px bg-dark-border/20 mx-3" />
                  <div className={`flex items-center justify-between px-3 py-2 ${t2won ? 'bg-brand-gold/10' : t1won ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{f2}</span>
                      <span className={`text-sm font-semibold ${t2won ? 'text-brand-goldLight font-black' : 'text-dark-text'}`}>{match.team2}</span>
                    </div>
                    <span className={`text-base font-black ${t2won ? 'text-brand-goldLight' : 'text-dark-text'}`}>
                      {match.score2 !== null ? match.score2 : '–'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DESKTOP – horizontal scrollable bracket
          ══════════════════════════════════════════ */}
      {!isMobile && (
        <div className="overflow-x-auto pb-4 rounded-2xl border border-dark-border/30 bg-dark-bg/20 p-6 shadow-inner">
          {/* Round header labels */}
          <div
            className="flex mb-4"
            style={{ width: 5 * CARD_W + 4 * CONN_W }}
          >
            {ROUND_NAMES.map((name, ri) => (
              <React.Fragment key={name}>
                <div
                  style={{ width: CARD_W, flexShrink: 0 }}
                  className="text-center"
                >
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    currentRound !== 'COMPLETE' && MOBILE_TABS[ri] === currentRound
                      ? 'text-brand-goldLight bg-brand-gold/10 border border-brand-gold/20'
                      : 'text-dark-muted'
                  }`}>
                    {name}
                  </span>
                </div>
                {ri < ROUND_NAMES.length - 1 && (
                  <div style={{ width: CONN_W, flexShrink: 0 }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Bracket columns + connectors */}
          <div className="flex" style={{ height: TOTAL_H }}>
            {allRounds.map(([, matches, setter], ri) => {
              const roundKey = MOBILE_TABS[ri];
              return (
                <React.Fragment key={ri}>
                  <RoundColumn
                    round={ri}
                    matches={matches}
                    simulatingAll={simulatingAll}
                    onSimulate={(i) => simulateMatch(roundKey as any, i)}
                  />
                  {ri < allRounds.length - 1 && (
                    <Connector fromRound={ri} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
