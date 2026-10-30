from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE_DIR / "models"
ARTIFACT = MODEL_DIR / "anomalywatch_models.joblib"

app = FastAPI(title="AnomalyWatch ML API", version="1.1.0",
              description="Network-flow classification and anomaly-detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)
_artifact: dict[str, Any] | None = None


class FlowRequest(BaseModel):
    features: dict[str, float | int | None]


def load_artifact():
    global _artifact
    if _artifact is None and ARTIFACT.exists():
        _artifact = joblib.load(ARTIFACT)
    return _artifact


def is_benign(values) -> np.ndarray:
    normalized = pd.Series(values).astype(str).str.strip().str.upper()
    return normalized.isin(["BENIGN", "NORMAL"]).to_numpy()


def prepare_frame(frame: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
    cleaned = frame.copy()
    cleaned.columns = [str(c).strip() for c in cleaned.columns]
    cleaned = cleaned.loc[:, ~cleaned.columns.duplicated()]
    missing = [name for name in feature_names if name not in cleaned.columns]
    if missing:
        preview = ", ".join(missing[:12])
        suffix = " ..." if len(missing) > 12 else ""
        raise HTTPException(
            status_code=400,
            detail=(f"CSV is missing {len(missing)} model feature column(s): "
                    f"{preview}{suffix}. Upload a CIC-IDS2017 flow CSV with "
                    "the same feature columns used during training."),
        )
    result = cleaned.loc[:, feature_names].copy()
    for column in feature_names:
        result[column] = pd.to_numeric(result[column], errors="coerce")
    return result.replace([np.inf, -np.inf], np.nan).fillna(0)


def binary_metrics(actual_attack: np.ndarray, predicted_attack: np.ndarray):
    tp = int(np.logical_and(actual_attack, predicted_attack).sum())
    tn = int(np.logical_and(~actual_attack, ~predicted_attack).sum())
    fp = int(np.logical_and(~actual_attack, predicted_attack).sum())
    fn = int(np.logical_and(actual_attack, ~predicted_attack).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    accuracy = (tp + tn) / len(actual_attack) if len(actual_attack) else 0.0
    return {
        "true_positives": tp, "true_negatives": tn,
        "false_positives": fp, "false_negatives": fn,
        "precision": round(precision, 4), "recall": round(recall, 4),
        "f1": round(f1, 4), "accuracy": round(accuracy, 4),
    }


@app.get("/api/health")
def health():
    data = load_artifact()
    return {
        "status": "ok", "model_loaded": data is not None,
        "model": "Isolation Forest + Random Forest" if data else None,
        "message": "Trained models ready" if data else
                   "Models not trained yet. Run the training script.",
    }


@app.get("/api/model-info")
def model_info():
    data = load_artifact()
    if not data:
        return {"trained": False, "dataset": "CIC-IDS2017",
                "message": "Train models using backend/scripts/train.py"}
    return {
        "trained": True, "dataset": data.get("dataset", "CIC-IDS2017"),
        "features": len(data["features"]), "feature_names": data["features"],
        "classification_metrics": data.get("classification_metrics", {}),
        "anomaly_metrics": data.get("anomaly_metrics", {}),
        "classes": data.get("classes", []),
    }


@app.post("/api/predict")
def predict(request: FlowRequest):
    data = load_artifact()
    if not data:
        raise HTTPException(status_code=503,
                            detail="Models are not trained. Run backend/scripts/train.py first.")
    feature_names = data["features"]
    row = {name: request.features.get(name, 0) for name in feature_names}
    frame = pd.DataFrame([[row[name] for name in feature_names]], columns=feature_names)
    frame = frame.replace([np.inf, -np.inf], np.nan).fillna(0)
    classifier = data["classifier"]
    label = str(classifier.predict(frame)[0])
    probabilities = classifier.predict_proba(frame)[0]
    isolation_flag = bool(data["isolation_forest"].predict(frame)[0] == -1)
    classifier_attack = not bool(is_benign([label])[0])
    return {
        "prediction": label,
        "is_anomaly": isolation_flag or classifier_attack,
        "classifier_attack_prediction": classifier_attack,
        "isolation_forest_flag": isolation_flag,
        "confidence": round(float(np.max(probabilities)), 4),
        "anomaly_score": round(float(-data["isolation_forest"].score_samples(frame)[0]), 6),
        "class_probabilities": {
            str(c): round(float(p), 4)
            for c, p in zip(classifier.classes_, probabilities)
        },
        "explanation": (
            f"Random Forest predicted {label}; Isolation Forest "
            f"{'flagged' if isolation_flag else 'did not flag'} this flow as unusual."
        ),
    }


@app.post("/api/predict-csv")
async def predict_csv(file: UploadFile = File(...)):
    data = load_artifact()
    if not data:
        raise HTTPException(status_code=503, detail="Models are not trained yet.")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")

    try:
        df = pd.read_csv(file.file, low_memory=False)
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded CSV contains no rows.")
        df.columns = [str(c).strip() for c in df.columns]
        labels = df["Label"].astype(str).str.strip() if "Label" in df.columns else None
        X = prepare_frame(df, data["features"])

        classifier = data["classifier"]
        predictions = classifier.predict(X).astype(str)
        probabilities = classifier.predict_proba(X).max(axis=1)
        isolation_flags = data["isolation_forest"].predict(X) == -1
        classifier_attack_flags = ~is_benign(predictions)
        combined_flags = isolation_flags | classifier_attack_flags

        out = pd.DataFrame({
            "prediction": predictions,
            "is_anomaly": combined_flags,
            "classifier_attack_prediction": classifier_attack_flags,
            "isolation_forest_flag": isolation_flags,
            "confidence": np.round(probabilities, 4),
        })
        predicted_counts = {
            str(k): int(v) for k, v in pd.Series(predictions).value_counts().items()
        }
        response = {
            "rows_processed": int(len(out)),
            # Keep the legacy key so existing frontend code continues to work.
            "anomalies": int(combined_flags.sum()),
            "classifier_attack_count": int(classifier_attack_flags.sum()),
            "isolation_forest_flags": int(isolation_flags.sum()),
            "combined_anomalies": int(combined_flags.sum()),
            # class_counts continues to represent Random Forest predictions.
            "class_counts": predicted_counts,
            "predicted_class_counts": predicted_counts,
            "results": out.head(500).to_dict(orient="records"),
            "note": ("Response is capped at the first 500 row-level results; "
                     "aggregate counts cover the full file. class_counts contains "
                     "Random Forest predictions."),
        }

        if labels is not None:
            actual_labels = labels.to_numpy()
            actual_attack_flags = ~is_benign(actual_labels)
            out["actual_label"] = actual_labels
            out["actual_is_attack"] = actual_attack_flags
            out["classifier_correct"] = predictions == actual_labels
            actual_counts = {
                str(k): int(v) for k, v in labels.value_counts().items()
            }
            response.update({
                "actual_class_counts": actual_counts,
                "actual_attack_count": int(actual_attack_flags.sum()),
                "classifier_attack_metrics": binary_metrics(
                    actual_attack_flags, classifier_attack_flags),
                "isolation_forest_metrics": binary_metrics(
                    actual_attack_flags, isolation_flags),
                "combined_detection_metrics": binary_metrics(
                    actual_attack_flags, combined_flags),
            })
            response["results"] = out.head(500).to_dict(orient="records")
        return response

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400,
                            detail=f"Could not process CSV: {exc}") from exc
