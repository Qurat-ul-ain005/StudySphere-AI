import os

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "quiz_difficulty_model.joblib"
)


def train_model():
    """
    Train a simple quiz difficulty prediction model.

    Features:
        - percentage
        - total_questions

    Target:
        0 = Hard
        1 = Medium
        2 = Easy
    """

    # Representative training examples.
    # Each row contains:
    # [percentage, total_questions]

    X = np.array([
        [10, 5],
        [20, 5],
        [25, 10],
        [30, 10],
        [35, 10],
        [40, 10],
        [45, 5],

        [50, 5],
        [55, 10],
        [60, 10],
        [65, 5],
        [68, 10],
        [70, 10],
        [72, 5],

        [75, 5],
        [78, 10],
        [80, 10],
        [82, 5],
        [85, 10],
        [88, 10],
        [90, 5],
        [95, 10],
        [100, 10],
    ])

    y = np.array([
        0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1, 1,
        2, 2, 2, 2, 2, 2, 2, 2, 2
    ])

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42
    )

    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)

    return model


def load_model():
    """
    Load the trained model.
    Train it automatically if it does not exist.
    """

    if not os.path.exists(MODEL_PATH):
        return train_model()

    return joblib.load(MODEL_PATH)


def predict_difficulty(
    percentage: float,
    total_questions: int
):
    """
    Predict quiz difficulty from quiz performance.
    """

    model = load_model()

    features = np.array([
        [percentage, total_questions]
    ])

    prediction = model.predict(features)[0]

    labels = {
        0: "Hard",
        1: "Medium",
        2: "Easy"
    }

    difficulty = labels[int(prediction)]

    # Prediction confidence
    probabilities = model.predict_proba(features)[0]
    confidence = float(max(probabilities) * 100)

    return {
        "difficulty": difficulty,
        "confidence": round(confidence, 1)
    }