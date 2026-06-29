import React, { useState } from 'react';
import { apiService, type MatchPredictionResponse } from '../services/api';
import { Send, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';

const POPULAR_TEAMS = [
  'Argentina', 'Brazil', 'France', 'England', 'Spain',
  'Germany', 'Italy', 'Netherlands', 'Portugal', 'Belgium',
  'Uruguay', 'Croatia', 'Morocco', 'Senegal', 'USA', 'Mexico',
  'Japan', 'South Korea', 'Australia'
].sort();

export const Predictor: React.FC = () => {
  const [team1, setTeam1] = useState('Brazil');
  const [team2, setTeam2] = useState('Germany');
  const [teamsList, setTeamsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<MatchPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    apiService.getTeams()
      .then((data) => setTeamsList(data))
      .catch((err) => {
        console.error("Failed to load dynamic teams list:", err);
        // Fallback to POPULAR_TEAMS is handled inline
      });
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (team1 === team2) {
      setError("Please select two different teams for the match prediction.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiService.predictMatch({ team1, team2 });
      setPrediction(res);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch match prediction from the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 id="predictor-title" className="text-3xl font-extrabold tracking-tight mb-2 text-center">
        GoalGPT <span className="text-gradient">Match Outcome Predictor</span>
      </h1>
      <p className="text-dark-muted text-center mb-8 text-sm">
        Select two international teams to query our AI model for win, loss, and draw probabilities.
      </p>

      {/* Team Selection Form */}
      <form onSubmit={handlePredict} className="glass-panel p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">

          {/* Team 1 Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label id="label-team1" htmlFor="select-team1" className="text-xs font-semibold uppercase text-brand-goldLight tracking-wider">
              Home Team (Team 1)
            </label>
            <select
              id="select-team1"
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              className="bg-dark-bg border border-dark-border text-dark-text rounded-xl p-3 focus:outline-none focus:border-brand-gold transition-colors"
            >
              {(teamsList.length > 0 ? teamsList : POPULAR_TEAMS).map((t) => (
                <option key={`t1-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* VS Divider */}
          <div className="md:col-span-1 text-center font-bold text-lg text-dark-muted py-2 md:py-0">
            VS
          </div>

          {/* Team 2 Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label id="label-team2" htmlFor="select-team2" className="text-xs font-semibold uppercase text-brand-accentLight tracking-wider">
              Away Team (Team 2)
            </label>
            <select
              id="select-team2"
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              className="bg-dark-bg border border-dark-border text-dark-text rounded-xl p-3 focus:outline-none focus:border-brand-accent transition-colors"
            >
              {(teamsList.length > 0 ? teamsList : POPULAR_TEAMS).map((t) => (
                <option key={`t2-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>

        </div>

        {error && (
          <div id="predict-error" className="mt-4 p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs text-center">
            {error}
          </div>
        )}

        <button
          id="btn-predict-submit"
          type="submit"
          disabled={loading}
          className="mt-6 w-full py-4 bg-gradient-to-r from-brand-gold to-brand-goldLight hover:brightness-110 disabled:brightness-75 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brand-gold/15 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing stats...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Run AI Prediction
            </>
          )}
        </button>
      </form>

      {/* Prediction Output Results */}
      {/* Prediction Output Results */}
      {prediction && (() => {
        const t1Prob = prediction.probabilities[team1] || 0;
        const t2Prob = prediction.probabilities[team2] || 0;
        const drawProb = prediction.probabilities['Draw'] || 0;
        const maxProb = Math.max(t1Prob, t2Prob, drawProb);
        
        return (
          <div id="prediction-result" className="glass-panel p-6 animate-float">
            <h2 className="text-xl font-bold mb-6 flex items-center justify-between border-b border-dark-border pb-4">
              <span>Prediction Analysis</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-brand-gold/15 text-brand-goldLight border border-brand-gold/20">
                Model Verdict: {prediction.winner}
              </span>
            </h2>

            {/* Probability Bars */}
            <div className="space-y-4 mb-6">
              <h3 className="text-xs font-semibold uppercase text-dark-muted tracking-wider mb-2">
                Outcome Probabilities
              </h3>

              {/* Team 1 Win Probability */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{team1} Win</span>
                  <span className="font-semibold text-brand-goldLight">{(t1Prob * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-3.5 border border-dark-border overflow-hidden">
                  <div
                    className="bg-brand-gold h-full rounded-full transition-all duration-500"
                    style={{ width: `${t1Prob * 100}%` }}
                  />
                </div>
              </div>

              {/* Draw Probability */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Draw</span>
                  <span className="font-semibold text-dark-muted">{(drawProb * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-3.5 border border-dark-border overflow-hidden">
                  <div
                    className="bg-dark-border h-full rounded-full transition-all duration-500"
                    style={{ width: `${drawProb * 100}%` }}
                  />
                </div>
              </div>

              {/* Team 2 Win Probability */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{team2} Win</span>
                  <span className="font-semibold text-brand-accentLight">{(t2Prob * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-3.5 border border-dark-border overflow-hidden">
                  <div
                    className="bg-brand-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${t2Prob * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="mb-6 bg-dark-bg/60 border border-dark-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-brand-gold/10">
                  <HelpCircle className="h-5 w-5 text-brand-goldLight" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Confidence Level</h4>
                  <p className="text-sm font-bold">
                    {t1Prob > 0.5 || t2Prob > 0.5 ? 'High Confidence' : 'Moderate Confidence'}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-black text-gradient">
                {maxProb.toFixed(2)}
              </div>
            </div>

            {/* Prediction Explanation */}
            <div className="p-4 bg-dark-bg/40 border border-dark-border rounded-xl">
              <h4 className="text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">Explanation</h4>
              <p className="text-sm text-dark-text/90 leading-relaxed flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-brand-goldLight shrink-0" />
                {prediction.explanation}
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
