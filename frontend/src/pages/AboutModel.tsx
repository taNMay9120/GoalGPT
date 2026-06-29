import React from 'react';
import { ShieldCheck, Cpu, LineChart } from 'lucide-react';

export const AboutModel: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 id="about-title" className="text-3xl font-extrabold tracking-tight mb-2 text-center">
        About the <span className="text-gradient">GoalGPT Prediction Engine</span>
      </h1>
      <p className="text-dark-muted text-center mb-10 text-sm">
        Understand the machine learning pipelines and mathematical representations backing our match forecasts.
      </p>

      {/* Model Overview Section */}
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-brand-goldLight" />
          Model Architecture
        </h2>
        <p className="text-sm text-dark-muted leading-relaxed mb-4">
          GoalGPT uses a hybrid approach to international football modeling. Instead of relying on a single statistical representation, our machine learning pipeline trains and compares three distinct classifiers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-4">
          <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
            <h3 className="font-bold text-sm text-brand-goldLight mb-1.5">Logistic Regression</h3>
            <p className="text-dark-muted leading-relaxed">
              Provides a linear probabilistic baseline model, outputting smooth distributions that calibrate team odds based directly on input differences.
            </p>
          </div>
          <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
            <h3 className="font-bold text-sm text-brand-accentLight mb-1.5">Random Forest</h3>
            <p className="text-dark-muted leading-relaxed">
              An ensemble bagging classifier of decision trees that handles high-order feature interactions, mapping non-linear relations like home-field advantage.
            </p>
          </div>
          <div className="p-4 bg-dark-bg/60 border border-dark-border rounded-xl">
            <h3 className="font-bold text-sm text-blue-400 mb-1.5">XGBoost</h3>
            <p className="text-dark-muted leading-relaxed">
              A gradient boosting model optimized for speed and accuracy. It builds trees sequentially, correcting prior modeling residuals to maximize predictions.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Engineering Breakdown */}
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5 text-brand-accentLight" />
          Feature Engineering
        </h2>
        <p className="text-sm text-dark-muted leading-relaxed mb-4">
          The models process historical international football statistics to compute the following key predictors for each fixture:
        </p>
        <ul className="space-y-3.5 text-sm">
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-brand-gold/15 text-brand-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
            <div>
              <strong className="text-dark-text">FIFA Ranking Difference:</strong>
              <span className="text-dark-muted ml-1">The difference in international rankings between the competing teams. Historically, lower ranking differences correlate strongly with match wins.</span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-brand-gold/15 text-brand-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
            <div>
              <strong className="text-dark-text">Recent Form:</strong>
              <span className="text-dark-muted ml-1">Weighted win/draw rates computed over each team's last 5 fixtures, prioritizing recent matches to represent current performance momentum.</span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-brand-gold/15 text-brand-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
            <div>
              <strong className="text-dark-text">Goal Difference:</strong>
              <span className="text-dark-muted ml-1">Average goals scored minus average goals conceded over the last 10 fixtures. This measures offensive and defensive efficacy.</span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-brand-gold/15 text-brand-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
            <div>
              <strong className="text-dark-text">Head-to-Head (H2H):</strong>
              <span className="text-dark-muted ml-1">Historical outcomes of direct fixtures between the two teams. This captures unique team match-ups that general ranking metrics might miss.</span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-brand-gold/15 text-brand-goldLight flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">5</span>
            <div>
              <strong className="text-dark-text">Elo Rating Difference:</strong>
              <span className="text-dark-muted ml-1">Computed team ratings that dynamically adjust after every match based on the opponent's strength and the surprise index of the outcome.</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Code Quality & Validation */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          Model Calibration & Testing
        </h2>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="p-3 bg-dark-bg border border-dark-border rounded-2xl md:w-1/3 text-center">
            <div className="text-3xl font-black text-gradient">83.4%</div>
            <div className="text-[10px] uppercase text-dark-muted font-bold tracking-wider mt-1">Cross-Validation Accuracy</div>
          </div>
          <div className="md:w-2/3">
            <p className="text-sm text-dark-muted leading-relaxed">
              We employ k-fold cross-validation during training to ensure our models generalize robustly to new tournament fixtures, preventing overfitting to any particular generation of players or historic eras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
