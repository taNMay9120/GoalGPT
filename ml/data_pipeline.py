import pandas as pd
import numpy as np
import os

# Define file directories
RAW_DIR = os.path.join("..", "data", "raw")
PROCESSED_DIR = os.path.join("..", "data", "processed")
RESULTS_PATH = os.path.join(RAW_DIR, "results.csv")
RANKINGS_PATH = os.path.join(RAW_DIR, "fifa_ranking.csv")
OUTPUT_PATH = os.path.join(PROCESSED_DIR, "processed_matches.csv")

def clean_team_name(name: str) -> str:
    """
    Standardizes country names between the results and rankings datasets.
    This resolves mismatches (e.g., 'United States' vs 'USA') to ensure accurate joins.
    """
    if pd.isna(name):
        return name
    name = str(name).strip()
    
    # Core name mapping dictionary
    mapping = {
        # Results dataset differences -> Standard
        "United States": "USA",
        "Ivory Coast": "Côte d'Ivoire",
        "DR Congo": "Congo DR",
        "South Korea": "Korea Republic",
        "North Korea": "Korea DPR",
        
        # Rankings dataset differences -> Standard
        "Cape Verde Islands": "Cape Verde",
        "Irish Republic": "Republic of Ireland",
        "Ireland": "Republic of Ireland",
        "St. Vincent / Grenadines": "Saint Vincent and the Grenadines",
        "St. Kitts and Nevis": "Saint Kitts and Nevis",
        "St. Lucia": "Saint Lucia",
        "US Virgin Islands": "United States Virgin Islands",
        "Brunei Darussalam": "Brunei",
        "Swaziland": "Eswatini",
    }
    return mapping.get(name, name)

def compute_elo_ratings(df: pd.DataFrame):
    """
    Computes Elo ratings chronologically for all teams starting from 1872.
    Starting from the beginning of the dataset ensures that by 1993,
    the Elo ratings are well-converged and reflect true team strength.
    
    ML Concept: Elo is a self-correcting rating system. By analyzing all historical matches
    chronologically, the ratings build a robust proxy of team quality without lookahead bias.
    """
    print("Calculating Elo ratings...")
    # Initialize all teams at a baseline Elo of 1500.0
    elo_ratings = {}
    
    home_elos = []
    away_elos = []
    
    for idx, row in df.iterrows():
        h_team = row['home_team']
        a_team = row['away_team']
        
        # Retrieve current Elo or default to 1500
        h_elo = elo_ratings.get(h_team, 1500.0)
        a_elo = elo_ratings.get(a_team, 1500.0)
        
        # Store the ratings BEFORE the match starts (prevents data leakage)
        home_elos.append(h_elo)
        away_elos.append(a_elo)
        
        # Compute expected outcomes using logistic distribution curve
        # Home advantage parameter: Add 100 Elo points to the home team if the match is not on neutral ground.
        home_adv = 100.0 if not row['neutral'] else 0.0
        dr = (h_elo + home_adv) - a_elo
        exp_home = 1.0 / (1.0 + 10.0 ** (-dr / 400.0))
        
        # Define match outcomes
        if row['home_score'] > row['away_score']:
            outcome_home = 1.0
        elif row['home_score'] < row['away_score']:
            outcome_home = 0.0
        else:
            outcome_home = 0.5
            
        outcome_away = 1.0 - outcome_home
        exp_away = 1.0 - exp_home
        
        # Dynamically scale K-factor based on tournament importance
        # ML Concept: Dynamic weight adjustments (K-factor) represent the 'learning rate' of ratings.
        # Major tournaments like the World Cup have a higher weight because they reflect peak team efforts.
        tourney = str(row['tournament']).lower()
        if "world cup" in tourney:
            k = 50.0 if "qualifying" not in tourney else 30.0
        elif any(x in tourney for x in ["cup", "copa", "championship", "nations"]):
            k = 30.0
        else:
            k = 15.0  # Friendly matches
            
        # Update ratings
        elo_ratings[h_team] = h_elo + k * (outcome_home - exp_home)
        elo_ratings[a_team] = a_elo + k * (outcome_away - exp_away)
        
    df['home_elo'] = home_elos
    df['away_elo'] = away_elos
    df['elo_difference'] = df['home_elo'] - df['away_elo']
    return df

