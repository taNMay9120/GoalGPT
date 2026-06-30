import React, { useEffect, useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface MatchDetailsModalProps {
  fixtureId: number;
  onClose: () => void;
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ fixtureId, onClose }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'stats'>('timeline');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await apiService.getMatchDetails(fixtureId);
        if (data.response && data.response.length > 0) {
          setDetails(data.response[0]);
        }
      } catch (err) {
        console.error("Failed to fetch match details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [fixtureId]);

  if (!fixtureId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-dark-border bg-dark-bg/50">
          <h2 className="text-xl font-bold text-white">Match Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-border rounded-full transition-colors text-dark-muted hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-dark-border border-t-brand-goldLight rounded-full animate-spin"></div>
          </div>
        ) : !details ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-dark-muted">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p>Could not load match details.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Score Header */}
            <div className="p-6 flex justify-between items-center bg-gradient-to-b from-dark-bg/30 to-transparent">
              <div className="flex flex-col items-center flex-1">
                <img src={details.teams.home.logo} alt={details.teams.home.name} className="w-16 h-16 mb-2 object-contain" />
                <span className="text-lg font-bold text-white">{details.teams.home.name}</span>
              </div>
              <div className="flex flex-col items-center px-8">
                <div className="text-xs font-bold text-brand-goldLight mb-2 tracking-widest uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {details.fixture.status.short} {details.fixture.status.elapsed && `${details.fixture.status.elapsed}'`}
                </div>
                <div className="text-4xl font-black text-white bg-dark-bg/80 px-6 py-2 rounded-xl shadow-inner border border-dark-border">
                  {details.goals.home ?? 0} - {details.goals.away ?? 0}
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <img src={details.teams.away.logo} alt={details.teams.away.name} className="w-16 h-16 mb-2 object-contain" />
                <span className="text-lg font-bold text-white">{details.teams.away.name}</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-dark-border px-4 gap-6">
              {['timeline', 'lineups', 'stats'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-3 px-2 text-sm font-bold capitalize transition-colors relative ${
                    activeTab === tab ? 'text-brand-goldLight' : 'text-dark-muted hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-goldLight rounded-t-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-dark-bg/20">
              
              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="max-w-2xl mx-auto space-y-6 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-border -translate-x-1/2"></div>
                  {details.events?.length === 0 && <p className="text-center text-dark-muted">No events recorded yet.</p>}
                  {details.events?.map((event: any, idx: number) => {
                    const isHome = event.team.id === details.teams.home.id;
                    return (
                      <div key={idx} className={`flex items-center w-full ${isHome ? 'justify-start' : 'justify-end'} relative`}>
                        <div className={`w-1/2 flex items-center ${isHome ? 'justify-end pr-8' : 'justify-start pl-8'} relative`}>
                          {/* Timeline Dot */}
                          <div className={`absolute top-1/2 -translate-y-1/2 ${isHome ? '-right-2.5' : '-left-2.5'} w-5 h-5 rounded-full border-4 border-dark-bg bg-brand-goldLight z-10`}></div>
                          
                          <div className={`bg-dark-card border border-dark-border p-3 rounded-lg flex items-center gap-3 ${!isHome && 'flex-row-reverse'}`}>
                            <span className="text-xs font-bold text-brand-goldLight">{event.time.elapsed}'</span>
                            <div className={`flex flex-col ${isHome ? 'items-end' : 'items-start'}`}>
                              <span className="text-sm font-bold text-white">{event.player.name}</span>
                              <span className="text-xs text-dark-muted">{event.type} - {event.detail}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Lineups Tab */}
              {activeTab === 'lineups' && (
                <div className="flex flex-col md:flex-row gap-8">
                  {details.lineups?.length > 0 ? details.lineups.map((lineup: any, idx: number) => (
                    <div key={idx} className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <img src={lineup.team.logo} className="w-8 h-8" alt={lineup.team.name} />
                        <div>
                          <h3 className="font-bold text-white">{lineup.team.name}</h3>
                          <p className="text-xs text-brand-goldLight font-mono">{lineup.formation}</p>
                        </div>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4 min-h-[400px] flex flex-col justify-end gap-2 relative overflow-hidden">
                        {/* Fake pitch lines */}
                        <div className="absolute inset-0 border-2 border-green-500/10 rounded-xl m-2"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-green-500/10"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-green-500/10 rounded-full"></div>
                        
                        <div className="z-10 grid grid-cols-1 gap-2">
                           {lineup.startXI.map((playerObj: any, pIdx: number) => (
                             <div key={pIdx} className="flex items-center gap-2 bg-dark-bg/60 border border-dark-border p-2 rounded backdrop-blur-sm">
                               <span className="w-6 text-center text-xs font-mono text-dark-muted">{playerObj.player.number}</span>
                               <span className="text-sm font-semibold text-white truncate">{playerObj.player.name}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-dark-muted w-full text-center">Lineups are not available yet.</p>
                  )}
                </div>
              )}

              {/* Stats Tab */}
              {activeTab === 'stats' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  {details.statistics?.length === 2 ? details.statistics[0].statistics.map((stat: any, idx: number) => {
                    const homeVal = stat.value === null ? 0 : typeof stat.value === 'string' ? parseInt(stat.value) : stat.value;
                    const awayStat = details.statistics[1].statistics.find((s: any) => s.type === stat.type);
                    const awayVal = awayStat?.value === null ? 0 : typeof awayStat?.value === 'string' ? parseInt(awayStat.value) : awayStat?.value;
                    
                    const total = homeVal + awayVal;
                    const homePercent = total > 0 ? (homeVal / total) * 100 : 50;
                    const awayPercent = total > 0 ? (awayVal / total) * 100 : 50;

                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white">{stat.value ?? 0}</span>
                          <span className="text-dark-muted uppercase tracking-wider">{stat.type}</span>
                          <span className="text-white">{awayStat?.value ?? 0}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-dark-border">
                          <div style={{ width: `${homePercent}%` }} className="bg-brand-goldLight"></div>
                          <div style={{ width: `${awayPercent}%` }} className="bg-brand-accent"></div>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-dark-muted text-center">Match statistics are not available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
