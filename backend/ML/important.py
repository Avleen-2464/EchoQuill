import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics import classification_report, f1_score
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Bidirectional, LSTM, Dense, Dropout, SpatialDropout1D
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download necessary NLTK resources
nltk.download('stopwords')
nltk.download('wordnet')

# 1. Data Loading and Preprocessing
def load_and_preprocess_data(file_path):
    """
    Load the Go Emotions dataset and preprocess it
    """
    # Load dataset
    print("Loading dataset...")
    data = pd.read_csv(file_path)
    
    # Basic dataset exploration
    print(f"Dataset shape: {data.shape}")
    print(f"Columns: {data.columns}")
    print("Sample data:")
    print(data.head())
    
    return data

def preprocess_text(text):
    """
    Clean and preprocess text data
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)
    
    # Remove HTML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove punctuation and special characters
    text = re.sub(r'[^\w\s]', '', text)
    
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Lemmatization and stopword removal
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    words = text.split()
    filtered_words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
    
    return ' '.join(filtered_words)

def prepare_dataset(data, text_column='text', emotions_column='emotions'):
    """
    Prepare the dataset for training
    """
    # Preprocess text
    print("Preprocessing text data...")
    data['processed_text'] = data[text_column].apply(preprocess_text)
    
    # Prepare labels
    print("Preparing labels...")
    mlb = MultiLabelBinarizer()
    # Convert string representation of list to actual list if needed
    if isinstance(data[emotions_column].iloc[0], str):
        data[emotions_column] = data[emotions_column].apply(eval)
    emotions_encoded = mlb.fit_transform(data[emotions_column])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        data['processed_text'], 
        emotions_encoded, 
        test_size=0.2, 
        random_state=42
    )
    
    print(f"Training data shape: {X_train.shape}, {y_train.shape}")
    print(f"Testing data shape: {X_test.shape}, {y_test.shape}")
    
    return X_train, X_test, y_train, y_test, mlb.classes_

# 2. Text Tokenization and Sequence Preparation
def tokenize_text(X_train, X_test, max_words=10000, max_sequence_length=100):
    """
    Tokenize text and prepare sequences
    """
    print("Tokenizing text...")
    tokenizer = Tokenizer(num_words=max_words, oov_token='<OOV>')
    tokenizer.fit_on_texts(X_train)
    
    # Convert text to sequences
    X_train_seq = tokenizer.texts_to_sequences(X_train)
    X_test_seq = tokenizer.texts_to_sequences(X_test)
    
    # Pad sequences
    X_train_pad = pad_sequences(X_train_seq, maxlen=max_sequence_length, padding='post')
    X_test_pad = pad_sequences(X_test_seq, maxlen=max_sequence_length, padding='post')
    
    print(f"Vocabulary size: {len(tokenizer.word_index) + 1}")
    
    return X_train_pad, X_test_pad, tokenizer

# 3. Model Building
def build_emotion_model(vocab_size, embedding_dim=128, max_sequence_length=100, num_emotions=28):
    """
    Build a Bidirectional LSTM model for multi-label emotion classification
    """
    print("Building model...")
    model = Sequential()
    
    # Embedding layer
    model.add(Embedding(input_dim=vocab_size, 
                        output_dim=embedding_dim, 
                        input_length=max_sequence_length))
    
    # Add spatial dropout to prevent overfitting
    model.add(SpatialDropout1D(0.2))
    
    # Bidirectional LSTM layers
    model.add(Bidirectional(LSTM(64, return_sequences=True)))
    model.add(Bidirectional(LSTM(32)))
    
    # Dense layers with dropout
    model.add(Dense(64, activation='relu'))
    model.add(Dropout(0.3))
    
    # Output layer with sigmoid for multi-label classification
    model.add(Dense(num_emotions, activation='sigmoid'))
    
    # Compile model
    model.compile(
        loss='binary_crossentropy',
        optimizer='adam',
        metrics=['accuracy']
    )
    
    model.summary()
    return model

# 4. Training and Evaluation
def train_and_evaluate_model(model, X_train, y_train, X_test, y_test, batch_size=64, epochs=10):
    """
    Train and evaluate the model
    """
    print("Training model...")
    # Use early stopping to prevent overfitting
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True
    )
    
    # Train the model
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        batch_size=batch_size,
        epochs=epochs,
        callbacks=[early_stopping]
    )
    
    # Evaluate the model
    print("Evaluating model...")
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")
    
    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_binary = (y_pred > 0.5).astype(int)
    
    # Calculate F1 score
    f1 = f1_score(y_test, y_pred_binary, average='micro')
    print(f"Micro F1 Score: {f1:.4f}")
    
    return history, y_pred_binary

# 5. Visualization Functions
def plot_training_history(history):
    """
    Plot training and validation metrics
    """
    plt.figure(figsize=(12, 5))
    
    # Plot accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.show()

def plot_emotion_distribution(y_data, emotion_labels):
    """
    Plot distribution of emotions in the dataset
    """
    emotion_counts = y_data.sum(axis=0)
    emotion_df = pd.DataFrame({'Emotion': emotion_labels, 'Count': emotion_counts})
    emotion_df = emotion_df.sort_values('Count', ascending=False)
    
    plt.figure(figsize=(14, 8))
    sns.barplot(x='Emotion', y='Count', data=emotion_df)
    plt.title('Emotion Distribution in Dataset')
    plt.xticks(rotation=90)
    plt.tight_layout()
    plt.show()

# 6. Emotion Analysis Functions for Real-time Use
def analyze_emotion(text, tokenizer, model, emotion_labels, max_sequence_length=100):
    """
    Analyze emotions in a given text using the trained model
    """
    # Preprocess the text
    processed_text = preprocess_text(text)
    
    # Tokenize and pad the text
    sequence = tokenizer.texts_to_sequences([processed_text])
    padded_sequence = pad_sequences(sequence, maxlen=max_sequence_length, padding='post')
    
    # Predict emotions
    prediction = model.predict(padded_sequence)[0]
    
    # Get top emotions (those with prediction > threshold)
    threshold = 0.3
    emotions = {}
    for i, score in enumerate(prediction):
        if score > threshold:
            emotions[emotion_labels[i]] = float(score)
    
    # Sort emotions by score
    emotions = {k: v for k, v in sorted(emotions.items(), key=lambda item: item[1], reverse=True)}
    
    return emotions

def analyze_journal_entries(entries, tokenizer, model, emotion_labels, max_sequence_length=100):
    """
    Analyze emotions across multiple journal entries to track mood over time
    
    Args:
        entries: List of dictionaries with 'date' and 'text' keys
    
    Returns:
        DataFrame with emotions tracked over time
    """
    results = []
    
    for entry in entries:
        date = entry['date']
        text = entry['text']
        
        emotions = analyze_emotion(text, tokenizer, model, emotion_labels, max_sequence_length)
        
        # Create a record for this entry
        record = {'date': date}
        for emotion, score in emotions.items():
            record[emotion] = score
        
        results.append(record)
    
    # Convert to DataFrame
    df_emotions = pd.DataFrame(results)
    
    return df_emotions

def plot_emotion_trends(emotion_df):
    """
    Plot trends of emotions over time from journal entries
    """
    # Convert date to datetime if it's not already
    if not pd.api.types.is_datetime64_any_dtype(emotion_df['date']):
        emotion_df['date'] = pd.to_datetime(emotion_df['date'])
    
    # Set date as index for time series plotting
    emotion_df = emotion_df.set_index('date')
    
    # Plot trends
    plt.figure(figsize=(14, 8))
    for column in emotion_df.columns:
        plt.plot(emotion_df.index, emotion_df[column], label=column)
    
    plt.title('Emotion Trends Over Time')
    plt.xlabel('Date')
    plt.ylabel('Emotion Score')
    plt.legend(loc='upper left', bbox_to_anchor=(1, 1))
    plt.grid(True)
    plt.tight_layout()
    plt.show()

# 7. Main Function to Run Everything
def main():
    """
    Main function to run the entire process
    """
    # File path to the Go Emotions dataset
    # You'll need to download this from https://github.com/google-research/google-research/tree/master/goemotions
    file_path = "path_to_goemotions/emotions.csv"  # Replace with your file path
    
    # Load and preprocess data
    data = load_and_preprocess_data(file_path)
    
    # Prepare dataset
    X_train, X_test, y_train, y_test, emotion_labels = prepare_dataset(data)
    
    # Plot emotion distribution
    plot_emotion_distribution(y_train, emotion_labels)
    
    # Tokenize text
    X_train_pad, X_test_pad, tokenizer = tokenize_text(X_train, X_test)
    
    # Build model
    vocab_size = len(tokenizer.word_index) + 1
    model = build_emotion_model(
        vocab_size=vocab_size,
        embedding_dim=128,
        max_sequence_length=100,
        num_emotions=len(emotion_labels)
    )
    
    # Train and evaluate model
    history, y_pred = train_and_evaluate_model(
        model, X_train_pad, y_train, X_test_pad, y_test,
        batch_size=64, epochs=10
    )
    
    # Plot training history
    plot_training_history(history)
    
    # Save model and tokenizer
    model.save('emotion_analysis_model.h5')
    
    # Save tokenizer and emotion labels for later use
    import pickle
    with open('tokenizer.pickle', 'wb') as handle:
        pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
    
    with open('emotion_labels.pickle', 'wb') as handle:
        pickle.dump(emotion_labels, handle, protocol=pickle.HIGHEST_PROTOCOL)
    
    print("Model and resources saved successfully.")
    
    # Example of analyzing a single text
    sample_text = "I had a wonderful day today, everything went so well!"
    emotions = analyze_emotion(sample_text, tokenizer, model, emotion_labels)
    print(f"Emotions detected in: '{sample_text}'")
    for emotion, score in emotions.items():
        print(f"  - {emotion}: {score:.4f}")
    
    # Example of analyzing journal entries over time
    # This would be integrated with your chatbot and journal system
    sample_entries = [
        {'date': '2023-01-01', 'text': 'Today was a great day, I felt really productive.'},
        {'date': '2023-01-02', 'text': 'I am a bit worried about my upcoming presentation.'},
        {'date': '2023-01-03', 'text': 'I'm so excited about my vacation next week!'},
        {'date': '2023-01-04', 'text': 'Feeling a bit down today, nothing went as planned.'}
    ]
    
    emotion_df = analyze_journal_entries(sample_entries, tokenizer, model, emotion_labels)
    print("Emotion analysis over time:")
    print(emotion_df)
    
    # Plot emotion trends
    plot_emotion_trends(emotion_df)

if __name__ == "__main__":
    main()