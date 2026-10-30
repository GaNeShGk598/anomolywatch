"""Train AnomalyWatch and evaluate two leakage-resistant validation protocols.

Input:
    backend/data/*.csv (CIC-IDS2017 flow exports with a Label column)

Evaluation protocols:
1. File/day holdout: entire source CSV files are held out from training.
2. Chronological holdout: earlier timestamped flows train the model; later
   timestamped flows are used for testing.

The final production models are then fitted on all eligible rows. The artifact
keys consumed by the existing FastAPI app are preserved:
    classifier, isolation_forest, features, classes, dataset,
    classification_metrics, anomaly_metrics
"""
from pathlib import Path
import json
import re
import warnings

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
RANDOM_STATE = 42
MAX_ROWS = 1_000_000
TEST_SIZE = 0.25


def normalize_label(value):
    value = str(value).strip()
    return "BENIGN" if value.upper() in {"BENIGN", "NORMAL"} else value


def make_classifier():
    return RandomForestClassifier(
        n_estimators=250,
        max_features="sqrt",
        class_weight="balanced_subsample",
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )


def make_isolation_forest():
    return IsolationForest(
        n_estimators=250,
        contamination="auto",
        n_jobs=-1,
        random_state=RANDOM_STATE,
    )


def binary_metrics(y_true_attack, y_pred_attack):
    y_true_attack = np.asarray(y_true_attack, dtype=bool)
    y_pred_attack = np.asarray(y_pred_attack, dtype=bool)
    tp = int(np.logical_and(y_true_attack, y_pred_attack).sum())
    tn = int(np.logical_and(~y_true_attack, ~y_pred_attack).sum())
    fp = int(np.logical_and(~y_true_attack, y_pred_attack).sum())
    fn = int(np.logical_and(y_true_attack, ~y_pred_attack).sum())
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    accuracy = (tp + tn) / len(y_true_attack) if len(y_true_attack) else 0.0
    return {
        "true_positives": tp,
        "true_negatives": tn,
        "false_positives": fp,
        "false_negatives": fn,
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "accuracy": round(float(accuracy), 4),
    }


def classification_metrics(y_true, y_pred, classes):
    report = classification_report(
        y_true, y_pred, labels=list(classes), output_dict=True, zero_division=0
    )
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "macro_f1": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "macro_precision": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "macro_recall": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "classification_report": report,
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=list(classes)).tolist(),
        "confusion_matrix_labels": [str(c) for c in classes],
    }


def evaluate_split(X_train, y_train, X_test, y_test, protocol_name):
    """Fit both models only on the supplied training partition."""
    if len(X_train) == 0 or len(X_test) == 0:
        raise ValueError(f"{protocol_name}: training or test partition is empty.")
    if y_train.nunique() < 2:
        raise ValueError(f"{protocol_name}: training partition contains fewer than 2 classes.")

    classifier = make_classifier()
    classifier.fit(X_train, y_train)
    predictions = classifier.predict(X_test)
    all_classes = sorted(set(y_train.astype(str)) | set(y_test.astype(str)))
    cls_metrics = classification_metrics(y_test, predictions, all_classes)

    benign_mask = y_train.astype(str).str.upper().isin(["BENIGN", "NORMAL"])
    benign_train = X_train.loc[benign_mask]
    if benign_train.empty:
        raise ValueError(f"{protocol_name}: no benign training rows for Isolation Forest.")

    isolation = make_isolation_forest()
    isolation.fit(benign_train)
    isolation_flags = isolation.predict(X_test) == -1

    actual_attack = ~y_test.astype(str).str.upper().isin(["BENIGN", "NORMAL"]).to_numpy()
    classifier_attack = ~pd.Series(predictions).astype(str).str.upper().isin(
        ["BENIGN", "NORMAL"]
    ).to_numpy()
    combined_flags = isolation_flags | classifier_attack

    anomaly_metrics = binary_metrics(actual_attack, isolation_flags)
    scores = -isolation.score_samples(X_test)
    try:
        anomaly_metrics["roc_auc"] = round(float(roc_auc_score(actual_attack, scores)), 4)
    except ValueError:
        anomaly_metrics["roc_auc"] = None

    return {
        "protocol": protocol_name,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "train_class_counts": {str(k): int(v) for k, v in y_train.value_counts().items()},
        "test_class_counts": {str(k): int(v) for k, v in y_test.value_counts().items()},
        "classification_metrics": cls_metrics,
        "classifier_attack_metrics": binary_metrics(actual_attack, classifier_attack),
        "anomaly_metrics": anomaly_metrics,
        "combined_detection_metrics": binary_metrics(actual_attack, combined_flags),
    }


