# AnomalyWatch ML backend

This backend adds real, trainable network-flow detection to the React dashboard project.
It trains two models from CIC-IDS2017 CSV exports:

- **Random Forest**: supervised multi-class attack classification (BENIGN, DoS, DDoS, PortScan, etc., depending on the dataset files supplied).
- **Isolation Forest**: unsupervised anomaly detection, fitted only on benign training flows.

## 1. Dataset setup

1. Download CIC-IDS2017 from https://www.unb.ca/cic/datasets/ids-2017.html
2. Extract the machine-learning CSV files.
3. Copy the CSV files into `backend/data/` (keep the `Label` column).
4. Do not upload the dataset to GitHub; it is large. `data/` is gitignored.

## 2. Install and train (Windows PowerShell)

From the project root:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/train.py
```

Training can take several minutes and needs sufficient RAM. The script currently samples at most 1,000,000 rows to keep local training manageable. It removes identifiers/timestamps, cleans infinite/missing values, uses a stratified 75/25 train/test split, and reports held-out metrics. Review the generated `models/evaluation.json`; do not claim a target accuracy before measuring it.

## 3. Start the API

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: http://127.0.0.1:8000/api/health
- Model metrics: http://127.0.0.1:8000/api/model-info
- Swagger docs: http://127.0.0.1:8000/docs

## 4. Test a prediction

Use `/api/predict` with a JSON object containing CIC feature names, e.g. `{"features":{"Destination Port":443,"Flow Duration":1000}}`. Missing feature values default to zero; for meaningful results, send the complete set of features from the training CSV schema.

Use `/api/predict-csv` to upload a CSV for batch predictions. If the CSV contains `Label`, the API returns it as `actual_label` for comparison. The first 500 row-level results are returned; summary counts cover all rows.

## Important evaluation notes

- Keep training and test data separate; never evaluate on training rows.
- The default split is stratified and reproducible, but CIC-IDS2017 has capture-day and host-specific patterns. For a stronger research evaluation, also perform a day-wise holdout and then external validation on UNSW-NB15 after a separate feature-mapping pipeline.
- Do not describe the dashboard's original browser-generated metric streams as live network capture. They are still demo telemetry. The new API provides real model inference on uploaded network-flow records; packet capture/live ingestion is a separate integration step.
- Accuracy alone is not enough for imbalanced intrusion data. Report macro-F1, per-class precision/recall, confusion matrix, and false-positive rate.
