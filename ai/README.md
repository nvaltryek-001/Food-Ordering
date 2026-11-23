# Optional: TensorFlow Lite review model

This folder contains the original FoodSense RNN review model (`models/rnn_model_food_review_analysis.tflite`)
and its vocabulary, wrapped in a small FastAPI service.

The main app does **not** need it — the backend ships its own sentiment model (see `backend/scripts/train-sentiment.js`).
Run this service only if you want to compare or use the RNN model:

```bash
cd ai
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt                         # needs a Python version with ai-edge-litert wheels (3.10–3.12)
uvicorn app:app --port 8000
```

Then start the backend with `AI_SERVICE_URL=http://127.0.0.1:8000`. Reviews will be scored by the RNN
(`engine: "tflite-rnn"`); if the service is down or slow (>2.5 s) the backend falls back to its built-in model.

`POST /predict` — `{ "text": "...", "rating": 4 }` → `{ "sentiment", "raw", ... }` where `raw` is P(positive).

> The model's accuracy has not been measured against a labelled test set in this repository.
