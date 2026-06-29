from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import joblib

app = FastAPI(
    title="GoalGPT API",
    description="Production-quality match outcome prediction engine powered by Machine Learning.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://goal-gpt.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Relative paths to data and exported model artifacts
DATA_PATH = os.path.join("..", "data", "processed", "processed_matches.csv")
MODEL_PATH = os.path.join("..", "data", "models", "best_model.joblib")
SCALER_PATH = os.path.join("..", "data", "models", "scaler.joblib")

# Global variables loaded on startup
model = None
scaler = None
df_matches = None
team_stats = {}
name_lookup = {}

def clean_team_name(name: str) -> str:
    """
    Standardizes country names to align user inputs with our database structure.
    """
    if not name:
        return name
    name = str(name).strip()
    
    # Common alternate names mapped to training set standards
    mapping = {
        "United States": "USA",
        "Ivory Coast": "Côte d'Ivoire",
        "DR Congo": "Congo DR",
        "South Korea": "Korea Republic",
        "North Korea": "Korea DPR",
    }
    return mapping.get(name, name)

@app.on_event("startup")
def startup_load_artifacts():
    """
    Loads exported joblib estimators and parses processed match historical data
    to build an in-memory lookup cache of the absolute latest team statistics.
    """
    global model, scaler, df_matches, team_stats, name_lookup
    print("Loading machine learning models and data files...")
    
    # 1. Load joblib objects
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        raise RuntimeError(
            "Model files are missing. Please run ml/train.py first to export estimators."
        )
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    
    # 2. Load matches dataset
    if not os.path.exists(DATA_PATH):
        raise RuntimeError(
            "Processed matches dataset is missing. Please run ml/data_pipeline.py first."
        )
    df_matches = pd.read_csv(DATA_PATH)
    df_matches['date'] = pd.to_datetime(df_matches['date'])
    
    # Sort matches chronologically
    df_sorted = df_matches.sort_values('date')
    
    # Build the latest stats cache chronologically.
    # The last row we iterate over for a team will overwrite previous entries,
    # ensuring we are left with the team's absolute latest Elo, FIFA rank, form, and GD.
    for idx, row in df_sorted.iterrows():
        team_stats[row['home_team']] = {
            'elo': float(row['home_elo']),
            'rank': float(row['home_rank']),
            'form': float(row['home_form']),
            'gd': float(row['home_gd'])
        }
        team_stats[row['away_team']] = {
            'elo': float(row['away_elo']),
            'rank': float(row['away_rank']),
            'form': float(row['away_form']),
            'gd': float(row['away_gd'])
        }
        
    # Build a lowercase lookup mapping to support case-insensitive team queries
    name_lookup = {name.lower(): name for name in team_stats.keys()}
    print(f"Server initialization complete. Cached stats for {len(team_stats)} teams.")

def get_h2h_rates(t1: str, t2: str):
    """
    Queries historical fixtures to calculate Head-to-Head win, draw, and loss frequencies
    between two teams. Returns fallback baseline probabilities if they have never played.
    """
    cond = ((df_matches['home_team'] == t1) & (df_matches['away_team'] == t2)) | \
           ((df_matches['home_team'] == t2) & (df_matches['away_team'] == t1))
    past_matches = df_matches[cond]
    
    if len(past_matches) == 0:
        return 0.33, 0.33, 0.34
        
    t1_wins = 0
    t2_wins = 0
    draws = 0
    
    for idx, row in past_matches.iterrows():
        outcome = int(row['match_outcome'])
        h_team = row['home_team']
        a_team = row['away_team']
        
        if outcome == 0:  # Home Team Win
            if h_team == t1:
                t1_wins += 1
            else:
                t2_wins += 1
        elif outcome == 2:  # Away Team Win
            if a_team == t1:
                t1_wins += 1
            else:
                t2_wins += 1
        else:  # Draw
            draws += 1
            
    total = len(past_matches)
    return t1_wins / total, t2_wins / total, draws / total

# Pydantic schemas for verification
class MatchPredictionRequest(BaseModel):
    team1: str
    team2: str

class MatchPredictionResponse(BaseModel):
    winner: str
    probabilities: dict
    explanation: str

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "GoalGPT API",
        "version": "1.0.0"
    }

