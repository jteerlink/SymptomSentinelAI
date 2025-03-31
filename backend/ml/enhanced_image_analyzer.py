"""
Enhanced Medical Image Analyzer

This module provides improved medical image analysis with support for:
1. Multiple model architectures
2. Model versioning
3. Ensemble predictions
4. Improved preprocessing options
5. Attention visualization (heatmaps)

Usage:
    from enhanced_image_analyzer import analyze_image
    
    # Standard analysis
    results = analyze_image(image_data, 'throat')
    
    # Analysis with specific model version
    results = analyze_image(image_data, 'throat', version='v2')
    
    # Analysis with ensemble model
    results = analyze_image(image_data, 'throat', model_type='ensemble')
    
    # Analysis with attention map
    results, attention_map = analyze_image(image_data, 'throat', 
                                          return_attention=True)
"""

import os
import io
import re
import base64
import numpy as np
import tensorflow as tf
from PIL import Image
import matplotlib.pyplot as plt
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess
from tensorflow.keras.applications.densenet import preprocess_input as densenet_preprocess
from tensorflow.keras import Model

# Import local modules
from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS
from enhanced_model_loader import get_model, ModelRegistry

# Constants
IMG_SIZE = (224, 224)  # Standard size for most models


def preprocess_image(img_data, preprocessing='standard', target_size=IMG_SIZE):
    """
    Preprocess an image for model input with flexible preprocessing options
    
    Args:
        img_data: Image data (bytes, path, or base64 string)
        preprocessing: Preprocessing method ('standard', 'resnet', 'efficientnet', etc.)
        target_size: Target image size
        
    Returns:
        Preprocessed image tensor
    """
    try:
        # Handle base64 encoded images
        if isinstance(img_data, str) and img_data.startswith('data:image'):
            # Extract the base64 part
            base64_data = re.sub(r'^data:image/[a-zA-Z]+;base64,', '', img_data)
            img_data = base64.b64decode(base64_data)
        
        # Open and process the image
        img = Image.open(io.BytesIO(img_data))
        
        # Resize the image
        img = img.resize(target_size)
        
        # Convert to RGB if not already
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Convert to numpy array and add batch dimension
        img_array = np.array(img)[np.newaxis, ...]
        
        # Apply preprocessing based on method
        if preprocessing == 'resnet50' or preprocessing == 'resnet':
            return resnet_preprocess(img_array)
        elif preprocessing == 'efficientnet':
            return efficientnet_preprocess(img_array)
        elif preprocessing == 'mobilenet':
            return mobilenet_preprocess(img_array)
        elif preprocessing == 'densenet':
            return densenet_preprocess(img_array)
        else:  # standard preprocessing
            # Normalize to [0, 1]
            return img_array / 255.0
    
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")