def load_dataset():
    files = sorted(DATA_DIR.glob("*.csv"))
    if not files:
        raise SystemExit(
            "No CSV files found. Put CIC-IDS2017 CSV files in backend/data/ and rerun."
        )

    frames = []
    for path in files:
        print(f"Reading {path.name} ...")
        frame = pd.read_csv(path, low_memory=False)
        frame.columns = [str(c).strip() for c in frame.columns]
        if "Label" not in frame.columns:
            warnings.warn(f"Skipping {path.name}: no Label column")
            continue
        frame["_source_file"] = path.name
        frames.append(frame)

    if not frames:
        raise SystemExit("No usable CSVs with a Label column were found.")

    df = pd.concat(frames, ignore_index=True)
    df["Label"] = df["Label"].map(normalize_label)

    # Keep a timestamp copy for chronological splitting, but never use it as a
    # model feature. Source filename is retained only for grouped evaluation.
    if "Timestamp" in df.columns:
        raw_timestamps = df["Timestamp"].astype(str).str.strip()
        try:
            parsed = pd.to_datetime(
                raw_timestamps, format="mixed", errors="coerce", dayfirst=False
            )
        except (TypeError, ValueError):
            parsed = pd.to_datetime(raw_timestamps, errors="coerce", dayfirst=False)
        missing_ts = parsed.isna()
        if missing_ts.any():
            fallback = pd.to_datetime(
                raw_timestamps.loc[missing_ts], errors="coerce", dayfirst=True
            )
            parsed.loc[missing_ts] = fallback
        df["_parsed_timestamp"] = parsed
    else:
        df["_parsed_timestamp"] = pd.NaT

    drop_columns = {
        "Label", "Flow ID", "Source IP", "Destination IP", "Timestamp",
        "_source_file", "_parsed_timestamp",
    }
    X = df.drop(
        columns=[c for c in df.columns if c in drop_columns], errors="ignore"
    )
    X = X.select_dtypes(include=[np.number]).copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    X = X.loc[:, ~X.columns.duplicated()]
    X = X.loc[:, X.nunique(dropna=False) > 1]

    y = df["Label"].astype(str)
    source_files = df["_source_file"].astype(str)
    weekday = source_files.str.extract(
        r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)",
        flags=re.IGNORECASE,
        expand=False,
    )
    groups = weekday.fillna(source_files).str.lower()
    timestamps = df["_parsed_timestamp"]

    # Remove classes with fewer than two examples, matching the original
    # pipeline's protection against impossible stratified evaluation.
    counts = y.value_counts()
    keep_labels = counts[counts >= 2].index
    mask = y.isin(keep_labels)
    X, y, groups, timestamps, source_files = (
        X.loc[mask].reset_index(drop=True),
        y.loc[mask].reset_index(drop=True),
        groups.loc[mask].reset_index(drop=True),
        timestamps.loc[mask].reset_index(drop=True),
        source_files.loc[mask].reset_index(drop=True),
    )

    if X.empty:
        raise SystemExit("No usable numeric feature columns found in the CSV files.")

    # Bound memory while preserving representation from each file and label.
    # Sampling happens before either evaluation split; no test row is used to
    # fit a model. The cap is recorded in evaluation.json.
    sampled = False
    if len(X) > MAX_ROWS:
        rng = np.random.RandomState(RANDOM_STATE)
        strata = pd.DataFrame({"group": groups, "label": y})
        pieces = []
        total = len(X)
        for _, idx in strata.groupby(["group", "label"], sort=False).groups.items():
            idx = np.asarray(list(idx), dtype=int)
            take = max(1, int(round(MAX_ROWS * len(idx) / total)))
            if take < len(idx):
                idx = rng.choice(idx, size=take, replace=False)
            pieces.extend(idx.tolist())
        selected = np.asarray(pieces, dtype=int)
        if len(selected) > MAX_ROWS:
            selected = rng.choice(selected, size=MAX_ROWS, replace=False)
        X, y, groups, timestamps, source_files = (
            X.iloc[selected].reset_index(drop=True),
            y.iloc[selected].reset_index(drop=True),
            groups.iloc[selected].reset_index(drop=True),
            timestamps.iloc[selected].reset_index(drop=True),
            source_files.iloc[selected].reset_index(drop=True),
        )
        sampled = True

    return X, y, groups, timestamps, source_files, sampled


