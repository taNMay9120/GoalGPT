import React, { useEffect, useState } from 'react';
import { apiService, type TeamStats, type H2HResponse } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import { Loader2, Swords, Target, TrendingUp, Trophy, Shield } from 'lucide-react';

interface ComparisonDetailsProps {
  team1: string;
  team2: string;
}

function WDLBar({ wins, draws, losses, total, teamColor }: { wins: number; draws: number; losses: number; total: number; teamColor: string }) {
  if (total === 0) return <div className="h-3 rounded-full bg-dark-border/30 text-center text-[9px] text-dark-muted">No data</div>;
  const wp = Math.round((wins / total) * 100);
  const dp = Math.round((draws / total) * 100);
  const lp = Math.round((losses / total) * 100);
  return (
    <div className="flex rounded-full overflow-hidden h-5 text-[9px] font-black">
      {wp > 0 && <div style={{ width: `${wp}%`, background: teamColor }} className="flex items-center justify-center text-white">{wp > 8 ? `${wp}%` : ''}</div>}
      {dp > 0 && <div style={{ width: `${dp}%` }} className="bg-dark-muted/40 flex items-center justify-center text-dark-text">{dp > 8 ? `${dp}%` : ''}</div>}
      {lp > 0 && <div style={{ width: `${lp}%` }} className="bg-dark-border/60 flex items-center justify-center text-dark-muted">{lp > 8 ? `${lp}%` : ''}</div>}
    </div>
  );
}