def compute_squad_vectors(df: pd.DataFrame):
    """
    Synthesizes EA FC (FIFA) style squad ratings (Attack, Midfield, Defense) 
    from the team's current Elo rating to simulate individual player quality aggregation.
    
    ML Concept: Instead of predicting purely on a single Elo number, we derive a Team Vector.
    We inject deterministic variance so some teams lean offensive while others lean defensive.
    """
    print("Computing FIFA-style squad vectors (ATT, MID, DEF)...")
    np.random.seed(42)  # Ensure deterministic noise
    
    # Scale Elo (typically 1200 - 2100) to FIFA ratings (usually 55 - 90)
    # 2100 Elo -> 90 Rating, 1200 Elo -> 60 Rating
    def elo_to_rating(elo):
        rating = ((elo - 1200) / (2100 - 1200)) * (90 - 60) + 60
        return np.clip(rating, 50, 95)
    
    # Determine the "style" of each team deterministically using hash of their name
    def get_style_modifiers(team_name):
        h = hash(team_name)
        # Modifiers between -3 and +3
        att_mod = (h % 7) - 3
        mid_mod = ((h >> 3) % 7) - 3
        def_mod = ((h >> 6) % 7) - 3
        return att_mod, mid_mod, def_mod
        
    home_att, home_mid, home_def = [], [], []
    away_att, away_mid, away_def = [], [], []
    
    for idx, row in df.iterrows():
        h_base = elo_to_rating(row['home_elo'])
        a_base = elo_to_rating(row['away_elo'])
        
        h_mods = get_style_modifiers(row['home_team'])
        a_mods = get_style_modifiers(row['away_team'])
        
        home_att.append(h_base + h_mods[0])
        home_mid.append(h_base + h_mods[1])
        home_def.append(h_base + h_mods[2])
        
        away_att.append(a_base + a_mods[0])
        away_mid.append(a_base + a_mods[1])
        away_def.append(a_base + a_mods[2])
        
    df['home_att'] = home_att
    df['home_mid'] = home_mid
    df['home_def'] = home_def
    
    df['away_att'] = away_att
    df['away_mid'] = away_mid
    df['away_def'] = away_def
    
    df['att_difference'] = df['home_att'] - df['away_att']
    df['mid_difference'] = df['home_mid'] - df['away_mid']
    df['def_difference'] = df['home_def'] - df['away_def']
    
    return df


def compute_rolling_features(df: pd.DataFrame):
    """
    Computes moving averages for recent form (5 matches) and goal difference (10 matches).
    
    ML Concept: A team's rolling statistics represent its short-term and medium-term momentum.
    To calculate this without lookahead leakage, we must look at matches from the perspective
    of a single team, shift the results by 1 (looking only at historical matches), and map
    them back to the main DataFrame.
    """
    print("Computing rolling form and goal difference features...")
    # Add a temporary index column to trace back records after split
    df['temp_match_idx'] = range(len(df))
    
    # Flatten matches into a single long-form timeline (2 rows per match: one for home, one for away)
    long_form = []
    for idx, row in df.iterrows():
        # Home team perspective
        long_form.append({
            'temp_match_idx': row['temp_match_idx'],
            'date': row['date'],
            'team': row['home_team'],
            'goals_scored': row['home_score'],
            'goals_conceded': row['away_score'],
            'points': 3 if row['home_score'] > row['away_score'] else (1 if row['home_score'] == row['away_score'] else 0)
        })
        # Away team perspective
        long_form.append({
            'temp_match_idx': row['temp_match_idx'],
            'date': row['date'],
            'team': row['away_team'],
            'goals_scored': row['away_score'],
            'goals_conceded': row['home_score'],
            'points': 3 if row['away_score'] > row['home_score'] else (1 if row['away_score'] == row['home_score'] else 0)
        })
        
    long_df = pd.DataFrame(long_form)
    # Sort chronologically per team to compute rolling statistics
    long_df = long_df.sort_values(by=['team', 'date']).reset_index(drop=True)
    
    # Group by team
    grouped = long_df.groupby('team')
    
    # 1. Recent Form: average points per match over the last 5 matches (shifted by 1 to prevent leakage)
    long_df['roll_form'] = grouped['points'].transform(lambda x: x.shift(1).rolling(5, min_periods=1).mean())
    
    # 2. Goals Scored & Conceded: averages over the last 10 matches (shifted by 1)
    long_df['roll_goals_scored'] = grouped['goals_scored'].transform(lambda x: x.shift(1).rolling(10, min_periods=1).mean())
    long_df['roll_goals_conceded'] = grouped['goals_conceded'].transform(lambda x: x.shift(1).rolling(10, min_periods=1).mean())
    long_df['roll_gd'] = long_df['roll_goals_scored'] - long_df['roll_goals_conceded']
    
    # Fill NaN values for teams with fewer matches with baseline averages
    long_df['roll_form'] = long_df['roll_form'].fillna(1.0)
    long_df['roll_goals_scored'] = long_df['roll_goals_scored'].fillna(1.2)
    long_df['roll_goals_conceded'] = long_df['roll_goals_conceded'].fillna(1.2)
    long_df['roll_gd'] = long_df['roll_gd'].fillna(0.0)
    
    # Separate home and away stats to merge back into original df
    home_stats = long_df.rename(columns={
        'roll_form': 'home_form',
        'roll_gd': 'home_gd'
    })
    
    away_stats = long_df.rename(columns={
        'roll_form': 'away_form',
        'roll_gd': 'away_gd'
    })
    
    # Merge Home stats
    df = pd.merge(
        df,
        home_stats[['temp_match_idx', 'team', 'home_form', 'home_gd']],
        left_on=['temp_match_idx', 'home_team'],
        right_on=['temp_match_idx', 'team'],
        how='left'
    ).drop(columns=['team'])
    
    # Merge Away stats
    df = pd.merge(
        df,
        away_stats[['temp_match_idx', 'team', 'away_form', 'away_gd']],
        left_on=['temp_match_idx', 'away_team'],
        right_on=['temp_match_idx', 'team'],
        how='left'
    ).drop(columns=['team', 'temp_match_idx'])
    
    # Compute relative difference features
    df['form_difference'] = df['home_form'] - df['away_form']
    df['gd_difference'] = df['home_gd'] - df['away_gd']
    
    return df

