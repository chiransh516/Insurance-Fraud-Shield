"""
Shared utility functions for the Insurance Claim Fraud & Amount Prediction System.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd


def load_dataset(path: str) -> pd.DataFrame:
    """Load a CSV dataset and parse date columns."""
    df = pd.read_csv(path, parse_dates=["policy_start_date", "policy_end_date"])
    return df


def save_model(model, path: str):
    """Save a trained model to disk using joblib."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(model, path)
    print(f"Model saved to {path}")


def load_model(path: str):
    """Load a trained model from disk."""
    return joblib.load(path)


def save_metrics(metrics: dict, path: str):
    """Save training metrics to a JSON file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(metrics, f, indent=2, default=_json_serializer)
    print(f"Metrics saved to {path}")

def load_metrics(path: str) -> dict:
    """Load training metrics from a JSON file."""
    with open(path, "r") as f:
        return json.load(f)


def _json_serializer(obj):
    """Custom JSON serializer for numpy types."""
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Type {type(obj)} not serializable")
