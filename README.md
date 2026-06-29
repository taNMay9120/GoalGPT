# GoalGPT - AI-Powered Match Predictor

GoalGPT is a production-quality machine learning match forecasting platform. It uses historical international football results, dynamic rankings, and performance differentials to predict match outcomes.

## Technical Architecture

```
fifa-world-cup-ai/ (Workspace Root)
├── frontend/             # React + TypeScript (Vite, Tailwind, Recharts)
├── backend/              # FastAPI Python Web Server
├── ml/                   # Machine learning data processing & model training pipelines
├── data/                 # Data directory
│   ├── raw/              # Raw CSV datasets
│   ├── processed/        # Cleaned datasets
│   └── models/           # Saved trained estimators (Joblib)
└── notebooks/            # Jupyter notebooks for data analysis & experimentation
```

## Setup Instructions

### Backend (FastAPI)

1. Navigate to the `backend/` directory.
2. Initialize virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows (PowerShell)**: `.\venv\Scripts\Activate.ps1`
   - **Unix/macOS**: `source venv/bin/activate`
4. Install dependency packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Spin up the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000/`. You can view the automated Swagger documentation at `http://localhost:8000/docs`.

### Frontend (Vite + React)

1. Navigate to the `frontend/` directory.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot the development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173/` (or default port).

## Project Milestones

- **Phase 1**: Folder Structure, FastAPI Endpoint Scaffolding, React-TS Frontend with Tailwind, Recharts, and Router. (Completed)
- **Phase 2**: Complete Data Wrangling and Feature Engineering Pipeline. (Upcoming)
- **Phase 3**: Machine Learning Model Training (Logistic Regression, Random Forest, XGBoost) and Evaluation. (Upcoming)
- **Phase 4**: Match Prediction Endpoint integration. (Upcoming)
- **Phase 5**: Dynamic frontend UI building. (Upcoming)
- **Phase 6**: Predictive Explainability mapping. (Upcoming)
- **Phase 7**: Full tournament stage simulation. (Upcoming)
