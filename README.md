# 🛡️ LoanShield Elite: AI Loan Prediction Dashboard

**LoanShield Elite** is a professional-grade loan default prediction system. It moves beyond simple accuracy to provide **Explainable AI (XAI)** and highly sensitive risk monitoring.

## 🌟 The "Problem" vs. The "Sense"
In most fraud systems, AI is "lazy." Because fraud is rare (e.g., only 3% of cases), a model that predicts "No Fraud" for everyone gets **97% accuracy** but misses every single thief.

**LoanShield Elite solves this with "AI Sense":**
1.  **SMOTE Balancing:** We use synthetic data generation to teach the AI what fraud patterns actually look like, preventing it from ignoring the minority class.
2.  **Tuned Sensitivity (Recall):** Instead of a standard 50% threshold, we use a **30% sensitive threshold**, improving the "Catch Rate" of defaults from **31% to 82%**.
3.  **Explainability (LIME):** The system doesn't just say "Risk"—it explains *why* (e.g., "High balance relative to income detected").

---

## 🚀 Key Features
*   **LIME Reasoning Radar:** Human-readable explanations for every AI decision.
*   **Dynamic Sensitivity Slider:** Adjust the "Risk Appetite" of the system live.
*   **Live Analytics Feed:** Real-time transaction monitoring with glowing status indicators.
*   **Predictive Charting:** Live line graphs (Chart.js) visualizing risk probability trends.
*   **Stress Testing:** Simulate a high-load credit network with a single click.

---

## 🛠️ Technical Stack
*   **AI/ML:** Python, Scikit-Learn, imbalanced-learn (SMOTE).
*   **Explainability:** LIME (Local Interpretable Model-agnostic Explanations).
*   **Backend:** FastAPI (Highly performant Python web framework).
*   **Frontend:** HTML5, CSS3 (Glassmorphism & Dark Theme), JavaScript (Vanilla).
*   **Visualization:** Chart.js & FontAwesome.

---

## ⚡ How to Run
1.  **Environment Setup:**
    ```bash
    pip install fastapi uvicorn pandas scikit-learn imbalanced-learn lime openpyxl joblib
    ```
2.  **Launch System:**
    ```bash
    python main.py
    ```
3.  **Access Dashboard:**
    Open your browser to `http://localhost:8000`

---

## 📂 Project Structure
*   `main.py`: The FastAPI server & AI logic.
*   `model.pkl` & `scaler.pkl`: The brains of the operation (Trained AI + Data settings).
*   `static/`: The high-fidelity web interface (HTML, CSS, JS).
*   `fraud_detection.ipynb`: The original laboratory notebook where the AI was born.

---
## 🤝 Contributing
Contributions are welcome! If you'd like to improve the model or the dashboard:
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---
*Created with "Agentic AI Sense" for elite-level financial security.*
