// API Service for connecting the GoalGPT React Frontend to the FastAPI Backend.
// In a production app, the backend URL is typically configured via environment variables.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface HealthCheckResponse {
  status: string;
  app: string;
  version: string;
}

export interface MatchPredictionRequest {
  team1: string;
  team2: string;
}

export interface MatchPredictionResponse {
  winner: string;
  probabilities: {
    [teamName: string]: number;
  };
  explanation: string;
}

export interface TeamStats {
  team_name: string;
  elo: number;
  rank: number;
  form: number;
  gd: number;
}

export interface BacktestFixture {
  id: number;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  stage: string;
  probabilities: { [team: string]: number };
  predicted_outcome: string;
  actual_outcome: string;
  is_correct: boolean;
}

export interface BacktestResponse {
  year: number;
  total_matches: number;
  correct_predictions: number;
  overall_accuracy: number;
  group_accuracy: number;
  knockout_accuracy: number;
  fixtures: BacktestFixture[];
}

export interface H2HMatch {
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  tournament: string;
  winner: string;
}

export interface H2HResponse {
  team1: string;
  team2: string;
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  team1_win_rate: number;
  team2_win_rate: number;
  draw_rate: number;
  last_5: H2HMatch[];
  all_matches: H2HMatch[];
}

export const apiService = {
  /**
   * Checks the backend server status to ensure frontend-backend connectivity.
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Request a match prediction between two teams.
   */
  async predictMatch(data: MatchPredictionRequest): Promise<MatchPredictionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Prediction failed with status: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches the sorted list of all unique team names available in the database.
   */
  async getTeams(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/teams`);
    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches the latest stats (Elo, FIFA rank, form, GD) for a specific team.
   */
  async getTeamStats(teamName: string): Promise<TeamStats> {
    const response = await fetch(`${API_BASE_URL}/api/team/${encodeURIComponent(teamName)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats for team ${teamName}: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches the list of years for which we have historical World Cup matches in the database.
   */
  async getBacktestYears(): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/api/backtest/years`);
    if (!response.ok) {
      throw new Error(`Failed to fetch backtest years: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Performs a chronological backtest validation for all matches in a historical World Cup year.
   */
  async getBacktestResults(year: number): Promise<BacktestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/backtest/${year}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch backtest results for ${year}: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches full head-to-head history between two teams.
   */
  async getH2H(team1: string, team2: string): Promise<H2HResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/h2h/${encodeURIComponent(team1)}/${encodeURIComponent(team2)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch H2H for ${team1} vs ${team2}: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches live scores from the backend.
   */
  async getLiveScores(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/live-scores`);
    if (!response.ok) {
      throw new Error(`Failed to fetch live scores: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches football news from the backend.
   */
  async getNews(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/news`);
    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Fetches detailed match statistics, lineups, and events.
   */
  async getMatchDetails(fixtureId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/match/${fixtureId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch match details: ${response.status}`);
    }
    return response.json();
  }
};
