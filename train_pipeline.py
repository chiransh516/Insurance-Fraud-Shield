"""
End-to-End Training Pipeline
==============================
Orchestrates the full ML pipeline:
1. Load raw data
2. Feature engineering & preprocessing
3. Train fraud classifier (XGBoost + SMOTE)
4. Train amount regressor (XGBoost, genuine claims only)
5. Save all artifacts (models, preprocessor, metrics)

Usage:
    python train_pipeline.py
    python train_pipeline.py --no-tune    # Skip hyperparameter tuning (faster)
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split

import config
from src.utils import load_dataset, save_model, save_metrics
from src.preprocessing import derive_features, build_preprocessor, get_feature_columns, get_all_feature_names
from src.fraud_model import train_fraud_classifier, evaluate_fraud_classifier
from src.amount_model import train_amount_regressor, evaluate_amount_regressor
from src.explainer import create_explainer


def run_pipeline(tune_hyperparams: bool = True):
    """Run the full training pipeline."""

    print("=" * 60)
    print("INSURANCE CLAIM FRAUD & AMOUNT PREDICTION SYSTEM")
    print("Training Pipeline")
    print("=" * 60)
    start_time = datetime.now()

    # ------------------------------------------------------------------
    # Step 1: Load Data
    # ------------------------------------------------------------------
    print("\n[1/6] Loading dataset...")
    df = load_dataset(config.DATASET_PATH)
    print(f"  Loaded {len(df):,} records from {config.DATASET_PATH}")
    print(f"  Fraud rate: {df[config.TARGET_FRAUD].mean()*100:.1f}%")

    # ------------------------------------------------------------------
    # Step 2: Feature Engineering
    # ------------------------------------------------------------------
    print("\n[2/6] Feature engineering...")
    df = derive_features(df)

    numerical_features, categorical_features = get_feature_columns()
    all_feature_cols = numerical_features + categorical_features
    print(f"  Numerical features ({len(numerical_features)}): {numerical_features}")
    print(f"  Categorical features ({len(categorical_features)}): {categorical_features}")

    # ------------------------------------------------------------------
    # Step 3: Build & Fit Preprocessor
    # ------------------------------------------------------------------
    print("\n[3/6] Building preprocessing pipeline...")
    preprocessor = build_preprocessor()

    # Split data BEFORE fitting preprocessor (prevent data leakage)
    X = df[all_feature_cols]
    y_fraud = df[config.TARGET_FRAUD].values

    X_train_raw, X_test_raw, y_train_fraud, y_test_fraud = train_test_split(
        X, y_fraud,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE,
        stratify=y_fraud,
    )

    print(f"  Train set: {len(X_train_raw):,} samples")
    print(f"  Test set:  {len(X_test_raw):,} samples")

    # Fit preprocessor on training data only
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)

    feature_names = get_all_feature_names(preprocessor)
    print(f"  Total features after preprocessing: {X_train.shape[1]}")

    # Save preprocessor
    save_model(preprocessor, config.PREPROCESSOR_PATH)

    # ------------------------------------------------------------------
    # Step 4: Train Fraud Classifier
    # ------------------------------------------------------------------
    print("\n[4/6] Training fraud classifier...")
    fraud_result = train_fraud_classifier(
        X_train, y_train_fraud,
        feature_names=feature_names,
        tune_hyperparams=tune_hyperparams,
    )
    fraud_model = fraud_result["model"]

    # Evaluate
    fraud_metrics = evaluate_fraud_classifier(fraud_model, X_test, y_test_fraud)

    # Save fraud model
    save_model(fraud_model, config.FRAUD_MODEL_PATH)

    # ------------------------------------------------------------------
    # Step 5: Train Amount Regressor (genuine claims only)
    # ------------------------------------------------------------------
    print("\n[5/6] Training amount regressor (genuine claims only)...")

    # Get indices of genuine claims in the original dataframe
    train_indices = X_train_raw.index
    test_indices = X_test_raw.index

    genuine_train_mask = df.loc[train_indices, config.TARGET_FRAUD] == 0
    genuine_test_mask = df.loc[test_indices, config.TARGET_FRAUD] == 0

    X_train_genuine = X_train[genuine_train_mask.values]
    y_train_amount = df.loc[train_indices[genuine_train_mask], config.TARGET_AMOUNT].values

    X_test_genuine = X_test[genuine_test_mask.values]
    y_test_amount = df.loc[test_indices[genuine_test_mask], config.TARGET_AMOUNT].values

    print(f"  Genuine train samples: {len(X_train_genuine):,}")
    print(f"  Genuine test samples:  {len(X_test_genuine):,}")

    amount_result = train_amount_regressor(
        X_train_genuine, y_train_amount,
        tune_hyperparams=tune_hyperparams,
    )
    amount_model = amount_result["model"]

    # Evaluate
    amount_metrics = evaluate_amount_regressor(amount_model, X_test_genuine, y_test_amount)

    # Save amount model
    save_model(amount_model, config.AMOUNT_MODEL_PATH)

    # ------------------------------------------------------------------
    # Step 6: Save Training Metrics (Static — FR6)
    # ------------------------------------------------------------------
    print("\n[6/6] Saving training metrics...")
    elapsed = (datetime.now() - start_time).total_seconds()

    all_metrics = {
        "training_timestamp": datetime.now().isoformat(),
        "training_duration_seconds": round(elapsed, 2),
        "dataset": {
            "total_samples": len(df),
            "fraud_count": int(df[config.TARGET_FRAUD].sum()),
            "fraud_rate": round(df[config.TARGET_FRAUD].mean(), 4),
            "train_size": len(X_train_raw),
            "test_size": len(X_test_raw),
        },
        "fraud_classifier": {
            "model_type": "XGBClassifier + SMOTE",
            "best_params": fraud_result["best_params"],
            **fraud_metrics,
        },
        "amount_regressor": {
            "model_type": "XGBRegressor",
            "best_params": amount_result["best_params"],
            "trained_on_genuine_only": True,
            "genuine_train_samples": len(X_train_genuine),
            "genuine_test_samples": len(X_test_genuine),
            **amount_metrics,
        },
        "feature_names": feature_names,
    }

    save_metrics(all_metrics, config.TRAINING_METRICS_PATH)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print(f"\n{'='*60}")
    print("TRAINING COMPLETE")
    print(f"{'='*60}")
    print(f"Duration: {elapsed:.1f} seconds")
    print(f"\nArtifacts saved:")
    print(f"  Preprocessor:   {config.PREPROCESSOR_PATH}")
    print(f"  Fraud model:    {config.FRAUD_MODEL_PATH}")
    print(f"  Amount model:   {config.AMOUNT_MODEL_PATH}")
    print(f"  Metrics:        {config.TRAINING_METRICS_PATH}")
    print(f"\nKey Metrics:")
    print(f"  Fraud Classifier AUC-ROC: {fraud_metrics['roc_auc']:.4f}")
    print(f"  Fraud Classifier F1:      {fraud_metrics['f1_score']:.4f}")
    print(f"  Amount Regressor R²:      {amount_metrics['r2_score']:.4f}")
    print(f"  Amount Regressor MAE:     Rs.{amount_metrics['mae']:,.2f}")

    return all_metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train ML models")
    parser.add_argument(
        "--no-tune",
        action="store_true",
        help="Skip hyperparameter tuning (use default params, much faster)",
    )
    args = parser.parse_args()

    run_pipeline(tune_hyperparams=not args.no_tune)
