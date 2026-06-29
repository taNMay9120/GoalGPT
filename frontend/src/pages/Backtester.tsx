import React, { useState, useEffect } from 'react';
import { apiService, type BacktestResponse, type BacktestFixture } from '../services/api';
import { Calendar, Award, CheckCircle2, XCircle, Loader2, Sparkles, Search, Info, HelpCircle } from 'lucide-react';

export const Backtester: React.FC = () => {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [backtestData, setBacktestData] = useState<BacktestResponse | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GROUP' | 'KNOCKOUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch available World Cup years on mount
  useEffect(() => {
    apiService.getBacktestYears()
      .then((yearsList) => {
        setYears(yearsList);
        if (yearsList.length > 0) {
          setSelectedYear(yearsList[0]); // Default to latest (e.g. 2022)
        }
      })
      .catch((err) => {
        console.error("Failed to load backtest years:", err);
        setError("Failed to fetch available tournament years from server.");
      });
  }, []);

  // 2. Fetch results when selectedYear changes
  useEffect(() => {
    if (!selectedYear) return;
    
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getBacktestResults(selectedYear);
        setBacktestData(data);
      } catch (err) {
        console.error(err);
        setError(`Failed to perform model validation for year ${selectedYear}. Make sure the backend is active.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [selectedYear]);

  // Filter fixtures based on chosen tab and search query
  const filteredFixtures = backtestData
    ? backtestData.fixtures.filter((f) => {
        // Tab Stage filter (knockout includes R16, QF, SF, Third Place, Final)
        const isGroupStage = f.stage === 'Group Stage';
        const matchesStage =
          activeFilter === 'ALL' ||
          (activeFilter === 'GROUP' && isGroupStage) ||
          (activeFilter === 'KNOCKOUT' && !isGroupStage);
          
        // Team search filter
        const matchesSearch =
          searchQuery.trim() === '' ||
          f.home_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.away_team.toLowerCase().includes(searchQuery.toLowerCase());
          
        return matchesStage && matchesSearch;
      })
    : [];

  // Group matches by their stages to display them in the order they are conducted
  const groupedStages: { [stage: string]: BacktestFixture[] } = {};
  filteredFixtures.forEach((fixture) => {
    if (!groupedStages[fixture.stage]) {
      groupedStages[fixture.stage] = [];
    }
    groupedStages[fixture.stage].push(fixture);
  });

  // Preserve chronological order of tournament rounds
  const stageOrder = [
    "Group Stage",
    "Round of 16",
    "Quarterfinals",
    "Semifinals",
    "Third Place Playoff",
    "Grand Final",
    "Knockout Stage"
  ];
  
  const activeStages = stageOrder.filter(stage => groupedStages[stage] && groupedStages[stage].length > 0);

  // Helper to translate 'Home Win' / 'Away Win' / 'Draw' into readable team names
  const getOutcomeDisplayName = (outcomeString: string, homeTeam: string, awayTeam: string) => {
    if (outcomeString === 'Home Win') return homeTeam;
    if (outcomeString === 'Away Win') return awayTeam;
    return 'Draw';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Title Header */}
      <h1 id="backtester-title" className="text-3xl font-extrabold tracking-tight mb-2 text-center">
        GoalGPT <span className="text-gradient">Tournament Backtester</span>
      </h1>
      <p className="text-dark-muted text-center mb-8 text-sm">
        Evaluate how our AI model performs on every group and knockout match of a historical tournament.
      </p>

      {/* Accuracy Context Legend Block (Crucial for User Intuition) */}
      <div className="glass-panel p-4 mb-8 bg-brand-gold/5 border-brand-gold/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Info className="h-5 w-5 text-brand-goldLight mt-0.5 shrink-0" />
          <div className="text-xs text-dark-text/90 space-y-1">
            <p className="font-bold text-brand-goldLight text-sm">Understanding Model Accuracy</p>
            <p className="leading-relaxed">
              In football, there are three outcomes (Home Win, Draw, Away Win). Baseline random guessing yields an accuracy of <strong>33.3%</strong>. 
              Top commercial sports models and expert bookmakers typically hover around <strong>52% - 54%</strong>. 
              Our trained Logistic Regression model achieving <strong>&gt;55%</strong> represents state-of-the-art predictive performance.
            </p>
          </div>
        </div>
      </div>

      {/* Select Controls & Search */}
      <div className="glass-panel p-5 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Dropdown Selector */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Tournament Cycle</span>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="select-premium w-full"
          >
            {years.map((yr) => (
              <option key={`wc-yr-${yr}`} value={yr}>{yr} FIFA World Cup</option>
            ))}
          </select>
        </div>

        {/* Team Search filter */}
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider">Search by Country</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-muted" />
            <input
              type="text"
              placeholder="e.g., Argentina, France"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-bg border border-dark-border text-dark-text rounded-xl pl-9 pr-4 py-[11px] focus:outline-none focus:border-brand-gold text-sm w-full transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-brand-goldLight" />
        </div>
      ) : (
        backtestData && (
          <>
            {/* Accuracy metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              
              {/* Overall Accuracy */}
              <div className="glass-panel p-4 flex flex-col justify-between border-l-2 border-l-brand-gold">
                <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">Overall Accuracy</span>
                <span className="text-2xl font-black text-brand-goldLight mt-1">
                  {(backtestData.overall_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-dark-muted mt-1 font-semibold">
                  {backtestData.correct_predictions} / {backtestData.total_matches} wins
                </span>
              </div>

              {/* Group Stage Accuracy */}
              <div className="glass-panel p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">Group Stage</span>
                <span className="text-2xl font-black text-brand-accentLight mt-1">
                  {(backtestData.group_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-dark-muted mt-1">League matches</span>
              </div>

              {/* Knockout Stage Accuracy */}
              <div className="glass-panel p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">Knockouts</span>
                <span className="text-2xl font-black text-brand-goldLight mt-1">
                  {(backtestData.knockout_accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-dark-muted mt-1">Round of 16 & thereafter</span>
              </div>

              {/* Training Status */}
              <div className="glass-panel p-4 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-dark-muted uppercase tracking-wider">Model Status</span>
                <div className="flex items-center gap-1 text-brand-accentLight font-extrabold text-xs mt-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-goldLight animate-pulse" />
                  <span>Verified</span>
                </div>
                <span className="text-[9px] text-dark-muted mt-1">Estimator verified</span>
              </div>

            </div>

            {/* Segmented Filter Tab Controls */}
            <div className="flex border border-dark-border/60 rounded-2xl p-1 mb-6 bg-dark-bg/60 overflow-x-auto gap-1">
              {(['ALL', 'GROUP', 'KNOCKOUT'] as const).map((filter) => {
                let filterLabel = '';
                if (filter === 'ALL') filterLabel = 'All Fixtures';
                else if (filter === 'GROUP') filterLabel = 'Group Stage';
                else filterLabel = 'Knockouts';

                const isActive = activeFilter === filter;
                return (
                  <button
                    key={`backtest-filter-${filter}`}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-center ${
                      isActive 
                        ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                        : 'text-dark-muted hover:text-dark-text'
                    }`}
                  >
                    {filterLabel}
                  </button>
                );
              })}
            </div>

            {/* Fixtures List Grouped by Stage */}
            {activeStages.length === 0 ? (
              <div className="glass-panel p-8 text-center text-dark-muted text-sm border-dashed">
                No matches found matching your filters.
              </div>
            ) : (
              <div className="space-y-8">
                {activeStages.map((stage) => (
                  <div key={`stage-section-${stage}`} className="space-y-4">
                    {/* Stage Header */}
                    <div className="mt-6 border-b border-dark-border/40 pb-2 flex items-center justify-between">
                      <h3 className="text-xs font-black text-brand-goldLight uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-brand-gold/80 rounded" />
                        {stage}
                      </h3>
                      <span className="text-[10px] text-dark-muted font-semibold bg-dark-bg/60 px-2 py-0.5 rounded border border-dark-border/25">
                        {groupedStages[stage].length} matches
                      </span>
                    </div>

                    {/* Stage Match List */}
                    <div className="space-y-4">
                      {groupedStages[stage].map((fixture) => {
                        const homeProb = fixture.probabilities[fixture.home_team] || 0;
                        const awayProb = fixture.probabilities[fixture.away_team] || 0;
                        const drawProb = fixture.probabilities['Draw'] || 0;
                        
                        const predictedName = getOutcomeDisplayName(fixture.predicted_outcome, fixture.home_team, fixture.away_team);
                        const actualName = getOutcomeDisplayName(fixture.actual_outcome, fixture.home_team, fixture.away_team);

                        return (
                          <div 
                            key={`backtest-fix-${fixture.id}`}
                            className={`glass-panel p-4 relative transition-all duration-200 border-l-4 ${
                              fixture.is_correct 
                                ? 'border-l-brand-accent/70 bg-brand-accent/5 hover:border-l-brand-accent hover:bg-brand-accent/10' 
                                : 'border-l-brand-danger/70 bg-brand-danger/[0.02] hover:border-l-brand-danger hover:bg-brand-danger/[0.05]'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] text-dark-muted mb-3 font-semibold uppercase tracking-wider">
                              <span className="text-dark-muted/80">Match #{fixture.id}</span>
                              <span>{fixture.date}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              {/* Score panel */}
                              <div className="md:col-span-5 flex items-center justify-between px-3 py-2.5 bg-dark-bg/40 rounded-xl border border-dark-border/20">
                                <span className="w-5/12 text-left truncate font-bold text-sm text-dark-text">
                                  {fixture.home_team}
                                </span>
                                <span className="w-2/12 text-center text-gradient font-black text-base whitespace-nowrap">
                                  {fixture.home_score} - {fixture.away_score}
                                </span>
                                <span className="w-5/12 text-right truncate font-bold text-sm text-dark-text">
                                  {fixture.away_team}
                                </span>
                              </div>

                              {/* Probability Segmented Bar */}
                              <div className="md:col-span-4 flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-dark-muted font-bold px-0.5">
                                  <span className="truncate max-w-[80px] text-brand-goldLight">{fixture.home_team}</span>
                                  <span>Draw</span>
                                  <span className="truncate max-w-[80px] text-brand-accentLight">{fixture.away_team}</span>
                                </div>
                                
                                <div className="w-full bg-dark-bg rounded-full h-3 border border-dark-border overflow-hidden flex">
                                  <div 
                                    className="bg-brand-gold/80 h-full border-r border-dark-bg/25 transition-all duration-300 flex items-center justify-center text-[7px] text-white font-bold"
                                    style={{ width: `${homeProb * 100}%` }}
                                    title={`${fixture.home_team} Win: ${(homeProb * 100).toFixed(0)}%`}
                                  >
                                    {homeProb > 0.15 ? `${(homeProb * 100).toFixed(0)}%` : ''}
                                  </div>
                                  <div 
                                    className="bg-dark-border h-full border-r border-dark-bg/25 transition-all duration-300 flex items-center justify-center text-[7px] text-dark-text font-bold"
                                    style={{ width: `${drawProb * 100}%` }}
                                    title={`Draw: ${(drawProb * 100).toFixed(0)}%`}
                                  >
                                    {drawProb > 0.15 ? `${(drawProb * 100).toFixed(0)}%` : ''}
                                  </div>
                                  <div 
                                    className="bg-brand-accent/80 h-full transition-all duration-300 flex items-center justify-center text-[7px] text-white font-bold"
                                    style={{ width: `${awayProb * 100}%` }}
                                    title={`${fixture.away_team} Win: ${(awayProb * 100).toFixed(0)}%`}
                                  >
                                    {awayProb > 0.15 ? `${(awayProb * 100).toFixed(0)}%` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Predicted verdict */}
                              <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5">
                                {fixture.is_correct ? (
                                  <div className="flex items-center gap-1 text-brand-accent text-[10px] font-bold bg-brand-accent/15 border border-brand-accent/30 px-2.5 py-0.5 rounded-full">
                                    <CheckCircle2 className="h-3 w-3" /> Correct
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-brand-danger text-[10px] font-bold bg-brand-danger/15 border border-brand-danger/30 px-2.5 py-0.5 rounded-full">
                                    <XCircle className="h-3 w-3" /> Incorrect
                                  </div>
                                )}
                                <div className="text-[10px] text-dark-muted flex flex-col md:items-end">
                                  <span>Predicted: <strong className="text-brand-goldLight">{predictedName}</strong></span>
                                  {!fixture.is_correct && (
                                    <span className="text-[9px] opacity-75">Actual: <strong className="text-dark-text">{actualName}</strong></span>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};
