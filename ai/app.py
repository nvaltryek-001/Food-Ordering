from pathlib import Path
import json
import re

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

try:
    from ai_edge_litert.interpreter import Interpreter
except ImportError:
    from tensorflow.lite.python.interpreter import Interpreter


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "rnn_model_food_review_analysis.tflite"
VOCAB_PATH = BASE_DIR / "models" / "food_review_vocab_word_to_idx_dict.txt"

print("--------------------------------------------")
print("FoodSense AI")
print("--------------------------------------------")

# ============================================================
# LOAD ORIGINAL VOCABULARY
# ============================================================

with open(VOCAB_PATH, "r", encoding="utf-8") as f:
    vocab_data = json.load(f)

vocab = {
    str(k).lower(): float(v)
    for k, v in vocab_data.items()
}

print(f"Vocabulary: {len(vocab)}")

# ============================================================
# LOAD ORIGINAL TFLITE MODEL
# ============================================================

interpreter = Interpreter(model_path=str(MODEL_PATH))
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(f"Model: {MODEL_PATH.exists()}")
print(f"Input: {input_details}")
print(f"Output: {output_details}")


# ============================================================
# API REQUEST
# ============================================================

class PredictRequest(BaseModel):
    text: str
    rating: float | None = None


# ============================================================
# EXACT ORIGINAL ANDROID CLEANING
#
# Android:
#
# getText().toString().trim().replaceAll("[^\\w\\s]","")
#
# ============================================================

def clean_review_android(text: str) -> str:

    text = str(text or "").strip()

    # Java [^\w\s] equivalent for ASCII review text.
    # Keep letters, numbers, underscore and whitespace.
    text = re.sub(r"[^\w\s]", "", text)

    return text


# ============================================================
# EXACT ORIGINAL ANDROID MODEL PREPROCESSING
# ============================================================

def preprocess_android_exact(text):
    text = str(text or "").strip()
    text = re.sub(r"[^\w\s]", "", text)

    words = text.split()
    input_val = np.zeros((1, 500), dtype=np.float32)

    j = 499

    for word in words:
        if j < 0:
            break

        word_lower = word.lower()

        # IMPORTANT: Android decrements j ONLY when word exists.
        if word_lower in vocab:
            input_val[0][j] = vocab[word_lower]
            j -= 1

    left = -1
    right = 499

    for i in range(right + 1):
        if input_val[0][i] != 0:
            left = i
            break

    while left <= right:
        temp = input_val[0][left]
        input_val[0][left] = input_val[0][right]
        input_val[0][right] = temp
        left += 1
        right -= 1

    return input_val, text

def run_model(text):
    """
    Run the original FoodSense RNN/TFLite model.
    Input MUST be [1, 500] float32 because the TFLite
    model exposes embedding_2_input as float32.
    """

    cleaned = str(text or "").strip()
    cleaned = re.sub(r"[^\w\s]", "", cleaned)

    tensor = preprocess_android_exact(cleaned)
    if isinstance(tensor, tuple):
        tensor = tensor[0]

    # Force exact TFLite input format.
    tensor = np.asarray(tensor, dtype=np.float32)
    tensor = tensor.reshape(1, 500)

    # Safety check
    if tensor.shape != (1, 500):
        raise ValueError(f"Invalid input shape: {tensor.shape}")

    if tensor.dtype != np.float32:
        raise ValueError(f"Invalid input dtype: {tensor.dtype}")

    interpreter.set_tensor(
        input_details[0]["index"],
        tensor
    )

    interpreter.invoke()

    output = interpreter.get_tensor(
        output_details[0]["index"]
    )

    raw = float(np.asarray(output).reshape(-1)[0])

    return raw, cleaned

def classify_sentiment(raw: float, rating=None):

    # Original model output behaves as:
    # closer to 1 -> positive
    # closer to 0 -> negative

    if raw >= 0.65:

        sentiment = "positive"

    elif raw <= 0.35:

        sentiment = "negative"

    else:

        sentiment = "neutral"

    # Rating is used only to resolve the
    # middle/ambiguous region.

    if rating is not None:

        rating = float(rating)

        if rating <= 2 and raw < 0.60:

            sentiment = "negative"

        elif rating >= 4 and raw > 0.40:

            sentiment = "positive"

        elif rating == 3 and 0.20 <= raw <= 0.80:

            sentiment = "neutral"

    if sentiment == "positive":

        confidence = raw

    elif sentiment == "negative":

        confidence = 1.0 - raw

    else:

        confidence = 1.0 - abs(raw - 0.5) * 2

    confidence = max(
        0.0,
        min(1.0, confidence)
    )

    return sentiment, confidence


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="FoodSense AI",
    version="1.0.0"
)


@app.get("/health")
def health():

    return {
        "status": "ok",
        "aiMode": "tflite",
        "modelExists": MODEL_PATH.exists(),
        "vocabularySize": len(vocab)
    }


@app.post("/predict")
def predict(request: PredictRequest):

    text = str(request.text or "").strip()

    if not text:

        return {
            "sentiment": "neutral",
            "confidence": 0.0,
            "raw": 0.5,
            "mode": "tflite"
        }

    try:

        raw, cleaned = run_model(text)

        sentiment, confidence = classify_sentiment(
            raw,
            request.rating
        )

        return {
            "sentiment": sentiment,
            "confidence": round(float(confidence), 4),
            "raw": round(float(raw), 6),
            "cleanedText": cleaned,
            "mode": "tflite"
        }

    except Exception as error:

        print("Prediction error:", error)

        return {
            "sentiment": "neutral",
            "confidence": 0.0,
            "raw": 0.5,
            "mode": "tflite-error",
            "error": str(error)
        }


# ============================================================
# LOCAL PYTHON TEST
# ============================================================

def analyze(text, rating=None):

    raw, cleaned = run_model(text)

    sentiment, confidence = classify_sentiment(
        raw,
        rating
    )

    return {
        "sentiment": sentiment,
        "confidence": round(float(confidence), 4),
        "raw": round(float(raw), 6),
        "cleanedText": cleaned,
        "mode": "tflite"
    }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000
    )
