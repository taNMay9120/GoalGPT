import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService, type HealthCheckResponse } from '../services/api';
import { Cpu, Trophy, BarChart2, ShieldAlert } from 'lucide-react';

export const Home: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [apiInfo, setApiInfo] = useState<HealthCheckResponse | null>(null);

  useEffect(() => {
    apiService.checkHealth()
      .then((data) => {
        setApiInfo(data);
        setBackendStatus('connected');
      })
      .catch((err) => {
        console.error("Backend health check failed:", err);
        setBackendStatus('error');
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="animate-float mb-8">
        <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-gold/10 text-brand-goldLight border border-brand-gold/20">
          World Cup & International Match Predictor
        </span>
      </div>

      <h1 id="main-title" className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
        Predicting Football Outcomes with <span className="text-gradient">GoalGPT AI</span>
      </h1>

      <p className="text-lg md:text-xl text-dark-muted max-w-2xl mb-10 leading-relaxed">
        GoalGPT uses machine learning models trained on decades of international football datasets to forecast winning probabilities, recent forms, and goal statistics.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
        <Link
          id="btn-go-predictor"
          to="/predict"
          className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-gold to-brand-goldLight text-white shadow-lg shadow-brand-gold/25 hover:brightness-110 transition-all duration-200"
        >
          Launch Predictor
        </Link>
        <Link
          id="btn-go-compare"
          to="/predict"
          className="px-8 py-3.5 rounded-xl font-bold bg-dark-card border border-dark-border text-dark-text hover:bg-dark-border/40 transition-all duration-200"
        >
          Predict & Compare
        </Link>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-16">
        <div id="feature-ml" className="glass-panel-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-brand-gold/15 rounded-xl w-fit mb-4">
              <Cpu className="h-6 w-6 text-brand-goldLight" />
            </div>
            <h3 className="text-xl font-bold mb-2">Advanced AI Analytics</h3>
            <p className="text-dark-muted text-sm leading-relaxed">
              Utilizes custom Logistic Regression, Random Forest, and XGBoost models to generate probability distributions for home win, away win, and draw outcomes.
            </p>
          </div>
        </div>

        <div id="feature-historic" className="glass-panel-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-brand-accent/15 rounded-xl w-fit mb-4">
              <Trophy className="h-6 w-6 text-brand-accentLight" />
            </div>
            <h3 className="text-xl font-bold mb-2">Historical Insights</h3>
            <p className="text-dark-muted text-sm leading-relaxed">
              Trained on comprehensive datasets encompassing international matches, historical ratings, team rankings, and goal differentials since 1993.
            </p>
          </div>
        </div>

        <div id="feature-analytics" className="glass-panel-interactive p-6 flex flex-col justify-between">
          <div>
            <div className="p-3 bg-blue-500/15 rounded-xl w-fit mb-4">
              <BarChart2 className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tactical Explainability</h3>
            <p className="text-dark-muted text-sm leading-relaxed">
              Breaks down predictions based on key ranking metrics, head-to-head match history, recent team forms, and Elo rating variations.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status Panel */}
      <div id="status-panel" className="w-full max-w-md glass-panel p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-dark-muted font-medium">Backend Health Check:</span>
          {backendStatus === 'loading' && (
            <span className="text-yellow-400 font-semibold animate-pulse">Connecting...</span>
          )}
          {backendStatus === 'connected' && (
            <span className="text-brand-accentLight font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-accent animate-ping" />
              Active (v{apiInfo?.version})
            </span>
          )}
          {backendStatus === 'error' && (
            <span className="text-brand-danger font-semibold flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" /> Offline
            </span>
          )}
        </div>
        <div className="text-dark-muted">
          Port: <code className="bg-dark-border py-0.5 px-1.5 rounded text-[10px]">8000</code>
        </div>
      </div>
    </div>
  );
};
