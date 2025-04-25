"""
Binary Medical Image Classifier

This module provides a binary classification mode for medical images:
1. Normal (healthy) state
2. Infected/abnormal state

It wraps the existing multiclass classification functionality to maintain
backward compatibility and enable easy switching between binary and multiclass
modes.

Usage:
    from binary_classifier import analyze_image_binary
    
    # Get binary classification (normal/infected)
    binary_result = analyze_image_binary(image_data, 'throat')
    
    # Binary classification with attention map
    binary_result, attention_map = analyze_image_binary(image_data, 'throat', 
                                                      return_attention=True)
"""

try:
    import numpy as np 
except ImportError:
    # If numpy is not available, create a minimal implementation for basic operations
    class NumpyMock:
        def maximum(self, arr, val):
            return [max(x, val) for x in arr]
            
        def max(self, arr):
            return max(arr)
            
    np = NumpyMock()

from enhanced_image_analyzer import analyze_image, generate_attention_map
from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS

# Define binary condition categories
BINARY_CONDITIONS = {
    "normal": {
        "id": "normal",
        "name": "Normal/Healthy",
        "description": "No significant abnormalities detected.",
        "symptoms": [],
        "isPotentiallySerious": False,
        "treatmentInfo": "No specific treatment needed. Continue with regular health maintenance.",
        "recommendConsultation": False
    },
    "infected": {
        "id": "infected",
        "name": "Abnormal/Infected",
        "description": "Abnormalities detected that may indicate infection or other medical conditions.",
        "symptoms": [
            "May include pain, inflammation, discharge, or other symptoms",
            "Specific symptoms depend on the affected area and condition severity"
        ],
        "isPotentiallySerious": True,
        "treatmentInfo": "Please consult a healthcare professional for proper diagnosis and treatment.",
        "recommendConsultation": True
    }
}


def analyze_image_binary(img_data, analysis_type, version=None, model_type=None,
                      return_attention=False, confidence_threshold=0.15, 
                      infection_threshold=0.3):
    """
    Perform binary classification (normal/infected) on a medical image
    
    Args:
        img_data: Image data (bytes, path, or base64 string)
        analysis_type: Type of analysis ('throat' or 'ear')
        version: Specific model version to use
        model_type: Type of model to use (e.g., 'ensemble')
        return_attention: Whether to return attention heatmap
        confidence_threshold: Minimum confidence to include in results
        infection_threshold: Threshold above which a condition is considered "infected"
        
    Returns:
        Dictionary with binary classification result (normal or infected)
        If return_attention is True, also returns attention heatmap
    """
    # Get multiclass predictions first
    multiclass_results = analyze_image(
        img_data, 
        analysis_type, 
        version=version,
        model_type=model_type,
        return_attention=return_attention,
        confidence_threshold=confidence_threshold
    )
    
    # Separate results and attention map if applicable
    if return_attention:
        conditions, attention_map = multiclass_results
    else:
        conditions = multiclass_results
        attention_map = None
    
    # Determine if infected based on confidence scores and potential seriousness
    max_confidence = 0
    has_serious_condition = False
    
    for condition in conditions:
        confidence = condition.get('confidence', 0)
        if confidence > max_confidence:
            max_confidence = confidence
        
        if condition.get('isPotentiallySerious', False) and confidence > infection_threshold:
            has_serious_condition = True
    
    # Determine binary classification based on confidence scores
    is_infected = has_serious_condition or max_confidence > infection_threshold
    binary_result = BINARY_CONDITIONS['infected'].copy() if is_infected else BINARY_CONDITIONS['normal'].copy()
    
    # Add confidence score based on highest multiclass confidence
    binary_result['confidence'] = max_confidence if is_infected else 1.0 - max_confidence
    
    # Add recommendation text based on confidence
    if binary_result['confidence'] > 0.7:
        binary_result['recommendationText'] = f"High confidence prediction for {binary_result['name']}."
    elif binary_result['confidence'] > 0.5:
        binary_result['recommendationText'] = f"Moderate confidence prediction for {binary_result['name']}."
    else:
        binary_result['recommendationText'] = f"Low confidence prediction for {binary_result['name']}."
    
    # Return result with attention map if requested
    if return_attention:
        return [binary_result], attention_map
    else:
        return [binary_result]


def get_binary_classification_from_multiclass(conditions, infection_threshold=0.3):
    """
    Convert multiclass classification results to binary (normal/infected)
    
    Args:
        conditions: List of condition dictionaries with confidence scores
        infection_threshold: Threshold above which a condition is considered "infected"
        
    Returns:
        Dictionary with binary classification result (normal or infected)
    """
    max_confidence = 0
    has_serious_condition = False
    
    for condition in conditions:
        confidence = condition.get('confidence', 0)
        if confidence > max_confidence:
            max_confidence = confidence
        
        if condition.get('isPotentiallySerious', False) and confidence > infection_threshold:
            has_serious_condition = True
    
    # Determine binary classification based on confidence scores
    is_infected = has_serious_condition or max_confidence > infection_threshold
    binary_result = BINARY_CONDITIONS['infected'].copy() if is_infected else BINARY_CONDITIONS['normal'].copy()
    
    # Add confidence score based on highest multiclass confidence
    binary_result['confidence'] = max_confidence if is_infected else 1.0 - max_confidence
    
    # Add recommendation text based on confidence
    if binary_result['confidence'] > 0.7:
        binary_result['recommendationText'] = f"High confidence prediction for {binary_result['name']}."
    elif binary_result['confidence'] > 0.5:
        binary_result['recommendationText'] = f"Moderate confidence prediction for {binary_result['name']}."
    else:
        binary_result['recommendationText'] = f"Low confidence prediction for {binary_result['name']}."
    
    return [binary_result]