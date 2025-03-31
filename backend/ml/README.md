# SymptomSentryAI Machine Learning Architecture

This document outlines the enhanced machine learning architecture for SymptomSentryAI, which supports dynamic model swapping, versioning, and ensemble predictions.

## Architecture Overview

The ML system has been enhanced with the following capabilities:

1. **Model Registry System**: A centralized registry for managing different models
2. **Multiple Model Architectures**: Support for various CNN architectures (ResNet50, EfficientNet, MobileNet, DenseNet)
3. **Version Control**: Models can be versioned and swapped at runtime
4. **Ensemble Models**: Combine predictions from multiple models with weighted averaging
5. **Attention Visualization**: Generate heatmaps to visualize model focus areas
6. **Flexible Preprocessing**: Customized preprocessing for different model architectures

## Key Components

### 1. Enhanced Model Loader (`enhanced_model_loader.py`)

The model loader provides a registry system for managing multiple model versions:

```python
# Get the default model for throat analysis
model = get_model('throat')

# Get a specific model version
model = get_model('throat', version='v2')

# Get an ensemble model
model = get_model('throat', model_type='ensemble')
```

### 2. Enhanced Image Analyzer (`enhanced_image_analyzer.py`)

The image analyzer supports various model types and provides rich analysis results:

```python
# Standard analysis with default model
results = analyze_image(image_data, 'throat')

# Analysis with specific model version
results = analyze_image(image_data, 'throat', version='v2')

# Analysis with attention map visualization
results, attention_map = analyze_image(image_data, 'throat', return_attention=True)
```

### 3. Model Swapping Example (`model_swap_example.py`)

Demonstrates how to swap between different model architectures at runtime:

```python
# Register a custom model
register_custom_model("throat", custom_model, "custom_v1", "custom_cnn")

# Set as default model
registry.set_default_model("throat", "custom_v1")

# Create an ensemble model
registry.create_ensemble("throat", "my_ensemble", ["v1", "custom_v1"], [0.7, 0.3])
```

### 4. Pretrained Model Integration (`pretrained_model_integration.py`)

Shows how to integrate external pretrained models into the system:

```python
# Load a pretrained model
pretrained_model = load_saved_model_from_url(model_url)

# Adapt it for SymptomSentryAI
adapted_model = adapt_model_for_symptom_sentry(pretrained_model, num_classes=num_classes)

# Register the model
register_custom_model(category, fine_tuned_model, version, architecture)
```

## Using the Enhanced ML System

### Registering a Custom Model

```python
from enhanced_model_loader import register_custom_model
import tensorflow as tf

# Create a custom model
model = tf.keras.Sequential([
    # ... model layers
])

# Register the model
register_custom_model('throat', model, 'custom_v1', 'custom_architecture')
```

### Creating an Ensemble Model

```python
from enhanced_model_loader import ModelRegistry

# Get registry instance
registry = ModelRegistry()

# Create an ensemble with 70% weight for v1 and 30% weight for v2
registry.create_ensemble('throat', 'my_ensemble', ['v1', 'v2'], [0.7, 0.3])
```

### Analyzing with a Specific Model Version

```python
from enhanced_image_analyzer import analyze_image

# Analyze with the default model
results = analyze_image(image_data, 'throat')

# Analyze with a specific version
results = analyze_image(image_data, 'throat', version='custom_v1')

# Analyze with an ensemble model
results = analyze_image(image_data, 'throat', version='my_ensemble')
```

### Generating Attention Maps

```python
from enhanced_image_analyzer import analyze_image, overlay_attention_map

# Get analysis results and attention map
results, attention_map = analyze_image(image_data, 'throat', return_attention=True)

# Overlay attention map on the original image
visualization = overlay_attention_map(image_data, attention_map)
```

## Benefits of the Enhanced Architecture

1. **Flexibility**: Easily swap between different model architectures
2. **Improved Performance**: Use ensemble models to combine predictions from multiple architectures
3. **Versioning**: Maintain multiple model versions without code changes
4. **Explainability**: Visualize model attention to understand predictions
5. **Future-proofing**: Seamlessly integrate new model architectures as they become available

## Testing the ML System

The ML system includes comprehensive test coverage:

```
python run_tests.py     # Run all ML tests
python -m pytest tests/ # Run specific test modules
```

## Future Enhancements

- Model performance monitoring and automatic selection
- Online learning and model retraining
- User feedback integration for model improvement
- Support for additional model architectures (Vision Transformer, etc.)
- Enhanced ensemble methods (stacking, bagging)