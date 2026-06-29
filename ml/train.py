import pandas as pd
import numpy as np
import os
import joblib

# Import scikit-learn preprocessing and evaluation tools
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, log_loss, classification_report

# Import XGBoost classifier
from xgboost import XGBClassifier

# File directories
PROCESSED_DATA_PATH = os.path.join("..", "data", "processed", "processed_matches.csv")
MODELS_DIR = os.path.join("..", "data", "models")
MODEL_EXPORT_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
SCALER_EXPORT_PATH = os.path.join(MODELS_DIR, "scaler.joblib")

def main():
    print("Initializing Machine Learning Training Pipeline...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # 1. Load Processed Dataset
    print(f"Loading dataset from {PROCESSED_DATA_PATH}...")
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise FileNotFoundError(
            f"Processed data file not found at {PROCESSED_DATA_PATH}. Make sure to run data_pipeline.py first."
        )
        
    df = pd.read_csv(PROCESSED_DATA_PATH)
    print(f"Dataset successfully loaded. Total fixtures: {len(df)}")
    
    # 2. Select Features (X) and Target Label (y)
    # ML Concept: Features are the input variables used to make predictions.
    # The target (y) is the outcome value the model learns to predict.
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
    
    X = df[feature_cols]
    y = df['match_outcome'] # 0 = Home Win, 1 = Draw, 2 = Away Win
    
    # 3. Train-Test Split
    # ML Concept: We split data into a training set (to fit model parameters)
    # and a test set (to evaluate how well the model generalizes to unseen games).
    # 'stratify=y' ensures that the proportions of home wins, away wins, and draws
    # remain exactly identical in both the train and test partitions.
    print("Splitting dataset into stratified train and test partitions (80/20)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    print(f"Training set size: {len(X_train)} | Test set size: {len(X_test)}")
    
    # 4. Feature Standardization (Scaling)
    # ML Concept: Distance-based algorithms (like Logistic Regression) compute coefficients
    # based on coordinate magnitudes. Scaling subtracts the mean and divides by standard deviation
    # so all features have a mean of 0 and variance of 1.
    # We fit the scaler ONLY on training data to avoid data leakage from the test partition.
    print("Fitting StandardScaler and scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the fitted scaler so the API server can transform user inputs identically at runtime
    joblib.dump(scaler, SCALER_EXPORT_PATH)
    print(f"Fitted StandardScaler exported to {SCALER_EXPORT_PATH}")
    
    # 5. Initialize Models
    # ML Concept: We evaluate three diverse model architectures:
    # - Logistic Regression: Linear model, good baseline, very calibrated probabilities.
    # - Random Forest: Bagging ensemble of decision trees, robust to overfitting.
    # - XGBoost: Gradient boosting algorithm, builds trees sequentially to minimize residual loss.
    models = {
        "Logistic Regression": LogisticRegression(
            solver='lbfgs',
            max_iter=1000,
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            objective='multi:softprob',
            num_class=3,
            random_state=42,
            n_jobs=-1
        )
    }
    
    # Track performance metrics to find the best model
    trained_models = {}
    model_accuracies = {}
    model_log_losses = {}
    
    # 6. Train and Evaluate each model
    print("\nTraining models and evaluating classification performances...")
    print("=" * 70)
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        # Predict class probabilities (required to calculate Log Loss and output predict odds)
        y_prob = model.predict_proba(X_test_scaled)
        
        # Calculate evaluation metrics
        # ML Concept: Accuracy is the % of correct match outcomes.
        # Log Loss penalizes models for being confident but wrong (e.g., predicting 90% win but losing).
        acc = accuracy_score(y_test, y_pred)
        loss = log_loss(y_test, y_prob)
        
        model_accuracies[name] = acc
        model_log_losses[name] = loss
        trained_models[name] = model
        
        print(f"-> Test Accuracy: {acc:.4f}")
        print(f"-> Test Log Loss: {loss:.4f}")
        
        # Classification report shows precision and recall for each outcome (0, 1, 2)
        # Precision: Out of all predictions of class X, how many were correct?
        # Recall: Out of all actual matches of class X, how many did the model identify?
        print("\nClassification Report:")
        print(classification_report(
            y_test, 
            y_pred, 
            target_names=["Home Win (0)", "Draw (1)", "Away Win (2)"]
        ))
        print("-" * 50)
        
    # 7. Print Comparative Table
    print("\n" + "=" * 50)
    print("MODEL COMPARISON SUMMARY")
    print("=" * 50)
    print(f"{'Classifier Name':<25} | {'Test Accuracy':<15} | {'Test Log Loss':<15}")
    print("-" * 55)
    for name in models.keys():
        print(f"{name:<25} | {model_accuracies[name]:.4f}          | {model_log_losses[name]:.4f}")
    print("=" * 50)
    
    # 8. Identify and Save the Best Model
    # We select the model with the highest test classification accuracy
    best_model_name = max(model_accuracies, key=model_accuracies.get)
    best_model = trained_models[best_model_name]
    
    print(f"\nWinner: {best_model_name} with {model_accuracies[best_model_name]:.4f} accuracy!")
    print(f"Saving best model to {MODEL_EXPORT_PATH}...")
    
    joblib.dump(best_model, MODEL_EXPORT_PATH)
    print("Model successfully exported and saved. Pipeline execution complete!")

if __name__ == "__main__":
    main()
