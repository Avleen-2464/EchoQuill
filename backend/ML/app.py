from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import numpy as np
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download('stopwords')
nltk.download('wordnet')

app = Flask(__name__)
CORS(app)

model = tf.keras.models.load_model('emotion_analysis_model.h5')

with open('tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)

with open('emotion_labels.pickle', 'rb') as handle:
    emotion_labels = pickle.load(handle)

max_sequence_length = 100

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    words = text.split()
    filtered_words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    
    return ' '.join(filtered_words)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if 'text' not in data:
        return jsonify({'error': 'Text field is required.'}), 400

    raw_text = data['text']
    cleaned_text = preprocess_text(raw_text)
    
    sequence = tokenizer.texts_to_sequences([cleaned_text])
    padded = pad_sequences(sequence, maxlen=max_sequence_length, padding='post')
    
    preds = model.predict(padded)[0]
    
    threshold = 0.3
    predicted_emotions = [
        {'label': emotion_labels[i], 'score': round(float(score), 3)}
        for i, score in enumerate(preds)
        if score > threshold
    ]

    return jsonify({
        'text': raw_text,
        'predictions': predicted_emotions
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