def compute_h2h_features(df: pd.DataFrame):
    """
    Computes direct Head-to-Head (H2H) win, draw, and loss rates chronologically.
    
    ML Concept: H2H captures specific team match-ups. We accumulate pairwise match
    outcomes to calculate win/loss frequencies before each fixture, preventing future leakage.
    """
    print("Computing Head-to-Head (H2H) statistics...")
    h2h_history = {}
    
    h2h_home_win_rates = []
    h2h_away_win_rates = []
    h2h_draw_rates = []
    
    for idx, row in df.iterrows():
        h_team = row['home_team']
        a_team = row['away_team']
        
        # Sort team name keys to guarantee uniform dictionary lookup
        pair = (h_team, a_team) if h_team < a_team else (a_team, h_team)
        
        history = h2h_history.get(pair, [])
        
        if len(history) == 0:
            # Baseline probability when no historical games exist
            h2h_home_win_rates.append(0.33)
            h2h_away_win_rates.append(0.33)
            h2h_draw_rates.append(0.34)
        else:
            total = len(history)
            h_wins = 0
            a_wins = 0
            draws = 0
            
            for prev_h, prev_a, outcome in history:
                if outcome == 'H':
                    if prev_h == h_team:
                        h_wins += 1
                    else:
                        a_wins += 1
                elif outcome == 'A':
                    if prev_a == h_team:
                        h_wins += 1
                    else:
                        a_wins += 1
                else:
                    draws += 1
                    
            h2h_home_win_rates.append(h_wins / total)
            h2h_away_win_rates.append(a_wins / total)
            h2h_draw_rates.append(draws / total)
            
        # Append current outcome to history for future match calculations
        current_outcome = 'H' if row['home_score'] > row['away_score'] else ('A' if row['home_score'] < row['away_score'] else 'D')
        history.append((h_team, a_team, current_outcome))
        h2h_history[pair] = history
        
    df['h2h_home_win_rate'] = h2h_home_win_rates
    df['h2h_away_win_rate'] = h2h_away_win_rates
    df['h2h_draw_rate'] = h2h_draw_rates
    return df

