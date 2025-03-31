"""
Model Swapping Example

This script demonstrates how to use the enhanced model loader and
image analyzer to swap between different model architectures.

Usage:
    python model_swap_example.py
"""

import os
import numpy as np
import tensorflow as tf
from PIL import Image
import matplotlib.pyplot as plt
import io

# Import custom modules
from enhanced_model_loader import get_model, ModelRegistry, register_custom_model
from enhanced_image_analyzer import analyze_image, preprocess_image
from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS

def create_test_image(width=224, height=224):
    """Create a simple test image with colored regions"""
    # Create a test image with red, green, and blue regions
    img = Image.new('RGB', (width, height))
    pixels = img.load()
    
    # Fill with pattern
    for i in range(width):
        for j in range(height):
            if i < width//3:
                pixels[i, j] = (200, 100, 100)  # Reddish
            elif i < 2*width//3:
                pixels[i, j] = (100, 200, 100)  # Greenish
            else:
                pixels[i, j] = (100, 100, 200)  # Bluish
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

def create_custom_model(num_classes, name, input_shape=(224, 224, 3)):
    """Create a custom TensorFlow model"""
    # Create a simple CNN model
    model = tf.keras.Sequential([
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(num_classes, activation='softmax', name=f'{name}_output')
    ])
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def demonstrate_model_swapping():
    """Demonstrate model swapping functionality"""
    print("✅ Demonstrating Model Swapping Functionality")
    print("=" * 60)
    
    # Initialize the registry
    registry = ModelRegistry()
    
    # 1. List available models
    print("\n1. Checking available models in registry:")
    print("-" * 50)
    for category, info in registry._registry.items():
        print(f"Category: {category}")
        print(f"  Default version: {info.get('default_version', 'none')}")
        if 'versions' in info:
            for version, version_info in info['versions'].items():
                print(f"  Version: {version}")
                print(f"    Architecture: {version_info.get('architecture', 'unknown')}")
                print(f"    Path: {version_info.get('path', 'unknown')}")
    
    # 2. Create and register a custom model
    print("\n2. Creating and registering a custom model:")
    print("-" * 50)
    
    # Create a custom throat model
    print("Creating custom throat model...")
    num_throat_conditions = len(THROAT_CONDITIONS)
    custom_throat_model = create_custom_model(num_throat_conditions, "custom_throat")
    
    # Register the custom model
    version = "custom_v1"
    print(f"Registering custom model as throat/{version}...")
    register_custom_model("throat", custom_throat_model, version, "custom_cnn")
    
    # 3. Set the custom model as default
    print("\n3. Setting custom model as default:")
    print("-" * 50)
    registry.set_default_model("throat", version)
    print(f"Default throat model set to: {version}")
    
    # 4. Create an ensemble model
    print("\n4. Creating an ensemble model:")
    print("-" * 50)
    registry.create_ensemble("throat", "my_ensemble", ["v1", version], [0.7, 0.3])
    print("Created ensemble model 'my_ensemble' with:")
    print("  - 70% weight for model v1")
    print("  - 30% weight for model custom_v1")
    
    # 5. Test different models
    print("\n5. Testing different models on the same image:")
    print("-" * 50)
    
    # Create a test image
    test_image = create_test_image()
    
    # Test with different model versions
    models_to_test = ["v1", version, "my_ensemble"]
    
    for model_version in models_to_test:
        print(f"\nAnalyzing with throat/{model_version}:")
        results = analyze_image(test_image, "throat", version=model_version)
        
        # Print top condition
        if results:
            top_result = results[0]
            print(f"Top condition: {top_result['name']}")
            print(f"Confidence: {top_result['confidence']:.4f}")
            print(f"Using model: throat/{model_version}")
        else:
            print("No results returned")
    
    print("\n✅ Model swapping demonstration complete!")
    print("This demonstrates how you can easily register and swap between different model architectures.")

if __name__ == "__main__":
    demonstrate_model_swapping()