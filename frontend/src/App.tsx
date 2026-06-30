import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home } from './pages/Home';
import { Predictor } from './pages/Predictor';
import { TeamComparison } from './pages/TeamComparison';
import { AboutModel } from './pages/AboutModel';
import { Trophy, Compass, HelpCircle, Play, BarChart3 } from 'lucide-react';
import { Simulator } from './pages/Simulator';
import { Backtester } from './pages/Backtester';
import { LiveDashboard } from './pages/LiveDashboard';
import { Activity } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col justify-between">
        {/* Header/Navigation */}
        <header className="sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-gradient-to-br from-brand-gold to-brand-goldLight rounded-lg text-white shadow-md shadow-brand-gold/10">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-brand-goldLight transition-colors">
                Goal<span className="text-brand-goldLight">GPT</span>
              </span>
            </NavLink>

            {/* Navigation links */}
            <nav className="flex items-center gap-1.5 md:gap-4">
              <NavLink
                to="/predict"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                  }`
                }
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Predictor</span>
              </NavLink>

              <NavLink
                to="/live"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                  }`
                }
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Live</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse hidden sm:block"></span>
              </NavLink>

              <NavLink
                to="/simulate"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                  }`
                }
              >
                <Play className="h-4 w-4 text-brand-accentLight" />
                <span className="hidden sm:inline">Simulator</span>
              </NavLink>

              <NavLink
                to="/backtest"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                  }`
                }
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Backtest</span>
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-brand-gold/15 text-brand-goldLight border border-brand-gold/25'
                    : 'text-dark-muted hover:text-dark-text border border-transparent'
                  }`
                }
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Model Info</span>
              </NavLink>
            </nav>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-grow py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predictor />} />
            <Route path="/live" element={<LiveDashboard />} />
            <Route path="/compare" element={<TeamComparison />} />
            <Route path="/simulate" element={<Simulator />} />
            <Route path="/backtest" element={<Backtester />} />
            <Route path="/about" element={<AboutModel />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-border bg-dark-card/30 py-6 text-center text-xs text-dark-muted">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} GoalGPT. Produced for production-quality AI prediction benchmarks.
            </div>
            <div className="flex gap-4">
              <a href="#github" className="hover:text-dark-text transition-colors">GitHub</a>
              <span className="text-dark-border">|</span>
              <a href="#docs" className="hover:text-dark-text transition-colors">Documentation</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