def main():
    print("Initializing Data Wrangling Pipeline...")
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    # 1. Load Raw Datasets
    print("Loading CSV files...")
    # Results are usually encoded in UTF-8
    results_df = pd.read_csv(RESULTS_PATH)
    # Rankings contain special characters (e.g. Côte d'Ivoire) requiring Latin-1 encoding
    rankings_df = pd.read_csv(RANKINGS_PATH, encoding='latin-1')
    
    # 2. Clean Datasets (Drop missing values & duplicates)
    print("Cleaning raw data...")
    results_df = results_df.dropna(subset=['home_team', 'away_team', 'home_score', 'away_score'])
    results_df = results_df.drop_duplicates()
    
    rankings_df = rankings_df.dropna(subset=['country_full', 'rank', 'rank_date'])
    rankings_df = rankings_df.drop_duplicates(subset=['country_full', 'rank_date'])
    
    # Parse dates
    results_df['date'] = pd.to_datetime(results_df['date'])
    rankings_df['rank_date'] = pd.to_datetime(rankings_df['rank_date'])
    
    # Sort chronologically to maintain integrity of time series analysis
    results_df = results_df.sort_values('date').reset_index(drop=True)
    rankings_df = rankings_df.sort_values('rank_date').reset_index(drop=True)
    
    # 3. Standardize country names
    print("Standardizing country/team names...")
    results_df['home_team'] = results_df['home_team'].apply(clean_team_name)
    results_df['away_team'] = results_df['away_team'].apply(clean_team_name)
    rankings_df['country_full'] = rankings_df['country_full'].apply(clean_team_name)
    
    # 4. Feature Engineering: Elo Ratings (from beginning of timeline)
    results_df = compute_elo_ratings(results_df)
    
    # 4.1 Feature Engineering: Squad Vectors (FIFA Ratings: ATT, MID, DEF)
    results_df = compute_squad_vectors(results_df)
    
    # 5. Feature Engineering: Rolling stats (form and goal differences)
    results_df = compute_rolling_features(results_df)
    
    # 6. Feature Engineering: Head-to-Head
    results_df = compute_h2h_features(results_df)
    
    # 7. Merge FIFA Rankings using merge_asof (optimized lookup)
    print("Merging FIFA Rankings using asof joins...")
    # Sort results and rankings specifically on dates for pd.merge_asof
    results_df = results_df.sort_values('date')
    rankings_df = rankings_df.sort_values('rank_date')
    
    # Merge Home Team FIFA Ranking
    matches_df = pd.merge_asof(
        results_df,
        rankings_df[['rank_date', 'country_full', 'rank']].rename(columns={'rank': 'home_rank'}),
        left_on='date',
        right_on='rank_date',
        left_by='home_team',
        right_by='country_full',
        direction='backward'
    ).drop(columns=['rank_date', 'country_full'])
    
    # Merge Away Team FIFA Ranking
    matches_df = pd.merge_asof(
        matches_df,
        rankings_df[['rank_date', 'country_full', 'rank']].rename(columns={'rank': 'away_rank'}),
        left_on='date',
        right_on='rank_date',
        left_by='away_team',
        right_by='country_full',
        direction='backward'
    ).drop(columns=['rank_date', 'country_full'])
    
    # 8. Filter to 1993 onwards (Post-FIFA rankings introduction)
    print("Filtering matches and dropping records without active FIFA rankings...")
    # Matches prior to August 1993 will not map to a ranking and result in home_rank or away_rank being NaN
    matches_df = matches_df.dropna(subset=['home_rank', 'away_rank'])
    
    # Compute relative ranking difference
    matches_df['rank_difference'] = matches_df['home_rank'] - matches_df['away_rank']
    
    # 9. Create Target Variable (0 = Home Win, 1 = Draw, 2 = Away Win)
    print("Creating target variables...")
    matches_df['match_outcome'] = np.where(
        matches_df['home_score'] > matches_df['away_score'], 0,
        np.where(matches_df['home_score'] == matches_df['away_score'], 1, 2)
    )
    
    # Map neutral binary representation
    matches_df['neutral'] = matches_df['neutral'].astype(int)
    
    # Define final features list
    feature_cols = [
        'date', 'home_team', 'away_team', 'home_score', 'away_score', 'tournament', 'neutral',
        'home_rank', 'away_rank', 'rank_difference',
        'home_elo', 'away_elo', 'elo_difference',
        'home_att', 'away_att', 'att_difference',
        'home_mid', 'away_mid', 'mid_difference',
        'home_def', 'away_def', 'def_difference',
        'home_form', 'away_form', 'form_difference',
        'home_gd', 'away_gd', 'gd_difference',
        'h2h_home_win_rate', 'h2h_away_win_rate', 'h2h_draw_rate',
        'match_outcome'
    ]
    
    final_df = matches_df[feature_cols].copy()
    
    # Save final dataset
    print(f"Exporting processed dataset containing {len(final_df)} matches...")
    final_df.to_csv(OUTPUT_PATH, index=False)
    print(f"Data pipeline complete! Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
