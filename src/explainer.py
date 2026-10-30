"""
SHAP Explainability Module
============================
Provides per-prediction feature importance explanations using SHAP.
Uses TreeExplainer for XGBoost models.
"""

import numpy as np
import shap

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def create_explainer(model, X_background: np.ndarray = None):
    """
    Create a SHAP TreeExplainer for the given model.

    Parameters
    ----------
    model : trained XGBoost model (or imblearn Pipeline containing one)
        The model to explain.
    X_background : np.ndarray, optional
        Background data for the explainer. If None, uses model internals.

    Returns
    -------
    shap.TreeExplainer
    """
    # If model is an imblearn pipeline, extract the classifier/regressor
    actual_model = model
    if hasattr(model, "named_steps"):
        if "classifier" in model.named_steps:
            actual_model = model.named_steps["classifier"]
        elif "regressor" in model.named_steps:
            actual_model = model.named_steps["regressor"]

    explainer = shap.TreeExplainer(actual_model)
    return explainer


def explain_prediction(
    explainer,
    X_single: np.ndarray,
    feature_names: list,
    top_n: int = 5,
) -> dict:
    """
    Generate SHAP explanation for a single prediction.

    Parameters
    ----------
    explainer : shap.TreeExplainer
        SHAP explainer object.
    X_single : np.ndarray
        Single row of preprocessed features (shape: (1, n_features)).
    feature_names : list
        Names of features for labeling.
    top_n : int
        Number of top contributing features to return.

    Returns
    -------
    dict
        {
            "shap_values": list of (feature_name, shap_value) tuples,
            "base_value": float,
            "top_features": list of top-N contributing features with direction,
        }
    """
    if X_single.ndim == 1:
        X_single = X_single.reshape(1, -1)

    shap_values = explainer.shap_values(X_single)

    # For binary classification, shap_values might be a list [class_0, class_1]
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]  # Class 1 (fraud) SHAP values
    elif shap_values.ndim == 3:
        shap_vals = shap_values[0, :, 1]  # (samples, features, classes)
    else:
        shap_vals = shap_values[0]  # Single output

    base_value = explainer.expected_value
    if isinstance(base_value, (list, np.ndarray)):
        base_value = float(base_value[1]) if len(base_value) > 1 else float(base_value[0])
    else:
        base_value = float(base_value)

    # Pair feature names with SHAP values
    feature_impacts = []
    for name, val in zip(feature_names, shap_vals):
        feature_impacts.append({
            "feature": name,
            "shap_value": round(float(val), 4),
            "impact": "increases risk" if val > 0 else "decreases risk",
        })

    # Sort by absolute impact
    feature_impacts.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    # All SHAP values for full chart
    all_shap = [
        {"feature": name, "shap_value": round(float(val), 4)}
        for name, val in zip(feature_names, shap_vals)
    ]

    return {
        "shap_values": all_shap,
        "base_value": base_value,
        "top_features": feature_impacts[:top_n],
    }


def explain_batch(
    explainer,
    X: np.ndarray,
    feature_names: list,
    top_n: int = 5,
) -> list:
    """
    Generate SHAP explanations for multiple predictions.

    Returns
    -------
    list[dict]
        List of explanation dicts.
    """
    results = []
    for i in range(X.shape[0]):
        results.append(explain_prediction(explainer, X[i], feature_names, top_n))
    return results
