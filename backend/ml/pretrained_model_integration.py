"""
Pretrained Model Integration Example

This script demonstrates how to integrate a pretrained external model
into the SymptomSentryAI application using the enhanced model loader.

This example shows how to:
1. Download a pretrained TensorFlow model
2. Adapt it to work with our system
3. Register it for use in the application
4. Test it with sample images

Usage:
    python pretrained_model_integration.py
"""

import os
import tempfile
import requests
import tensorflow as tf
import numpy as np
from pathlib import Path
import urllib.request
import zipfile
import io
from PIL import Image
import matplotlib.pyplot as plt

# Import local modules
from enhanced_model_loader import register_custom_model, get_model, ModelRegistry
from enhanced_image_analyzer import analyze_image
from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS

def download_sample_image(url, output_path=None):
    """Download a sample image for testing"""
    if output_path is None:
        # Create a temporary file
        fd, output_path = tempfile.mkstemp(suffix='.jpg')
        os.close(fd)
    
    # Download the image
    try:
        urllib.request.urlretrieve(url, output_path)
        return output_path
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

def load_saved_model_from_url(model_url, model_name=None):
    """
    Load a saved TensorFlow model from a URL
    
    Args:
        model_url: URL to the model (.h5 file or zip containing SavedModel)
        model_name: Name to give the downloaded model
        
    Returns:
        Loaded TensorFlow model or None if download failed
    """
    try:
        # Create a temporary directory for downloading
        temp_dir = tempfile.mkdtemp()
        
        if model_name is None:
            model_name = os.path.basename(model_url).split('.')[0]
        
        # Download path
        model_path = os.path.join(temp_dir, f"{model_name}")
        
        print(f"Downloading model from {model_url}...")
        
        # Handle different model formats
        if model_url.endswith('.h5'):
            # Download .h5 file directly
            download_path = model_path + '.h5'
            urllib.request.urlretrieve(model_url, download_path)
            
            # Load the model
            model = tf.keras.models.load_model(download_path)
            
        elif model_url.endswith('.zip'):
            # Download and extract zip file
            zip_path = model_path + '.zip'
            urllib.request.urlretrieve(model_url, zip_path)
            
            # Extract the zip file
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(model_path)
            
            # Load the SavedModel
            model = tf.keras.models.load_model(model_path)
            
        else:
            print(f"Unsupported model format: {model_url}")
            return None
        
        print(f"Model loaded successfully!")
        return model
    
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def adapt_model_for_symptom_sentry(model, input_shape=(224, 224, 3), num_classes=None):
    """
    Adapt an external model to work with the SymptomSentryAI application
    
    This function:
    1. Freezes the base model layers
    2. Replaces the classification head to match our conditions
    3. Makes sure input and output shapes are compatible
    
    Args:
        model: External TensorFlow model
        input_shape: Expected input shape
        num_classes: Number of condition classes
        
    Returns:
        Adapted model compatible with SymptomSentryAI
    """
    # Determine number of classes if not provided
    if num_classes is None:
        # Default to throat conditions
        num_classes = len(THROAT_CONDITIONS)
    
    # Step 1: Freeze the base model
    for layer in model.layers[:-1]:  # Keep the last layer unfrozen
        layer.trainable = False
    
    # Step 2: Get the base model without the output layer
    base_output = model.layers[-2].output
    
    # Step 3: Add a new classification head
    x = tf.keras.layers.GlobalAveragePooling2D()(base_output)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.5)(x)
    outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
    
    # Step 4: Create the adapted model
    adapted_model = tf.keras.Model(inputs=model.input, outputs=outputs)
    
    # Step 5: Compile the model
    adapted_model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return adapted_model

def create_mock_training_data(num_samples=10, input_shape=(224, 224, 3), num_classes=5):
    """
    Create mock training data for fine-tuning a model
    
    Args:
        num_samples: Number of training samples
        input_shape: Input shape of images
        num_classes: Number of classes
        
    Returns:
        x_train, y_train: Training data and labels
    """
    # Create random images
    x_train = np.random.rand(num_samples, *input_shape)
    
    # Create one-hot encoded labels
    y_train = np.zeros((num_samples, num_classes))
    for i in range(num_samples):
        y_train[i, np.random.randint(0, num_classes)] = 1
    
    return x_train, y_train