const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs shadow-xl">
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-dark-muted">{p.name}:</span>
          <span className="font-bold text-dark-text">{Number(p.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export const ComparisonDetails: React.FC<ComparisonDetailsProps> = ({ team1, team2 }) => {
  const [stats1, setStats1] = useState<TeamStats | null>(null);
  const [stats2, setStats2] = useState<TeamStats | null>(null);
  const [h2h, setH2h] = useState<H2HResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [r1, r2, h] = await Promise.all([
          apiService.getTeamStats(team1),
          apiService.getTeamStats(team2),
          apiService.getH2H(team1, team2),
        ]);
        setStats1(r1);
        setStats2(r2);
        setH2h(h);
      } catch (e) {
        console.error(e);
        setError('Failed to load team comparison data. Please check the backend connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [team1, team2]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-goldLight" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-3 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs text-center">
        {error}
      </div>
    );
  }

  if (!stats1 || !stats2 || !h2h) return null;

  const radarData = [
    {
      metric: 'Elo',
      [team1]: Math.min(100, Math.round(stats1.elo / 20)),
      [team2]: Math.min(100, Math.round(stats2.elo / 20)),
    },
    {
      metric: 'Form',
      [team1]: Math.min(100, Math.round(stats1.form * 33.3)),
      [team2]: Math.min(100, Math.round(stats2.form * 33.3)),
    },
    {
      metric: 'Goal Diff',
      [team1]: Math.max(0, Math.min(100, 50 + stats1.gd * 10)),
      [team2]: Math.max(0, Math.min(100, 50 + stats2.gd * 10)),
    },
    {
      metric: 'FIFA Rank',
      [team1]: Math.max(0, Math.round(100 - (stats1.rank / 210) * 100)),
      [team2]: Math.max(0, Math.round(100 - (stats2.rank / 210) * 100)),
    },
    {
      metric: 'H2H Win%',
      [team1]: Math.round(h2h.team1_win_rate * 100),
      [team2]: Math.round(h2h.team2_win_rate * 100),
    },
  ];

  const barData = [
    { metric: 'Elo (÷20)', [team1]: Math.round(stats1.elo / 20 * 10) / 10, [team2]: Math.round(stats2.elo / 20 * 10) / 10 },
    { metric: 'Form PPG', [team1]: +stats1.form.toFixed(2), [team2]: +stats2.form.toFixed(2) },
    { metric: 'Avg GD', [team1]: +stats1.gd.toFixed(2), [team2]: +stats2.gd.toFixed(2) },
    { metric: 'Rank (÷10)', [team1]: +(stats1.rank / 10).toFixed(1), [team2]: +(stats2.rank / 10).toFixed(1) },
  ];

  const pieData = h2h.total_matches > 0 ? [
    { name: `${team1} Wins`, value: h2h.team1_wins, fill: '#7C3AED' },
    { name: 'Draws', value: h2h.draws, fill: '#1A2640' },
    { name: `${team2} Wins`, value: h2h.team2_wins, fill: '#06B6D4' },
  ] : [];

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#0C1122', borderColor: '#1A2640', borderRadius: '12px' },
    labelStyle: { color: '#EFF6FF', fontWeight: 'bold' },
    itemStyle: { color: '#5B7DA8' },
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Elo Rating', v1: Math.round(stats1.elo), v2: Math.round(stats2.elo), higher: 'v1', icon: <TrendingUp className="h-4 w-4" /> },
          { label: 'FIFA Rank', v1: stats1.rank, v2: stats2.rank, higher: 'v2', icon: <Trophy className="h-4 w-4" /> },
          { label: 'Form PPG', v1: +stats1.form.toFixed(2), v2: +stats2.form.toFixed(2), higher: 'v1', icon: <Target className="h-4 w-4" /> },
          { label: 'Avg Goal Diff', v1: +stats1.gd.toFixed(2), v2: +stats2.gd.toFixed(2), higher: 'v1', icon: <Shield className="h-4 w-4" /> },
        ].map(({ label, v1, v2, higher, icon }) => {
          const t1Wins = higher === 'v1' ? v1 > v2 : v1 < v2;
          const t2Wins = higher === 'v1' ? v2 > v1 : v2 < v1;
          return (
            <div key={label} className="glass-panel p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-dark-muted">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </div>
              <div className="flex items-end justify-between gap-2">
                <div className={`text-center flex-1 p-2 rounded-lg border ${t1Wins ? 'border-brand-gold/40 bg-brand-gold/8' : 'border-transparent'}`}>
                  <div className="text-[9px] text-dark-muted mb-0.5 truncate font-semibold">{team1}</div>
                  <div className={`text-xl font-black ${t1Wins ? 'text-brand-goldLight' : 'text-dark-text'}`}>{v1}</div>
                </div>
                <div className="text-dark-muted/50 text-xs font-bold">vs</div>
                <div className={`text-center flex-1 p-2 rounded-lg border ${t2Wins ? 'border-brand-accent/40 bg-brand-accent/8' : 'border-transparent'}`}>
                  <div className="text-[9px] text-dark-muted mb-0.5 truncate font-semibold">{team2}</div>
                  <div className={`text-xl font-black ${t2Wins ? 'text-brand-accentLight' : 'text-dark-text'}`}>{v2}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Swords className="h-4 w-4 text-brand-goldLight" /> Performance Radar
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1A2640" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#5B7DA8', fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name={team1} dataKey={team1} stroke="#A78BFA" fill="#7C3AED" fillOpacity={0.30} strokeWidth={2} />
              <Radar name={team2} dataKey={team2} stroke="#67E8F9" fill="#06B6D4" fillOpacity={0.25} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-goldLight" /> Stats Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2640" />
              <XAxis dataKey="metric" stroke="#5B7DA8" tick={{ fontSize: 10, fontWeight: 600 }} />
              <YAxis stroke="#5B7DA8" tick={{ fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey={team1} fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey={team2} fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-6 mb-8">
        <h2 className="text-base font-bold mb-5 flex items-center gap-2">
          <Swords className="h-4 w-4 text-brand-goldLight" /> Head-to-Head Record
          {h2h.total_matches > 0 && (
            <span className="ml-auto text-xs font-bold text-dark-muted bg-dark-border/40 px-2 py-1 rounded-lg">
              {h2h.total_matches} meetings
            </span>
          )}
        </h2>

        {h2h.total_matches === 0 ? (
          <p className="text-center text-dark-muted text-sm py-6">These two teams have never met in our dataset.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center glass-panel p-4 border-brand-gold/30">
                <div className="text-3xl font-black text-brand-goldLight">{h2h.team1_wins}</div>
                <div className="text-[10px] font-bold text-dark-muted uppercase tracking-wider mt-1">{team1} Wins</div>
              </div>
              <div className="text-center glass-panel p-4">
                <div className="text-3xl font-black text-dark-muted">{h2h.draws}</div>
                <div className="text-[10px] font-bold text-dark-muted uppercase tracking-wider mt-1">Draws</div>
              </div>
              <div className="text-center glass-panel p-4 border-brand-accent/30">
                <div className="text-3xl font-black text-brand-accentLight">{h2h.team2_wins}</div>
                <div className="text-[10px] font-bold text-dark-muted uppercase tracking-wider mt-1">{team2} Wins</div>
              </div>
            </div>

            <div className="mb-5">
              <WDLBar wins={h2h.team1_wins} draws={h2h.draws} losses={h2h.team2_wins} total={h2h.total_matches} teamColor="#7C3AED" />
              <div className="flex justify-between text-[9px] text-dark-muted mt-1 font-semibold">
                <span className="text-violet-400">{team1} {Math.round(h2h.team1_win_rate * 100)}%</span>
                <span>Draw {Math.round(h2h.draw_rate * 100)}%</span>
                <span className="text-cyan-400">{team2} {Math.round(h2h.team2_win_rate * 100)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
              <div>
                <h3 className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-3">Goals Scored</h3>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-brand-goldLight font-bold w-24 truncate">{team1}</span>
                  <div className="flex-1 bg-dark-bg/40 rounded-full h-3 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (h2h.team1_goals / Math.max(h2h.team1_goals, h2h.team2_goals, 1)) * 100)}%` }}
                      className="h-full bg-brand-gold rounded-full transition-all"
                    />
                  </div>
                  <span className="text-sm font-black text-brand-goldLight w-6 text-right">{h2h.team1_goals}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-accentLight font-bold w-24 truncate">{team2}</span>
                  <div className="flex-1 bg-dark-bg/40 rounded-full h-3 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (h2h.team2_goals / Math.max(h2h.team1_goals, h2h.team2_goals, 1)) * 100)}%` }}
                      className="h-full bg-brand-accent rounded-full transition-all"
                    />
                  </div>
                  <span className="text-sm font-black text-brand-accentLight w-6 text-right">{h2h.team2_goals}</span>
                </div>
                <div className="mt-3 text-[10px] text-dark-muted">
                  Avg goals per game: <span className="text-brand-goldLight font-bold">{(h2h.team1_goals / h2h.total_matches).toFixed(1)}</span> – <span className="text-brand-accentLight font-bold">{(h2h.team2_goals / h2h.total_matches).toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-2 self-start">Win Share</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {h2h.last_5.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-3">Last {h2h.last_5.length} Encounters</h3>
                <div className="overflow-x-auto rounded-xl border border-dark-border/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-dark-border/40 text-dark-muted">
                        <th className="px-3 py-2 font-bold">Date</th>
                        <th className="px-3 py-2 font-bold">Home</th>
                        <th className="px-3 py-2 font-bold text-center">Score</th>
                        <th className="px-3 py-2 font-bold">Away</th>
                        <th className="px-3 py-2 font-bold">Tournament</th>
                        <th className="px-3 py-2 font-bold">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h2h.last_5.map((m, i) => {
                        const t1won = m.winner === team1;
                        const t2won = m.winner === team2;
                        return (
                          <tr key={i} className="border-b border-dark-border/20 hover:bg-dark-border/10 transition-colors">
                            <td className="px-3 py-2 text-dark-muted">{m.date}</td>
                            <td className={`px-3 py-2 font-semibold ${m.winner === m.home_team ? 'text-brand-goldLight' : 'text-dark-text'}`}>{m.home_team}</td>
                            <td className="px-3 py-2 text-center font-black text-dark-text">{m.home_score} – {m.away_score}</td>
                            <td className={`px-3 py-2 font-semibold ${m.winner === m.away_team ? 'text-brand-accentLight' : 'text-dark-text'}`}>{m.away_team}</td>
                            <td className="px-3 py-2 text-dark-muted truncate max-w-[120px]">{m.tournament}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${
                                t1won ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-goldLight' :
                                t2won ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accentLight' :
                                'border-dark-border/40 bg-dark-bg/30 text-dark-muted'
                              }`}>
                                {m.winner === 'Draw' ? 'Draw' : m.winner}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-dark-border flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-goldLight" />
          <h2 className="font-bold">Model Feature Comparison</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-dark-border text-dark-muted text-xs">
              <th className="p-4 font-bold uppercase tracking-wider">Metric</th>
              <th className="p-4 font-bold text-brand-goldLight uppercase tracking-wider">{team1}</th>
              <th className="p-4 font-bold text-brand-accentLight uppercase tracking-wider">{team2}</th>
              <th className="p-4 font-bold uppercase tracking-wider">Edge</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Elo Rating', v1: Math.round(stats1.elo), v2: Math.round(stats2.elo), fmt: (v: number) => v.toString(), higher: 'v1', desc: 'Historical performance rating' },
              { label: 'FIFA Ranking', v1: Math.round(stats1.rank), v2: Math.round(stats2.rank), fmt: (v: number) => `#${v}`, higher: 'v2', desc: 'Lower rank number = better' },
              { label: 'Form PPG (last 5)', v1: stats1.form, v2: stats2.form, fmt: (v: number) => v.toFixed(2), higher: 'v1', desc: 'Points per game in last 5 matches' },
              { label: 'Avg Goal Margin', v1: stats1.gd, v2: stats2.gd, fmt: (v: number) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)), higher: 'v1', desc: 'Average goal difference per match' },
              { label: 'H2H Win Rate', v1: h2h.team1_win_rate, v2: h2h.team2_win_rate, fmt: (v: number) => `${Math.round(v * 100)}%`, higher: 'v1', desc: 'Head-to-head historical win rate' },
              { label: 'H2H Meetings', v1: h2h.total_matches, v2: h2h.total_matches, fmt: (v: number) => v.toString(), higher: null, desc: 'Total historical encounters' },
            ].map(({ label, v1, v2, fmt, higher, desc }) => {
              const t1Edge = higher === 'v1' ? v1 > v2 : v1 < v2;
              const t2Edge = higher === 'v1' ? v2 > v1 : v2 < v1;
              return (
                <tr key={label} className="border-b border-dark-border/40 hover:bg-dark-card/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-dark-text">{label}</div>
                    <div className="text-[10px] text-dark-muted mt-0.5">{desc}</div>
                  </td>
                  <td className={`p-4 font-black ${t1Edge ? 'text-brand-goldLight' : 'text-dark-text'}`}>{fmt(v1)}</td>
                  <td className={`p-4 font-black ${t2Edge ? 'text-brand-accentLight' : 'text-dark-text'}`}>{fmt(v2)}</td>
                  <td className="p-4">
                    {higher !== null && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        t1Edge ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-goldLight' :
                        t2Edge ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accentLight' :
                        'border-dark-border/40 text-dark-muted'
                      }`}>
                        {t1Edge ? team1 : t2Edge ? team2 : 'Even'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
