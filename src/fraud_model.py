
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def train_fraud_classifier(
    X_train: np.ndarray,
    y_train: np.ndarray,
    feature_names: list = None,
    tune_hyperparams: bool = True,
) -> dict:
    
    n_negative = np.sum(y_train == 0)
    n_positive = np.sum(y_train == 1)
    scale_pos_weight = n_negative / max(n_positive, 1)

    if tune_hyperparams:
        # Hyperparameter search
        param_distributions = {
            "classifier__n_estimators": [100, 200, 300],
            "classifier__max_depth": [3, 5, 7],
            "classifier__learning_rate": [0.01, 0.05, 0.1],
            "classifier__subsample": [0.8, 1.0],
            "classifier__colsample_bytree": [0.8, 1.0],
            "classifier__min_child_weight": [1, 3, 5],
        }

        pipeline = ImbPipeline([
            ("smote", SMOTE(random_state=config.RANDOM_STATE, sampling_strategy=0.5)),
            ("classifier", XGBClassifier(
                scale_pos_weight=scale_pos_weight,
                random_state=config.RANDOM_STATE,
                eval_metric="logloss",
                use_label_encoder=False,
            )),
        ])

        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)

        search = RandomizedSearchCV(
            pipeline,
            param_distributions,
            n_iter=20,
            cv=cv,
            scoring="f1",
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
            verbose=1,
        )

        search.fit(X_train, y_train)
        best_model = search.best_estimator_
        best_params = search.best_params_
        print(f"Best fraud classifier params: {best_params}")
        print(f"Best CV F1 score: {search.best_score_:.4f}")

    else:
        # Default parameters
        pipeline = ImbPipeline([
            ("smote", SMOTE(random_state=config.RANDOM_STATE, sampling_strategy=0.5)),
            ("classifier", XGBClassifier(
                n_estimators=200,
                max_depth=5,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                random_state=config.RANDOM_STATE,
                eval_metric="logloss",
                use_label_encoder=False,
                subsample=0.8,
                colsample_bytree=0.8,
            )),
        ])
        pipeline.fit(X_train, y_train)
        best_model = pipeline
        best_params = {}

    return {"model": best_model, "best_params": best_params}


def evaluate_fraud_classifier(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    threshold: float = config.FRAUD_PROBABILITY_THRESHOLD,
) -> dict:
    """
    Evaluate the fraud classifier on test data.

    Returns
    -------
    dict
        Dictionary of evaluation metrics.
    """
    # Get probabilities
    y_proba = model.predict_proba(X_test)[:, 1]

    # Apply threshold
    y_pred = (y_proba >= threshold).astype(int)

    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_proba)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "threshold_used": threshold,
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
    }

    print(f"\n{'='*50}")
    print("Fraud Classifier Evaluation")
    print(f"{'='*50}")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1_score']:.4f}")
    print(f"ROC AUC:   {metrics['roc_auc']:.4f}")
    print(f"Threshold: {threshold}")
    print(f"\nConfusion Matrix:")
    print(f"  TN={metrics['confusion_matrix'][0][0]}  FP={metrics['confusion_matrix'][0][1]}")
    print(f"  FN={metrics['confusion_matrix'][1][0]}  TP={metrics['confusion_matrix'][1][1]}")

    return metrics


def predict_fraud(model, X: np.ndarray, threshold: float = config.FRAUD_PROBABILITY_THRESHOLD) -> dict:
    """
    Predict fraud for new claims.

    Returns
    -------
    dict
        {"predictions": array, "probabilities": array, "is_fraud": array}
    """
    probabilities = model.predict_proba(X)[:, 1]
    is_fraud = (probabilities >= threshold).astype(int)

    return {
        "probabilities": probabilities,
        "is_fraud": is_fraud,
    }