def run_file_day_evaluation(X, y, groups):
    unique_groups = groups.nunique()
    if unique_groups < 2:
        raise ValueError("File/day evaluation requires at least two source CSV files.")
    splitter = GroupShuffleSplit(
        n_splits=1, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    train_idx, test_idx = next(splitter.split(X, y, groups))
    train_groups = sorted(groups.iloc[train_idx].unique().tolist())
    test_groups = sorted(groups.iloc[test_idx].unique().tolist())
    result = evaluate_split(
        X.iloc[train_idx], y.iloc[train_idx],
        X.iloc[test_idx], y.iloc[test_idx],
        "file_day_holdout",
    )
    result["train_days"] = train_groups
    result["test_days"] = test_groups
    result["note"] = (
        "All CSV captures sharing a weekday prefix are held out together. "
        "Test-only attack labels are included in the classification report."
    )
    return result


def run_chronological_evaluation(X, y, timestamps):
    valid = timestamps.notna()
    valid_count = int(valid.sum())
    if valid_count < 2:
        raise ValueError(
            "Chronological evaluation unavailable: fewer than two valid timestamps."
        )

    valid_idx = np.flatnonzero(valid.to_numpy())
    ordered_idx = valid_idx[
        np.argsort(timestamps.iloc[valid_idx].astype("int64").to_numpy(), kind="stable")
    ]
    split_at = int(len(ordered_idx) * (1.0 - TEST_SIZE))
    if split_at <= 0 or split_at >= len(ordered_idx):
        raise ValueError("Chronological split produced an empty partition.")

    train_idx = ordered_idx[:split_at]
    test_idx = ordered_idx[split_at:]
    result = evaluate_split(
        X.iloc[train_idx], y.iloc[train_idx],
        X.iloc[test_idx], y.iloc[test_idx],
        "chronological_holdout",
    )
    result["train_time_end"] = str(timestamps.iloc[train_idx].max())
    result["test_time_start"] = str(timestamps.iloc[test_idx].min())
    result["excluded_invalid_timestamp_rows"] = int(len(X) - valid_count)
    result["note"] = (
        "Rows with invalid/missing timestamps are excluded from this evaluation. "
        "Training uses earlier timestamps and testing uses later timestamps."
    )
    return result


def main():
    X, y, groups, timestamps, source_files, sampled = load_dataset()
    print(f"\nPrepared {len(X):,} rows and {X.shape[1]} numeric features.")
    print(f"Source files: {source_files.nunique()}")
    print(f"Capture-day groups: {groups.nunique()}")

    evaluations = {}
    for name, evaluator in (
        ("file_day", lambda: run_file_day_evaluation(X, y, groups)),
        ("chronological", lambda: run_chronological_evaluation(X, y, timestamps)),
    ):
        print(f"\nRunning {name} evaluation ...")
        try:
            evaluations[name] = evaluator()
            print(json.dumps({
                "train_rows": evaluations[name]["train_rows"],
                "test_rows": evaluations[name]["test_rows"],
                "classification": evaluations[name]["classification_metrics"],
                "classifier_attack": evaluations[name]["classifier_attack_metrics"],
                "isolation_forest": evaluations[name]["anomaly_metrics"],
                "combined": evaluations[name]["combined_detection_metrics"],
            }, indent=2))
        except Exception as exc:
            evaluations[name] = {"available": False, "error": str(exc)}
            warnings.warn(f"{name} evaluation could not run: {exc}")

    # Fit deployable models on all eligible rows after both evaluations.
    # This preserves the existing API artifact schema and endpoint behavior.
    print("\nTraining final production Random Forest on all eligible rows ...")
    final_classifier = make_classifier()
    final_classifier.fit(X, y)

    benign_mask = y.astype(str).str.upper().isin(["BENIGN", "NORMAL"])
    benign_rows = X.loc[benign_mask]
    if benign_rows.empty:
        raise SystemExit("No BENIGN/NORMAL rows available for final Isolation Forest.")
    print("Training final production Isolation Forest on all benign rows ...")
    final_isolation = make_isolation_forest()
    final_isolation.fit(benign_rows)

    # Preserve the original flat metric shape expected by existing API clients.
    # The complete results for both protocols live in evaluation.json.
    file_eval = evaluations.get("file_day", {})
    time_eval = evaluations.get("chronological", {})
    preferred_eval = time_eval if time_eval.get("classification_metrics") else file_eval
    cls_summary = preferred_eval.get("classification_metrics", {})
    anomaly_summary = preferred_eval.get("anomaly_metrics", {})

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    artifact = {
        "classifier": final_classifier,
        "isolation_forest": final_isolation,
        "features": list(X.columns),
        "classes": [str(c) for c in final_classifier.classes_],
        "dataset": "CIC-IDS2017",
        "classification_metrics": cls_summary,
        "anomaly_metrics": anomaly_summary,
    }
    joblib.dump(artifact, MODEL_DIR / "anomalywatch_models.joblib", compress=3)

    evaluation_output = {
        "dataset": "CIC-IDS2017",
        "rows": int(len(X)),
        "features_count": int(X.shape[1]),
        "features": list(X.columns),
        "source_file_count": int(source_files.nunique()),
        "source_files": sorted(source_files.unique().tolist()),
        "capture_day_groups": sorted(groups.unique().tolist()),
        "sampled_to_max_rows": sampled,
        "max_rows": MAX_ROWS,
        "evaluation_protocols": evaluations,
        "final_model_training": {
            "classifier_training_rows": int(len(X)),
            "isolation_forest_benign_training_rows": int(benign_mask.sum()),
            "note": (
                "Final deployable models are refitted on all eligible rows after "
                "evaluation. Do not use these final models to claim the held-out "
                "evaluation scores; use the separately fitted holdout models."
            ),
        },
    }
    with open(MODEL_DIR / "evaluation.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_output, f, indent=2, default=str)

    print(f"\nTraining complete. Saved model: {MODEL_DIR / 'anomalywatch_models.joblib'}")
    print(f"Evaluation report: {MODEL_DIR / 'evaluation.json'}")
    print(
        "\nIMPORTANT: API artifact keys are preserved. "
        "The evaluation scores come from separate holdout models; "
        "the saved production model is refitted on all eligible data."
    )


if __name__ == "__main__":
    main()
