"""Train AnomalyWatch on CIC-IDS2017 CSV exports.

Place the extracted CIC-IDS2017 machine-learning CSV files in backend/data/.
The script performs a stratified train/test split, trains a supervised Random
Forest classifier and an unsupervised Isolation Forest on benign training rows,
then saves the fitted models and held-out evaluation metrics.
"""
from pathlib import Path
import json, re, warnings
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR, MODEL_DIR = ROOT / "data", ROOT / "models"
RANDOM_STATE = 42


def normalize_label(value):
    value = str(value).strip()
    return "BENIGN" if value.upper() in {"BENIGN", "NORMAL"} else value


def main():
    files = sorted(DATA_DIR.glob("*.csv"))
    if not files:
        raise SystemExit("No CSV files found. Put CIC-IDS2017 CSV files in backend/data/ and rerun.")
    frames = []
    for path in files:
        print(f"Reading {path.name} ...")
        frame = pd.read_csv(path, low_memory=False)
        frame.columns = [str(c).strip() for c in frame.columns]
        if "Label" not in frame.columns:
            warnings.warn(f"Skipping {path.name}: no Label column")
            continue
        frames.append(frame)
    if not frames:
        raise SystemExit("No usable CSVs with a Label column were found.")
    df = pd.concat(frames, ignore_index=True)
    df["Label"] = df["Label"].map(normalize_label)
    # Drop identifiers and timestamps to reduce memorization and leakage.
    drop = {"Label", "Flow ID", "Source IP", "Destination IP", "Timestamp"}
    X = df.drop(columns=[c for c in df.columns if c in drop], errors="ignore")
    X = X.select_dtypes(include=[np.number]).copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    # Remove constant columns and duplicate column names.
    X = X.loc[:, ~X.columns.duplicated()]
    X = X.loc[:, X.nunique(dropna=False) > 1]
    y = df["Label"].astype(str)
    if X.empty:
        raise SystemExit("No usable numeric feature columns found in the CSV files.")
    # Limit extreme memory use while retaining every class where possible.
    if len(X) > 1_000_000:
        X, _, y, _ = train_test_split(X, y, train_size=1_000_000, random_state=RANDOM_STATE, stratify=y)
    counts = y.value_counts()
    keep = counts[counts >= 2].index
    mask = y.isin(keep)
    X, y = X.loc[mask], y.loc[mask]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=RANDOM_STATE, stratify=y)
    classifier = RandomForestClassifier(n_estimators=250, max_features="sqrt", class_weight="balanced_subsample", n_jobs=-1, random_state=RANDOM_STATE)
    print("Training Random Forest classifier ...")
    classifier.fit(X_train, y_train)
    pred = classifier.predict(X_test)
    report = classification_report(y_test, pred, output_dict=True, zero_division=0)
    cls_metrics = {"accuracy": round(float(accuracy_score(y_test, pred)), 4), "macro_f1": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4), "weighted_f1": round(float(f1_score(y_test, pred, average="weighted", zero_division=0)), 4), "macro_precision": round(float(precision_score(y_test, pred, average="macro", zero_division=0)), 4), "macro_recall": round(float(recall_score(y_test, pred, average="macro", zero_division=0)), 4), "classification_report": report, "confusion_matrix": confusion_matrix(y_test, pred, labels=classifier.classes_).tolist(), "confusion_matrix_labels": classifier.classes_.tolist()}
    benign_train = X_train[y_train.str.upper().isin(["BENIGN", "NORMAL"])]
    if benign_train.empty:
        raise SystemExit("No BENIGN/NORMAL training rows available for Isolation Forest.")
    print("Training Isolation Forest on benign training flows ...")
    isolation = IsolationForest(n_estimators=250, contamination="auto", n_jobs=-1, random_state=RANDOM_STATE)
    isolation.fit(benign_train)
    # Evaluate IF against held-out ground truth: benign=0, attack=1.
    iso_pred = (isolation.predict(X_test) == -1).astype(int)
    y_binary = (~y_test.str.upper().isin(["BENIGN", "NORMAL"])).astype(int)
    from sklearn.metrics import roc_auc_score
    try:
        auc = float(roc_auc_score(y_binary, -isolation.score_samples(X_test)))
    except ValueError:
        auc = None
    anomaly_metrics = {"precision": round(float(precision_score(y_binary, iso_pred, zero_division=0)), 4), "recall": round(float(recall_score(y_binary, iso_pred, zero_division=0)), 4), "f1": round(float(f1_score(y_binary, iso_pred, zero_division=0)), 4), "roc_auc": round(auc, 4) if auc is not None else None}
    MODEL_DIR.mkdir(exist_ok=True)
    artifact = {"classifier": classifier, "isolation_forest": isolation, "features": list(X.columns), "classes": [str(c) for c in classifier.classes_], "dataset": "CIC-IDS2017", "classification_metrics": cls_metrics, "anomaly_metrics": anomaly_metrics}
    joblib.dump(artifact, MODEL_DIR / "anomalywatch_models.joblib", compress=3)
    with open(MODEL_DIR / "evaluation.json", "w", encoding="utf-8") as f:
        json.dump({"dataset": "CIC-IDS2017", "rows": int(len(X)), "train_rows": int(len(X_train)), "test_rows": int(len(X_test)), "features": list(X.columns), "classification_metrics": cls_metrics, "anomaly_metrics": anomaly_metrics}, f, indent=2)
    print("\nTraining complete. Held-out metrics:")
    print(json.dumps({"classification": {k:v for k,v in cls_metrics.items() if k != "classification_report" and k != "confusion_matrix" and k != "confusion_matrix_labels"}, "anomaly_detection": anomaly_metrics}, indent=2))
    print(f"Saved model: {MODEL_DIR / 'anomalywatch_models.joblib'}")

if __name__ == "__main__":
    main()