def analyze_image(img_data, analysis_type, version=None, model_type=None,
                 return_attention=False, confidence_threshold=0.15):
    """
    Analyze a medical image and return conditions with confidence scores
    
    Args:
        img_data: Image data (bytes, path, or base64 string)
        analysis_type: Type of analysis ('throat' or 'ear')
        version: Specific model version to use
        model_type: Type of model to use (e.g., 'ensemble')
        return_attention: Whether to return attention heatmap
        confidence_threshold: Minimum confidence to include in results
        
    Returns:
        List of conditions with confidence scores
        If return_attention is True, also returns attention heatmap
    """
    # Validate analysis type
    if analysis_type not in ['throat', 'ear']:
        raise ValueError(f"Unsupported analysis type: {analysis_type}. Must be 'throat' or 'ear'.")
    
    # Get the appropriate model
    model = get_model(analysis_type, version, model_type)
    
    # Get preprocessing method based on model architecture
    if hasattr(model, 'model_infos') and model.model_infos:  # Ensemble model
        preprocessing = 'standard'  # Use standard preprocessing for ensembles
    else:
        # Get preprocessing method from registry
        registry = ModelRegistry()
        if analysis_type in registry._registry and 'default_version' in registry._registry[analysis_type]:
            default_version = registry._registry[analysis_type]['default_version']
            if 'versions' in registry._registry[analysis_type] and default_version in registry._registry[analysis_type]['versions']:
                model_info = registry._registry[analysis_type]['versions'][default_version]
                preprocessing = model_info.get('preprocessing', 'standard')
            else:
                preprocessing = 'standard'
        else:
            preprocessing = 'standard'
    
    # Preprocess the image
    img_tensor = preprocess_image(img_data, preprocessing)
    
    # Run inference
    predictions = model.predict(img_tensor)
    
    # Get attention map if requested
    attention_map = None
    if return_attention and not hasattr(model, 'members'):  # Only for non-ensemble models
        attention_map = generate_attention_map(model, img_tensor)
    
    # Get all conditions with confidence scores above threshold
    indices = np.where(predictions[0] > confidence_threshold)[0]
    if len(indices) == 0:
        # If no conditions above threshold, get top 2
        indices = np.argsort(predictions[0])[::-1][:2]
    else:
        # Sort by confidence
        indices = indices[np.argsort(predictions[0][indices])[::-1]]
    
    confidence_scores = predictions[0][indices]
    
    # Get conditions definitions
    if analysis_type == 'throat':
        conditions = THROAT_CONDITIONS
    else:  # ear
        conditions = EAR_CONDITIONS
    
    # Create results with additional metadata
    results = []
    for idx, confidence in zip(indices, confidence_scores):
        if idx < len(conditions):
            condition = conditions[idx].copy()
            condition['confidence'] = float(confidence)
            
            # Add recommendation text based on confidence
            if confidence > 0.7:
                condition['recommendationText'] = f"High confidence prediction for {condition['name']}."
                condition['recommendConsultation'] = condition.get('isPotentiallySerious', False)
            elif confidence > 0.5:
                condition['recommendationText'] = f"Moderate confidence prediction for {condition['name']}."
                condition['recommendConsultation'] = condition.get('isPotentiallySerious', False)
            else:
                condition['recommendationText'] = f"Low confidence prediction for {condition['name']}."
                condition['recommendConsultation'] = False
            
            # Add treatment information if not present
            if 'treatmentInfo' not in condition:
                if condition.get('isPotentiallySerious', False):
                    condition['treatmentInfo'] = "Please consult a healthcare professional for treatment options."
                else:
                    condition['treatmentInfo'] = "Consider symptom management and consult a healthcare professional if symptoms worsen."
            
            results.append(condition)
    
    if return_attention:
        return results, attention_map
    else:
        return results


def generate_attention_map(model, img_tensor):
    """
    Generate an attention heatmap to visualize where the model is focusing
    
    Args:
        model: The model to use
        img_tensor: Preprocessed image tensor
        
    Returns:
        Attention heatmap as numpy array
    """
    try:
        # Create a model that outputs both the predictions and the last conv layer
        last_conv_layer = None
        
        # Find the last convolutional layer
        for layer in reversed(model.layers):
            if 'conv' in layer.name:
                last_conv_layer = layer.name
                break
        
        if last_conv_layer is None:
            return None
        
        # Create a model that will return the last conv layer output
        grad_model = Model(
            inputs=[model.inputs],
            outputs=[model.get_layer(last_conv_layer).output, model.output]
        )
        
        # Compute gradient of top predicted class with respect to last conv layer
        with tf.GradientTape() as tape:
            conv_output, predictions = grad_model(img_tensor)
            top_pred_index = tf.argmax(predictions[0])
            top_class_channel = predictions[:, top_pred_index]
        
        # Gradient of the top predicted class with respect to the output feature map
        grads = tape.gradient(top_class_channel, conv_output)
        
        # Vector of mean intensity of gradient over feature map height and width
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        
        # Weight the channels by corresponding gradients
        conv_output = conv_output[0]
        
        # Weight activation channels by the gradient importance
        for i in range(pooled_grads.shape[0]):
            conv_output[:, :, i] *= pooled_grads[i]
            
        # Average over all channels to get heatmap
        heatmap = tf.reduce_mean(conv_output, axis=-1)
        
        # Normalize the heatmap
        heatmap = np.maximum(heatmap, 0) / np.max(heatmap)
        
        return heatmap.numpy()
    
    except Exception as e:
        print(f"Error generating attention map: {e}")
        return None