@app.post("/api/predict", response_model=MatchPredictionResponse)
def predict_match(request: MatchPredictionRequest):
    """
    Accepts two teams, validates their existence, constructs pre-match features,
    normalizes inputs, queries the best classifier, and outputs probability odds.
    """
    # 1. Standardize names
    t1_clean = clean_team_name(request.team1)
    t2_clean = clean_team_name(request.team2)
    
    # 2. Case-insensitive lookup check
    t1_key = name_lookup.get(t1_clean.lower())
    t2_key = name_lookup.get(t2_clean.lower())
    
    if not t1_key:
        raise HTTPException(
            status_code=400, 
            detail=f"Team '{request.team1}' not found in the historical matches database."
        )
    if not t2_key:
        raise HTTPException(
            status_code=400, 
            detail=f"Team '{request.team2}' not found in the historical matches database."
        )
    if t1_key == t2_key:
        raise HTTPException(
            status_code=400, 
            detail="A team cannot play against itself. Please specify two different teams."
        )
        
    # 3. Retrieve latest stats from in-memory cache
    s1 = team_stats[t1_key]
    s2 = team_stats[t2_key]
    
    # 4. Construct features matching model input columns:
    # ['rank_difference', 'elo_difference', 'form_difference', 'gd_difference',
    #  'h2h_home_win_rate', 'h2h_away_win_rate', 'h2h_draw_rate', 'neutral']
    rank_diff = s1['rank'] - s2['rank']
    elo_diff = s1['elo'] - s2['elo']
    form_diff = s1['form'] - s2['form']
    gd_diff = s1['gd'] - s2['gd']
    
    h2h_t1, h2h_t2, h2h_draw = get_h2h_rates(t1_key, t2_key)
    
    # Neutral match venue is set to 1 by default (standard for World Cups/neutral matches)
    neutral_match = 1
    
    raw_features = np.array([[
        rank_diff,
        elo_diff,
        form_diff,
        gd_diff,
        h2h_t1,
        h2h_t2,
        h2h_draw,
        neutral_match
    ]])
    
    # 5. Standardize features
    scaled_features = scaler.transform(raw_features)
    
    # 6. Predict probabilities
    # Classes: 0 = Home Win (team1), 1 = Draw, 2 = Away Win (team2)
    probs = model.predict_proba(scaled_features)[0]
    
    t1_prob = float(probs[0])
    draw_prob = float(probs[1])
    t2_prob = float(probs[2])
    
    # Rounding probabilities to 2 decimal places to match specifications
    t1_prob_r = round(t1_prob, 2)
    t2_prob_r = round(t2_prob, 2)
    draw_prob_r = round(draw_prob, 2)
    
    # Adjust rounding differences to ensure they sum to exactly 1.00
    rounding_diff = round(1.0 - (t1_prob_r + t2_prob_r + draw_prob_r), 2)
    if rounding_diff != 0.0:
        # Add discrepancy to the highest probability outcome
        probs_r_list = [t1_prob_r, draw_prob_r, t2_prob_r]
        max_idx = probs_r_list.index(max(probs_r_list))
        if max_idx == 0:
            t1_prob_r = round(t1_prob_r + rounding_diff, 2)
        elif max_idx == 2:
            t2_prob_r = round(t2_prob_r + rounding_diff, 2)
        else:
            draw_prob_r = round(draw_prob_r + rounding_diff, 2)
            
    # Determine the winner based on the highest probability category
    max_prob = max(t1_prob_r, t2_prob_r, draw_prob_r)
    if max_prob == t1_prob_r:
        winner = request.team1
    elif max_prob == t2_prob_r:
        winner = request.team2
    else:
        winner = "Draw"
        
    # 7. Generate explanation paragraph dynamically based on engineered features
    reasons = []
    
    # FIFA Ranking explanation
    if rank_diff < 0:
        reasons.append(f"{t1_key} holds a higher official FIFA ranking (difference of {abs(int(rank_diff))} spots)")
    elif rank_diff > 0:
        reasons.append(f"{t2_key} is officially ranked higher by {abs(int(rank_diff))} spots on the FIFA ranking board")
        
    # Elo rating explanation
    if elo_diff > 150:
        reasons.append(f"{t1_key} has a significantly superior Elo rating (+{int(elo_diff)} pts), indicating stronger long-term performance")
    elif elo_diff > 50:
        reasons.append(f"{t1_key} holds a higher Elo rating (+{int(elo_diff)} pts)")
    elif elo_diff < -150:
        reasons.append(f"{t2_key} is heavily favored by Elo rating (+{abs(int(elo_diff))} pts), suggesting a higher baseline quality")
    elif elo_diff < -50:
        reasons.append(f"{t2_key} has a stronger Elo rating (+{abs(int(elo_diff))} pts)")
        
    # Recent Form explanation
    if form_diff > 0.4:
        reasons.append(f"{t1_key} enters in excellent form, averaging {form_diff:.1f} more points per game in their last 5 fixtures")
    elif form_diff < -0.4:
        reasons.append(f"{t2_key} is carrying much stronger momentum, with a form advantage of {abs(form_diff):.1f} PPG over the last 5 matches")
        
    # Goal Difference explanation
    if gd_diff > 1.0:
        reasons.append(f"defensively and offensively, {t1_key} has a superior average goal differential (+{gd_diff:.1f} per match)")
    elif gd_diff < -1.0:
        reasons.append(f"{t2_key} displays sharper goal scoring efficiency (+{abs(gd_diff):.1f} average margin in recent games)")
        
    # Head-to-Head explanation
    if h2h_t1 > 0.5:
        reasons.append(f"historically, {t1_key} has dominated this matchup with a {int(h2h_t1 * 100)}% head-to-head win rate")
    elif h2h_t2 > 0.5:
        reasons.append(f"historical head-to-head records favor {t2_key} with a {int(h2h_t2 * 100)}% win rate in previous encounters")
        
    if not reasons:
        explanation = f"This matchup between {t1_key} and {t2_key} is extremely balanced. Both teams show similar ranking lists, Elo strength profiles, and recent momentum."
    else:
        explanation = f"Prediction factors: " + ", and ".join(reasons[:3]) + "."
        
    return MatchPredictionResponse(
        winner=winner,
        probabilities={
            request.team1: t1_prob_r,
            request.team2: t2_prob_r,
            "Draw": draw_prob_r
        },
        explanation=explanation
    )