def fine_tune_model(model, category='throat', epochs=5):
    """
    Fine-tune the model on mock training data
    
    Args:
        model: TensorFlow model to fine-tune
        category: Model category ('throat' or 'ear')
        epochs: Number of training epochs
        
    Returns:
        Fine-tuned model
    """
    # Determine number of classes
    if category == 'throat':
        num_classes = len(THROAT_CONDITIONS)
    else:  # ear
        num_classes = len(EAR_CONDITIONS)
    
    # Create mock training data
    x_train, y_train = create_mock_training_data(
        num_samples=20,
        input_shape=(224, 224, 3),
        num_classes=num_classes
    )
    
    # Fine-tune the model
    print(f"Fine-tuning model with {len(x_train)} samples for {epochs} epochs...")
    model.fit(
        x_train, y_train,
        epochs=epochs,
        verbose=1
    )
    
    return model

def integrate_pretrained_model():
    """
    Main function to integrate a pretrained model
    """
    print("✨ SymptomSentryAI Pretrained Model Integration ✨")
    print("=" * 60)
    
    # Initialize the registry
    registry = ModelRegistry()
    
    # 1. Download a pre-trained image classification model 
    # Using a dummy URL - in a real scenario, you would use a real model URL
    # For example, a TensorFlow Hub URL or a model from your own storage
    model_url = "https://storage.googleapis.com/tensorflow/keras-applications/mobilenet_v2/mobilenet_v2_weights_tf_dim_ordering_tf_kernels_1.0_224.h5"
    
    print("\n1. Downloading and loading a pretrained model")
    print("-" * 50)
    
    # Load the model 
    try:
        # In this example, we'll just create a simple model instead of downloading
        # Use the code below when you have a real model URL
        # pretrained_model = load_saved_model_from_url(model_url, "external_model")
        
        # For demonstration, we'll create a MobileNetV2 model
        pretrained_model = tf.keras.applications.MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=True,
            weights='imagenet'
        )
        
        print("Pretrained model loaded successfully!")
        print(f"Model type: {type(pretrained_model).__name__}")
        print(f"Input shape: {pretrained_model.input_shape}")
        print(f"Output shape: {pretrained_model.output_shape}")
    except Exception as e:
        print(f"Error loading pretrained model: {e}")
        return
    
    # 2. Adapt the model for SymptomSentryAI
    print("\n2. Adapting the model for SymptomSentryAI")
    print("-" * 50)
    
    # Choose a category to adapt the model for
    category = 'throat'
    
    # Get the number of classes
    if category == 'throat':
        num_classes = len(THROAT_CONDITIONS)
        print(f"Adapting model for throat analysis with {num_classes} classes...")
    else:  # ear
        num_classes = len(EAR_CONDITIONS)
        print(f"Adapting model for ear analysis with {num_classes} classes...")
    
    # Adapt the model
    adapted_model = adapt_model_for_symptom_sentry(
        pretrained_model,
        input_shape=(224, 224, 3),
        num_classes=num_classes
    )
    
    print("Model adapted successfully!")
    print(f"Adapted model output shape: {adapted_model.output_shape}")
    
    # 3. Fine-tune the model with mock data
    print("\n3. Fine-tuning the model")
    print("-" * 50)
    
    fine_tuned_model = fine_tune_model(
        adapted_model,
        category=category,
        epochs=2  # Just a few epochs for demonstration
    )
    
    print("Model fine-tuning complete!")
    
    # 4. Register the model in SymptomSentryAI
    print("\n4. Registering the model in SymptomSentryAI")
    print("-" * 50)
    
    # Create a version name
    version = "pretrained_v1"
    architecture = "mobilenet_v2"
    
    # Register the model
    success = register_custom_model(
        category,
        fine_tuned_model,
        version,
        architecture,
        is_default=False  # Set to True to make it the default model
    )
    
    if success:
        print(f"Model registered successfully as {category}/{version}!")
    else:
        print("Error registering model")
        return
    
    # 5. Test the model with a sample image
    print("\n5. Testing the model with a sample image")
    print("-" * 50)
    
    # Create a sample image for testing (in reality, you'd use a real medical image)
    from model_swap_example import create_test_image
    test_image = create_test_image()
    
    # Analyze the image with our new model
    print(f"Analyzing test image with {category}/{version} model...")
    results = analyze_image(test_image, category, version=version)
    
    if results:
        print("\nAnalysis results:")
        for i, result in enumerate(results):
            print(f"{i+1}. {result['name']}: {result['confidence']:.4f}")
    else:
        print("No results returned")
    
    # 6. Compare with default model
    print("\n6. Comparing with default model")
    print("-" * 50)
    
    print(f"Analyzing test image with default {category} model...")
    default_results = analyze_image(test_image, category)
    
    if default_results:
        print("\nDefault model results:")
        for i, result in enumerate(default_results):
            print(f"{i+1}. {result['name']}: {result['confidence']:.4f}")
    else:
        print("No results returned from default model")
    
    print("\n✅ Pretrained model integration complete!")
    print("You can now use this model in your application.")

if __name__ == "__main__":
    integrate_pretrained_model()