# AnomalyWatch

AnomalyWatch is a React + Vite network anomaly-detection dashboard with an optional FastAPI machine-learning backend.

## Frontend

```bash
npm install
npm run dev
```

Open the Vite URL (usually http://localhost:5173).

## ML backend (CIC-IDS2017)

The backend trains a supervised Random Forest attack classifier and an unsupervised Isolation Forest anomaly detector using CIC-IDS2017 CSV exports. Follow **backend/README.md** for dataset placement, training, evaluation, and API startup.

Start the backend in a second terminal:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts/train.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The dashboard checks backend health and displays whether trained models are available. The `/api/predict` and `/api/predict-csv` endpoints provide real model inference for network-flow data.

## Important current limitation

The original animated dashboard metrics and attack simulator are still browser-generated demonstration telemetry. They are not live packet capture. The ML backend is real and can train/evaluate on CIC-IDS2017 and score uploaded flows/CSV records. Connecting live packet capture (for example, Zeek/Suricata flow logs) is a separate next phase.
