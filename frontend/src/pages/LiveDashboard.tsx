import React, { useEffect, useState } from 'react';
import { Activity, Globe } from 'lucide-react';
import { LiveMatchCard } from '../components/LiveMatchCard';
import { NewsFeed } from '../components/NewsFeed';
import { MatchDetailsModal } from '../components/MatchDetailsModal';

export const LiveDashboard: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Live Scores
        const matchRes = await fetch('http://localhost:8000/api/live-scores');
        const matchData = await matchRes.json();
        if (matchData.response) {
          setMatches(matchData.response);
        } else {
          setMatches([]);
        }

        // Fetch News
        const newsRes = await fetch('http://localhost:8000/api/news');
        const newsData = await newsRes.json();
        if (newsData.articles) {
          setNews(newsData.articles);
        }
      } catch (err: any) {
        setError('Failed to connect to the live data server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh live scores every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Activity className="w-8 h-8 text-brand-goldLight" />
          Live Match Center
        </h1>
        <p className="text-dark-muted mt-2">Real-time scores, fixtures, and global football news.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 font-semibold">
          {error}
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-dark-border border-t-brand-goldLight rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Matches Column */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-dark-border pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Live & Upcoming Fixtures
            </h2>
            
            {matches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matches.map((m, idx) => (
                  <LiveMatchCard key={m.fixture.id || idx} match={m} onClick={() => setSelectedFixtureId(m.fixture.id)} />
                ))}
              </div>
            ) : (
              <div className="bg-dark-card/30 border border-dark-border rounded-xl p-8 text-center">
                <Globe className="w-12 h-12 text-dark-muted mx-auto mb-3 opacity-50" />
                <h3 className="text-dark-text font-bold text-lg mb-1">No Live Matches</h3>
                <p className="text-dark-muted text-sm">There are currently no live fixtures taking place right now.</p>
              </div>
            )}
          </div>

          {/* News Column */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-b border-dark-border pb-3">
              Latest Football News
            </h2>
            <NewsFeed articles={news} />
          </div>

        </div>
      )}

      {selectedFixtureId && (
        <MatchDetailsModal 
          fixtureId={selectedFixtureId} 
          onClose={() => setSelectedFixtureId(null)} 
        />
      )}
    </div>
  );
};