@app.get("/api/teams")
def get_teams():
    """
    Returns a sorted list of all unique country names in our database.
    """
    return sorted(list(team_stats.keys()))

@app.get("/api/team/{team_name}")
def get_team_details(team_name: str):
    """
    Returns the latest compiled statistics for a specific team.
    """
    clean_name = clean_team_name(team_name)
    key = name_lookup.get(clean_name.lower())
    
    if not key:
        raise HTTPException(
            status_code=404,
            detail=f"Team '{team_name}' not found in the historical matches database."
        )
        
    stats = team_stats[key]
    return {
        "team_name": key,
        "elo": stats['elo'],
        "rank": stats['rank'],
        "form": stats['form'],
        "gd": stats['gd']
    }

@app.get("/api/h2h/{team1}/{team2}")
def get_head_to_head(team1: str, team2: str):
    """
    Returns full head-to-head history between two teams:
    win/draw/loss counts, goals, last 5 matches, and H2H win rates.
    """
    if df_matches is None:
        raise HTTPException(status_code=500, detail="Matches database not loaded.")

    t1_clean = clean_team_name(team1)
    t2_clean = clean_team_name(team2)
    t1_key = name_lookup.get(t1_clean.lower())
    t2_key = name_lookup.get(t2_clean.lower())

    if not t1_key:
        raise HTTPException(status_code=404, detail=f"Team '{team1}' not found.")
    if not t2_key:
        raise HTTPException(status_code=404, detail=f"Team '{team2}' not found.")

    cond = (
        ((df_matches['home_team'] == t1_key) & (df_matches['away_team'] == t2_key)) |
        ((df_matches['home_team'] == t2_key) & (df_matches['away_team'] == t1_key))
    )
    h2h_df = df_matches[cond].sort_values('date', ascending=False).copy()

    t1_wins = 0
    t2_wins = 0
    draws = 0
    t1_goals_total = 0
    t2_goals_total = 0
    matches_list = []

    for _, row in h2h_df.iterrows():
        outcome = int(row['match_outcome'])
        h_team = row['home_team']
        a_team = row['away_team']

        if h_team == t1_key:
            t1_g = int(row['home_score'])
            t2_g = int(row['away_score'])
        else:
            t1_g = int(row['away_score'])
            t2_g = int(row['home_score'])

        t1_goals_total += t1_g
        t2_goals_total += t2_g

        if outcome == 0:   # Home win
            winner = h_team
        elif outcome == 2: # Away win
            winner = a_team
        else:
            winner = "Draw"

        if winner == t1_key:
            t1_wins += 1
        elif winner == t2_key:
            t2_wins += 1
        else:
            draws += 1

        matches_list.append({
            "date": row['date'].strftime('%Y-%m-%d'),
            "home_team": h_team,
            "away_team": a_team,
            "home_score": int(row['home_score']),
            "away_score": int(row['away_score']),
            "tournament": row.get('tournament', ''),
            "winner": winner
        })

    total = t1_wins + t2_wins + draws
    return {
        "team1": t1_key,
        "team2": t2_key,
        "total_matches": total,
        "team1_wins": t1_wins,
        "team2_wins": t2_wins,
        "draws": draws,
        "team1_goals": t1_goals_total,
        "team2_goals": t2_goals_total,
        "team1_win_rate": round(t1_wins / total, 3) if total > 0 else 0,
        "team2_win_rate": round(t2_wins / total, 3) if total > 0 else 0,
        "draw_rate": round(draws / total, 3) if total > 0 else 0,
        "last_5": matches_list[:5],
        "all_matches": matches_list
    }

