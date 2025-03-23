"""
Medical Image Analyzer Module

This module processes medical images (throat and ear) and performs
machine learning inference to identify potential conditions.
"""

import os
import sys
import base64
import re
import json
from io import BytesIO
from PIL import Image
import numpy as np
import tensorflow as tf

from .model_loader import load_model

# Constants
IMAGE_SIZE = (224, 224)  # Standard size for input to our models

# Condition definitions
# These would typically come from a database but are hardcoded here for the demo
THROAT_CONDITIONS = [
    {
        "id": "strep_throat",
        "name": "Strep Throat",
        "description": "A bacterial infection that causes inflammation and pain in the throat.",
        "symptoms": ["Sore throat", "Difficulty swallowing", "Fever", "Red and swollen tonsils"],
        "isPotentiallySerious": True
    },
    {
        "id": "pharyngitis",
        "name": "Pharyngitis",
        "description": "Inflammation of the pharynx, resulting in a sore throat.",
        "symptoms": ["Sore throat", "Dry throat", "Swollen lymph nodes"],
        "isPotentiallySerious": False
    },
    {
        "id": "tonsillitis",
        "name": "Tonsillitis",
        "description": "Inflammation of the tonsils, typically due to viral or bacterial infection.",
        "symptoms": ["Swollen tonsils", "Sore throat", "Difficulty swallowing", "Bad breath"],
        "isPotentiallySerious": True
    }
]

EAR_CONDITIONS = [
    {
        "id": "ear_infection",
        "name": "Ear Infection",
        "description": "Infection of the middle ear, often causing pain and hearing difficulty.",
        "symptoms": ["Ear pain", "Fluid drainage", "Hearing difficulties", "Fever"],
        "isPotentiallySerious": True
    },
    {
        "id": "earwax_buildup",
        "name": "Earwax Buildup",
        "description": "Excessive accumulation of cerumen (earwax) in the ear canal.",
        "symptoms": ["Feeling of fullness", "Hearing difficulties", "Earache", "Ringing in the ear"],
        "isPotentiallySerious": False
    },
    {
        "id": "otitis_externa",
        "name": "Otitis Externa",
        "description": "Inflammation of the ear canal, often called swimmer's ear.",
        "symptoms": ["Ear pain", "Itchiness", "Drainage", "Redness"],
        "isPotentiallySerious": True
    }
]

def preprocess_image(image_data):
    """
    Preprocess an image for model input
    
    Args:
        image_data: Either a file path, a BytesIO object, or bytes containing the image data.
                   Can also be a base64 encoded string.
    
    Returns:
        A tensor of shape (1, 224, 224, 3) ready for model input
    """
    try:
        # Handle different input types
        if isinstance(image_data, str):
            # Check if it's a base64 string
            if image_data.startswith('data:image'):
                # Extract the base64 part
                base64_data = re.sub(r'^data:image/[a-zA-Z]+;base64,', '', image_data)
                image_data = base64.b64decode(base64_data)
                img = Image.open(BytesIO(image_data))
            else:
                # Assume it's a file path
                img = Image.open(image_data)
        elif isinstance(image_data, BytesIO):
            img = Image.open(image_data)
        else:
            # Assume it's bytes
            img = Image.open(BytesIO(image_data))
        
        # Resize and convert to RGB if needed
        img = img.resize(IMAGE_SIZE)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {str(e)}")

def analyze_image(image_data, type):
    """
    Analyze a medical image and return confidence scores for various conditions
    
    Args:
        image_data: The image data (can be a file path, BytesIO, bytes, or base64 string)
        type: Either 'throat' or 'ear'
    
    Returns:
        A dictionary with analysis results including conditions and confidence scores
    """
    # Validate parameters
    if not image_data:
        raise ValueError("No image provided")
    
    if type not in ['throat', 'ear']:
        raise ValueError(f"Invalid analysis type: {type}. Must be 'throat' or 'ear'")
    
    try:
        # Load the appropriate model
        model = load_model(type)
        
        # Preprocess the image
        img_tensor = preprocess_image(image_data)
        
        # Run inference
        predictions = model.predict(img_tensor)[0]
        
        # Get the conditions for this type
        conditions = get_conditions(type)
        
        # Map predictions to conditions
        result_conditions = []
        for i, condition in enumerate(conditions):
            if i < len(predictions):
                confidence = float(predictions[i])
                result_condition = {
                    **condition,
                    "confidence": confidence
                }
                result_conditions.append(result_condition)
        
        # Sort by confidence (highest first)
        result_conditions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Return top 2 conditions
        top_conditions = result_conditions[:2]
        
        return {
            "type": type,
            "conditions": top_conditions
        }
    except Exception as e:
        raise Exception(f"Error analyzing image: {str(e)}")

def get_conditions(type):
    """
    Get condition definitions for a specific type
    
    Args:
        type: Either 'throat' or 'ear'
    
    Returns:
        List of condition objects
    """
    if type == 'throat':
        return THROAT_CONDITIONS
    elif type == 'ear':
        return EAR_CONDITIONS
    else:
        raise ValueError(f"Invalid condition type: {type}")

def analyze_throat_image(image_data):
    """
    Convenience function to analyze throat images
    
    Args:
        image_data: The image data
    
    Returns:
        Analysis results
    """
    return analyze_image(image_data, 'throat')

def analyze_ear_image(image_data):
    """
    Convenience function to analyze ear images
    
    Args:
        image_data: The image data
    
    Returns:
        Analysis results
    """
    return analyze_image(image_data, 'ear')