"""
Model Loader Module

This module handles loading and caching ML models for medical image analysis.
"""

import os
import time
import tensorflow as tf
import numpy as np

# Cache for loaded models to avoid reloading
_model_cache = {}

def load_model(model_type):
    """
    Load a model for the specified type (throat or ear)
    
    Args:
        model_type: Either 'throat' or 'ear'
    
    Returns:
        A TensorFlow model
    """
    global _model_cache
    
    # Check if the model is already loaded
    if model_type in _model_cache:
        return _model_cache[model_type]
    
    # Path to models directory
    models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
    
    # Create models directory if it doesn't exist
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    
    # Specific model path
    model_path = os.path.join(models_dir, f'{model_type}_model')
    
    # Check if the model exists
    if os.path.exists(model_path):
        # Load the saved model
        model = tf.keras.models.load_model(model_path)
    else:
        # If no model exists, create a mock model for testing/development
        print(f"No saved model found for {model_type}, creating a mock model")
        model = create_mock_model()
        
        # Save the mock model for future use
        model.save(model_path)
    
    # Cache the model
    _model_cache[model_type] = model
    
    return model

def create_mock_model():
    """
    Create a mock TensorFlow model for testing purposes
    
    Returns:
        A simple TensorFlow model
    """
    # Create a simple sequential model
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.Conv2D(16, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dense(3, activation='softmax')  # 3 output classes (conditions)
    ])
    
    # Compile the model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def clear_model_cache():
    """
    Clear the model cache to free memory
    """
    global _model_cache
    _model_cache = {}