@app.get("/api/backtest/years")
def get_backtest_years():
    """
    Returns unique years containing 'FIFA World Cup' matches (excluding qualifying)
    from 1994 onwards.
    """
    if df_matches is None:
        raise HTTPException(status_code=500, detail="Matches database not loaded.")
    
    wc_df = df_matches[df_matches['tournament'] == 'FIFA World Cup'].copy()
    wc_df['year'] = wc_df['date'].dt.year
    
    years = wc_df[wc_df['year'] >= 1994]['year'].unique()
    return sorted([int(y) for y in years], reverse=True)

@app.get("/api/backtest/{year}")
def backtest_tournament_year(year: int):
    """
    Runs model predictions on all matches of the selected World Cup year and 
    compares them to actual outcomes.
    """
    if df_matches is None or model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Server resources not initialized.")
        
    wc_df = df_matches[
        (df_matches['tournament'] == 'FIFA World Cup') & 
        (df_matches['date'].dt.year == year)
    ].copy()
    
    if len(wc_df) == 0:
        raise HTTPException(status_code=404, detail=f"No World Cup matches found for year {year}.")
        
    wc_df = wc_df.sort_values('date').reset_index(drop=True)
    
    feature_cols = [
        'rank_difference',
        'elo_difference',
        'form_difference',
        'gd_difference',
        'h2h_home_win_rate',
        'h2h_away_win_rate',
        'h2h_draw_rate',
        'neutral'
    ]
    
    X = wc_df[feature_cols].values
    X_scaled = scaler.transform(X)
    
    probs = model.predict_proba(X_scaled)
    preds = model.predict(X_scaled)
    
    fixtures_list = []
    correct_count = 0
    
    total_matches = len(wc_df)
    
    # Chronological Stage Invariant: The last 16 matches of any post-1993 World Cup are the knockouts
    def get_stage_name(i):
        knockout_start_idx = total_matches - 16
        if i < knockout_start_idx:
            return "Group Stage"
            
        ko_idx = i - knockout_start_idx
        if ko_idx < 8:
            return "Round of 16"
        elif ko_idx < 12:
            return "Quarterfinals"
        elif ko_idx < 14:
            return "Semifinals"
        elif ko_idx == 14:
            return "Third Place Playoff"
        else:
            return "Grand Final"
            
    group_correct = 0
    group_total = 0
    knockout_correct = 0
    knockout_total = 0
    
    for idx, row in wc_df.iterrows():
        t1_prob = float(probs[idx][0])
        draw_prob = float(probs[idx][1])
        t2_prob = float(probs[idx][2])
        pred_label = int(preds[idx])
        actual_label = int(row['match_outcome'])
        
        is_correct = pred_label == actual_label
        if is_correct:
            correct_count += 1
            
        stage_name = get_stage_name(idx)
        is_group = stage_name == "Group Stage"
        if is_group:
            group_total += 1
            if is_correct:
                group_correct += 1
        else:
            knockout_total += 1
            if is_correct:
                knockout_correct += 1
                
        fixtures_list.append({
            "id": idx + 1,
            "date": row['date'].strftime('%Y-%m-%d'),
            "home_team": row['home_team'],
            "away_team": row['away_team'],
            "home_score": int(row['home_score']),
            "away_score": int(row['away_score']),
            "stage": stage_name,
            "probabilities": {
                row['home_team']: round(t1_prob, 2),
                row['away_team']: round(t2_prob, 2),
                "Draw": round(draw_prob, 2)
            },
            "predicted_outcome": "Home Win" if pred_label == 0 else ("Draw" if pred_label == 1 else "Away Win"),
            "actual_outcome": "Home Win" if actual_label == 0 else ("Draw" if actual_label == 1 else "Away Win"),
            "is_correct": is_correct
        })
        
    overall_accuracy = correct_count / total_matches
    group_accuracy = group_correct / group_total if group_total > 0 else 0
    knockout_accuracy = knockout_correct / knockout_total if knockout_total > 0 else 0
    
    return {
        "year": year,
        "total_matches": total_matches,
        "correct_predictions": correct_count,
        "overall_accuracy": round(overall_accuracy, 4),
        "group_accuracy": round(group_accuracy, 4),
        "knockout_accuracy": round(knockout_accuracy, 4),
        "fixtures": fixtures_list
    }
