"""
Medical Image Analyzer

This module contains functions for analyzing medical images (throat, ear)
using a pre-trained TensorFlow model. It can be used to identify common
medical conditions based on image analysis.

Author: SymptomSentryAI Team
"""

import os
import io
import re
import base64
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model
from PIL import Image

# Constants
IMG_SIZE = (224, 224)  # ResNet50 expects 224x224 images

# Define potential throat conditions
THROAT_CONDITIONS = [
    {
        "id": "strep_throat",
        "name": "Strep Throat",
        "description": "A bacterial infection that causes inflammation and pain in the throat.",
        "symptoms": [
            "Throat pain that comes on quickly",
            "Red and swollen tonsils",
            "White patches on the tonsils",
            "Tiny red spots on the roof of the mouth",
            "Fever"
        ],
        "isPotentiallySerious": True
    },
    {
        "id": "tonsillitis",
        "name": "Tonsillitis",
        "description": "Inflammation of the tonsils, typically caused by viral or bacterial infection.",
        "symptoms": [
            "Red, swollen tonsils",
            "White or yellow coating on tonsils",
            "Sore throat",
            "Painful swallowing",
            "Fever"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "pharyngitis",
        "name": "Pharyngitis",
        "description": "Inflammation of the pharynx resulting in a sore throat.",
        "symptoms": [
            "Sore throat",
            "Difficulty swallowing",
            "Fever",
            "Enlarged lymph nodes"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "laryngitis",
        "name": "Laryngitis",
        "description": "Inflammation of the voice box (larynx) from infection, irritation, or overuse.",
        "symptoms": [
            "Hoarse, dry, or raspy voice",
            "Sore throat",
            "Dry cough",
            "Tickling sensation in the throat"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "epiglottitis",
        "name": "Epiglottitis",
        "description": "Inflammation of the epiglottis, which can lead to breathing difficulties.",
        "symptoms": [
            "Severe sore throat",
            "Difficulty and pain when swallowing",
            "Muffled voice",
            "Difficulty breathing",
            "Drooling"
        ],
        "isPotentiallySerious": True
    }
]

# Define potential ear conditions
EAR_CONDITIONS = [
    {
        "id": "otitis_media",
        "name": "Otitis Media (Middle Ear Infection)",
        "description": "Infection of the middle ear, often characterized by fluid buildup behind the eardrum.",
        "symptoms": [
            "Ear pain",
            "Difficulty hearing",
            "Drainage of fluid from the ear",
            "Fever",
            "Irritability in children"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "otitis_externa",
        "name": "Otitis Externa (Swimmer's Ear)",
        "description": "Infection of the ear canal, often from water exposure.",
        "symptoms": [
            "Ear pain that worsens when touching the outer ear",
            "Itchiness in the ear canal",
            "Redness and swelling",
            "Discharge of clear fluid or pus",
            "Temporary hearing loss"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "ear_wax_blockage",
        "name": "Ear Wax Blockage",
        "description": "Excessive buildup of cerumen (ear wax) in the ear canal.",
        "symptoms": [
            "Feeling of fullness in the ear",
            "Partial hearing loss",
            "Ringing or noises in the ear (tinnitus)",
            "Itching or discomfort"
        ],
        "isPotentiallySerious": False
    },
    {
        "id": "perforated_eardrum",
        "name": "Perforated Eardrum",
        "description": "A hole or tear in the tissue separating the ear canal from the middle ear.",
        "symptoms": [
            "Sudden sharp pain that subsides quickly",
            "Drainage from the ear",
            "Hearing loss",
            "Ringing in the ear (tinnitus)",
            "Spinning sensation (vertigo)"
        ],
        "isPotentiallySerious": True
    },
    {
        "id": "foreign_body",
        "name": "Foreign Body in Ear",
        "description": "An object trapped in the ear canal.",
        "symptoms": [
            "Pain or discomfort",
            "Feeling of fullness in the ear",
            "Decreased hearing",
            "Drainage or bleeding"
        ],
        "isPotentiallySerious": False
    }
]


class ModelLoader:
    """
    Handles loading and caching of pre-trained models.
    """
    _models = {}
    
    @classmethod
    def get_model(cls, analysis_type):
        """
        Load or retrieve a model for the specified analysis type.
        
        Args:
            analysis_type (str): Type of analysis ('throat' or 'ear')
            
        Returns:
            tf.keras.Model: The loaded model
            
        Raises:
            ValueError: If analysis_type is not supported
        """
        # Check if a valid analysis type was provided
        if analysis_type not in ['throat', 'ear']:
            raise ValueError(f"Unsupported analysis type: {analysis_type}. Must be 'throat' or 'ear'.")
        
        # Check if the model is already loaded
        if analysis_type in cls._models:
            return cls._models[analysis_type]
        
        # Load a new model
        # For this implementation, we'll use ResNet50 pre-trained on ImageNet
        # and add our own classification layers on top
        
        # Load the base model
        base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3))
        
        # Freeze the base model layers
        for layer in base_model.layers:
            layer.trainable = False
            
        # Add custom classification layers
        x = GlobalAveragePooling2D()(base_model.output)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.5)(x)
        
        # The output layer depends on the analysis type
        if analysis_type == 'throat':
            num_classes = len(THROAT_CONDITIONS)
        else:  # ear
            num_classes = len(EAR_CONDITIONS)
            
        predictions = Dense(num_classes, activation='softmax')(x)
        
        # Create and store the model
        model = Model(inputs=base_model.input, outputs=predictions)
        cls._models[analysis_type] = model
        
        return model


def preprocess_image(img_data, target_size=IMG_SIZE):
    """
    Preprocess the image data for model input.
    
    Args:
        img_data (bytes or str): Image data as bytes or base64 string
        target_size (tuple): Target image size (width, height)
        
    Returns:
        numpy.ndarray: Preprocessed image tensor
        
    Raises:
        ValueError: If the image data is invalid
    """
    try:
        # Handle base64 encoded images
        if isinstance(img_data, str) and img_data.startswith('data:image'):
            # Extract the base64 part
            base64_data = re.sub(r'^data:image/[a-zA-Z]+;base64,', '', img_data)
            img_data = base64.b64decode(base64_data)
            
        # Open and preprocess the image
        img = Image.open(io.BytesIO(img_data))
        
        # Resize the image
        img = img.resize(target_size)
        
        # Convert to RGB if not already
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Convert to numpy array and add batch dimension
        img_array = np.array(img)[np.newaxis, ...]
        
        # Preprocess for ResNet50
        img_array = preprocess_input(img_array)
        
        return img_array
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")


def analyze_image(img_data, analysis_type):
    """
    Analyze an image for medical conditions.
    
    Args:
        img_data (bytes or str): Image data as bytes or base64 string
        analysis_type (str): Type of analysis ('throat' or 'ear')
        
    Returns:
        list: Top 3 conditions with names, confidence scores, and additional details
        
    Raises:
        ValueError: If analysis_type is not supported or image is invalid
    """
    # Validate the analysis type
    if analysis_type not in ['throat', 'ear']:
        raise ValueError(f"Unsupported analysis type: {analysis_type}. Must be 'throat' or 'ear'.")
    
    # Load the model
    model = ModelLoader.get_model(analysis_type)
    
    # Preprocess the image
    img_tensor = preprocess_image(img_data)
    
    # Run inference
    predictions = model.predict(img_tensor)
    
    # Get the top 3 conditions with confidence scores
    top_indices = np.argsort(predictions[0])[::-1][:3]
    confidence_scores = predictions[0][top_indices]
    
    # Get the condition definitions
    if analysis_type == 'throat':
        conditions = THROAT_CONDITIONS
    else:  # ear
        conditions = EAR_CONDITIONS
    
    # Create the result
    results = []
    for i, (idx, confidence) in enumerate(zip(top_indices, confidence_scores)):
        if idx < len(conditions):
            condition = conditions[idx].copy()
            condition['confidence'] = float(confidence)
            results.append(condition)
    
    return results


def save_analysis_result(analysis_result, output_path):
    """
    Save the analysis result to a JSON file.
    
    Args:
        analysis_result (dict): The analysis result
        output_path (str): Path to save the JSON file
        
    Returns:
        str: Path of the saved file
    """
    import json
    
    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save the result as JSON
    with open(output_path, 'w') as f:
        json.dump(analysis_result, f, indent=2)
        
    return output_path