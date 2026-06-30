import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface MatchProps {
  match: {
    fixture: {
      id: number;
      status: {
        short: string;
        elapsed: number;
      };
    };
    league: {
      name: string;
    };
    teams: {
      home: { name: string; logo: string };
      away: { name: string; logo: string };
    };
    goals: {
      home: number;
      away: number;
    };
  }
  onClick?: () => void;
}

export const LiveMatchCard: React.FC<MatchProps> = ({ match, onClick }) => {
  const isLive = match.fixture.status.short === '1H' || match.fixture.status.short === '2H' || match.fixture.status.short === 'HT';

  return (
    <div 
      onClick={onClick}
      className={`bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-4 flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-brand-gold/50 hover:shadow-lg hover:shadow-brand-gold/10' : 'hover:border-brand-gold/30'}`}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-dark-muted font-semibold uppercase tracking-wider">{match.league.name}</span>
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full text-xs font-bold border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {match.fixture.status.elapsed}'
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-dark-muted px-2.5 py-1 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            {match.fixture.status.short}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center gap-4">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1">
          <img src={match.teams.home.logo} alt={match.teams.home.name} className="w-12 h-12 mb-2 object-contain" />
          <span className="text-sm font-semibold text-center text-dark-text truncate w-full">{match.teams.home.name}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 px-4 py-2 bg-dark-bg/80 rounded-lg shadow-inner">
          <span className="text-2xl font-bold text-white">{match.goals.home ?? 0}</span>
          <span className="text-dark-muted font-black">-</span>
          <span className="text-2xl font-bold text-white">{match.goals.away ?? 0}</span>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1">
          <img src={match.teams.away.logo} alt={match.teams.away.name} className="w-12 h-12 mb-2 object-contain" />
          <span className="text-sm font-semibold text-center text-dark-text truncate w-full">{match.teams.away.name}</span>
        </div>
      </div>
    </div>
  );
};
