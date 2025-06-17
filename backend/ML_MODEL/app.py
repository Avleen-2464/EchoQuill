from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

app = Flask(__name__)

# Load tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("SamLowe/roberta-base-go_emotions")
model = AutoModelForSequenceClassification.from_pretrained("SamLowe/roberta-base-go_emotions")

# Get class labels
id2label = model.config.id2label

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if 'text' not in data:
        return jsonify({'error': 'Text field is required.'}), 400

    text = data['text']
    inputs = tokenizer(text, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=-1)[0]

    # Multi-label threshold
    threshold = 0.3
    predicted = [
        {'label': id2label[i], 'score': round(prob.item(), 3)}
        for i, prob in enumerate(probs)
        if prob > threshold
    ]

    return jsonify({
        'text': text,
        'predictions': predicted
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