def overlay_attention_map(img_data, attention_map, alpha=0.4):
    """
    Overlay attention heatmap on the original image
    
    Args:
        img_data: Original image data
        attention_map: Attention heatmap
        alpha: Transparency level
        
    Returns:
        PIL Image with overlaid heatmap
    """
    try:
        # Process the original image
        if isinstance(img_data, str) and img_data.startswith('data:image'):
            base64_data = re.sub(r'^data:image/[a-zA-Z]+;base64,', '', img_data)
            img_data = base64.b64decode(base64_data)
            
        # Open the image
        img = Image.open(io.BytesIO(img_data))
        img = img.resize(IMG_SIZE)
        
        # Convert attention map to heatmap image
        heatmap = np.uint8(255 * attention_map)
        
        # Use jet colormap for heatmap visualization
        # Create a colormap
        plt.figure(figsize=(10, 5))
        plt.imshow(attention_map)
        plt.colorbar()
        plt.axis('off')
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
        buf.seek(0)
        
        # Open the heatmap image
        heatmap_img = Image.open(buf)
        heatmap_img = heatmap_img.resize(img.size)
        
        # Blend images
        result = Image.blend(img.convert('RGBA'), 
                            heatmap_img.convert('RGBA'), 
                            alpha)
        
        return result
    
    except Exception as e:
        print(f"Error overlaying attention map: {e}")
        return None


def save_attention_map(attention_map, output_path):
    """
    Save attention map as a PNG image
    
    Args:
        attention_map: Attention heatmap
        output_path: Path to save the heatmap
        
    Returns:
        Path to the saved file
    """
    try:
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Create a heatmap visualization
        plt.figure(figsize=(10, 8))
        plt.imshow(attention_map, cmap='jet')
        plt.colorbar()
        plt.title('Attention Map')
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()
        
        return output_path
    
    except Exception as e:
        print(f"Error saving attention map: {e}")
        return None


def register_custom_model(category, model, version, architecture, is_default=False):
    """
    Register a provided custom model
    
    Args:
        category: Analysis category ('throat' or 'ear')
        model: TensorFlow model object
        version: Version identifier
        architecture: Architecture name
        is_default: Whether this should be the default model
        
    Returns:
        True if successful
    """
    from enhanced_model_loader import register_custom_model as register_model
    return register_model(category, model, version, architecture, is_default)


def evaluate_model_performance(test_images, test_labels, category, version=None, model_type=None):
    """
    Evaluate model performance on a test dataset
    
    Args:
        test_images: List of image data
        test_labels: Ground truth labels 
        category: Analysis category ('throat' or 'ear')
        version: Model version
        model_type: Model type
        
    Returns:
        Dictionary with performance metrics
    """
    try:
        # Get the model
        model = get_model(category, version, model_type)
        
        # Track metrics
        correct = 0
        total = len(test_images)
        confidences = []
        
        # Process each image
        for img_data, true_label in zip(test_images, test_labels):
            # Get prediction
            results = analyze_image(img_data, category, version, model_type)
            
            # Get top prediction
            if results:
                top_result = results[0]
                prediction = top_result['id']
                confidence = top_result['confidence']
                
                if prediction == true_label:
                    correct += 1
                
                confidences.append(confidence)
        
        # Calculate metrics
        accuracy = correct / total if total > 0 else 0
        avg_confidence = np.mean(confidences) if confidences else 0
        
        return {
            'accuracy': accuracy,
            'correct': correct,
            'total': total,
            'average_confidence': avg_confidence
        }
    
    except Exception as e:
        print(f"Error evaluating model performance: {e}")
        return {
            'error': str(e),
            'accuracy': 0,
            'correct': 0,
            'total': len(test_images) if test_images else 0,
            'average_confidence': 0
        }