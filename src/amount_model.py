
import numpy as np
import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, KFold
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)
from xgboost import XGBRegressor

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config


def train_amount_regressor(
    X_train: np.ndarray,
    y_train: np.ndarray,
    tune_hyperparams: bool = True,
) -> dict:
    
    if tune_hyperparams:
        param_distributions = {
            "n_estimators": [100, 200, 300, 500],
            "max_depth": [3, 5, 7, 9],
            "learning_rate": [0.01, 0.05, 0.1],
            "subsample": [0.8, 0.9, 1.0],
            "colsample_bytree": [0.8, 0.9, 1.0],
            "min_child_weight": [1, 3, 5],
            "reg_alpha": [0, 0.1, 1.0],
            "reg_lambda": [1.0, 5.0, 10.0],
        }

        model = XGBRegressor(
            random_state=config.RANDOM_STATE,
            objective="reg:squarederror",
        )

        cv = KFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)

        search = RandomizedSearchCV(
            model,
            param_distributions,
            n_iter=20,
            cv=cv,
            scoring="neg_mean_absolute_error",
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
            verbose=1,
        )

        search.fit(X_train, y_train)
        best_model = search.best_estimator_
        best_params = search.best_params_
        print(f"Best amount regressor params: {best_params}")
        print(f"Best CV MAE: {-search.best_score_:,.2f}")

    else:
        best_model = XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            random_state=config.RANDOM_STATE,
            objective="reg:squarederror",
            subsample=0.8,
            colsample_bytree=0.8,
        )
        best_model.fit(X_train, y_train)
        best_params = {}

    return {"model": best_model, "best_params": best_params}


def evaluate_amount_regressor(
    model,
    X_test: np.ndarray,
    y_test: np.ndarray,
) -> dict:

    y_pred = model.predict(X_test)

    y_pred = np.maximum(y_pred, 0)

    metrics = {
        "mae": float(mean_absolute_error(y_test, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
        "r2_score": float(r2_score(y_test, y_pred)),
        "mape": float(mean_absolute_percentage_error(y_test, y_pred)),
        "median_absolute_error": float(np.median(np.abs(y_test - y_pred))),
    }

    print(f"\n{'='*50}")
    print("Amount Regressor Evaluation")
    print(f"{'='*50}")
    print(f"MAE:        Rs.{metrics['mae']:,.2f}")
    print(f"RMSE:       Rs.{metrics['rmse']:,.2f}")
    print(f"R2 Score:   {metrics['r2_score']:.4f}")
    print(f"MAPE:       {metrics['mape']*100:.2f}%")
    print(f"Median AE:  Rs.{metrics['median_absolute_error']:,.2f}")

    return metrics


def predict_amount(model, X: np.ndarray) -> np.ndarray:

    predictions = model.predict(X)
    return np.maximum(predictions, 0).round(-2)  
