from flask import Flask, request, jsonify
import xgboost as xgb
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

app = Flask(__name__)

# Simuler des modèles chargés (en production, vous les chargeriez avec pickle/joblib)
# Pour cet exemple, nous allons "mimer" la logique ou utiliser des modèles vides
class DummyModel:
    def predict(self, df):
        # Retourne des prédictions bidon pour la démo
        return [0] # 0: Info, 1: Warning, 2: Urgent

@app.route('/classify', methods=['POST'])
def classify():
    data = request.json
    # Exemple de features: longueur du message, type de source, heure
    # df = pd.DataFrame([data])
    # prediction = xgboost_model.predict(df)
    
    # Logique simplifiée pour la démo
    content = data.get('content', '').lower()
    priority = "Info"
    if "urgent" in content or "erreur" in content or "alerte" in content:
        priority = "Urgent"
    elif "attention" in content or "warning" in content:
        priority = "Warning"
        
    return jsonify({
        "priority": priority,
        "confidence": 0.95
    })

@app.route('/predict_optimal_time', methods=['POST'])
def predict_optimal_time():
    data = request.json
    # data contient l'historique de l'utilisateur
    # prediction = rf_model.predict(data)
    
    return jsonify({
        "optimal_time": "2026-04-27T18:00:00Z",
        "should_send_now": True
    })

if __name__ == '__main__':
    app.run(port=5000)
