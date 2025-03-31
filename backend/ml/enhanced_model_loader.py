"""
Enhanced Model Loader

This module provides an advanced model loading system with support for:
1. Multiple model architectures
2. Model versioning and swapping
3. Ensemble predictions
4. Custom preprocessing pipelines

Usage:
    from enhanced_model_loader import ModelRegistry, get_model
    
    # Get the default model for throat analysis
    model = get_model('throat')
    
    # Get a specific model version
    model = get_model('throat', version='v2')
    
    # Get an ensemble model
    model = get_model('throat', model_type='ensemble')
"""

import os
import json
import time
import numpy as np
import tensorflow as tf
from pathlib import Path
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import ResNet50, EfficientNetB0, MobileNetV2, DenseNet121
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout, Input
from tensorflow.keras.models import Model

# Constants
MODEL_REGISTRY_FILE = 'model_registry.json'
DEFAULT_IMG_SIZE = (224, 224)

class ModelRegistry:
    """
    Singleton registry for model management with dynamic model loading, 
    versioning and ensemble capabilities.
    """
    _instance = None
    _models = {}
    _registry = {}
    _default_models = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the model registry"""
        self._models = {}
        self._load_registry()
    
    def _registry_path(self):
        """Get the path to the registry file"""
        models_dir = Path(os.path.dirname(os.path.abspath(__file__))) / 'models'
        models_dir.mkdir(exist_ok=True)
        return models_dir / MODEL_REGISTRY_FILE
    
    def _load_registry(self):
        """Load the model registry from file"""
        registry_path = self._registry_path()
        if registry_path.exists():
            try:
                with open(registry_path, 'r') as f:
                    self._registry = json.load(f)
                
                # Set default models
                self._default_models = {
                    category: info['default_version'] 
                    for category, info in self._registry.items() 
                    if 'default_version' in info
                }
            except Exception as e:
                print(f"Error loading model registry: {e}")
                self._create_default_registry()
        else:
            self._create_default_registry()
    
    def _save_registry(self):
        """Save the model registry to file"""
        registry_path = self._registry_path()
        with open(registry_path, 'w') as f:
            json.dump(self._registry, f, indent=2)
    
    def get_registry(self):
        """Get the current model registry
        
        Returns:
            dict: The current model registry
        """
        formatted_registry = {}
        
        # Format registry for the Node.js bridge
        for category, data in self._registry.items():
            formatted_registry[category] = {
                'defaultVersion': data['default_version'],
                'versions': list(data['versions'].keys()),
                'details': data['versions']
            }
        
        return formatted_registry
    
    def _create_default_registry(self):
        """Create a default registry if none exists"""
        self._registry = {
            'throat': {
                'versions': {
                    'v1': {
                        'architecture': 'resnet50',
                        'path': 'throat_model_resnet50_v1',
                        'preprocessing': 'standard',
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'v2': {
                        'architecture': 'efficientnet',
                        'path': 'throat_model_efficientnet_v2',
                        'preprocessing': 'standard',
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'ensemble': {
                        'architecture': 'ensemble',
                        'members': ['v1', 'v2'],
                        'weights': [0.5, 0.5],
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                },
                'default_version': 'v1'
            },
            'ear': {
                'versions': {
                    'v1': {
                        'architecture': 'resnet50',
                        'path': 'ear_model_resnet50_v1',
                        'preprocessing': 'standard',
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'v2': {
                        'architecture': 'densenet',
                        'path': 'ear_model_densenet_v2',
                        'preprocessing': 'standard',
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    },
                    'ensemble': {
                        'architecture': 'ensemble',
                        'members': ['v1', 'v2'],
                        'weights': [0.5, 0.5],
                        'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
                    }
                },
                'default_version': 'v1'
            }
        }
        self._default_models = {
            'throat': 'v1',
            'ear': 'v1'
        }
        self._save_registry()
    
    def get_model(self, category, version=None, model_type=None):
        """
        Get a model from the registry
        
        Args:
            category (str): Model category ('throat' or 'ear')
            version (str, optional): Specific model version
            model_type (str, optional): Model type (e.g., 'ensemble')
            
        Returns:
            Model object that has a predict method
        """
        # Determine which version to use
        if model_type == 'ensemble':
            version = 'ensemble'
        elif version is None:
            version = self._default_models.get(category, 'v1')
        
        # Check if this model is in the registry
        if (category not in self._registry or 
            'versions' not in self._registry[category] or 
            version not in self._registry[category]['versions']):
            raise ValueError(f"Model {category}/{version} not found in registry")
        
        # Create cache key
        cache_key = f"{category}_{version}"
        
        # Return cached model if available
        if cache_key in self._models:
            return self._models[cache_key]
        
        # Get model info
        model_info = self._registry[category]['versions'][version]
        
        # Handle ensemble models
        if model_info['architecture'] == 'ensemble':
            model = self._load_ensemble_model(category, model_info)
        else:
            model = self._load_single_model(category, model_info)
        
        # Cache the model
        self._models[cache_key] = model
        return model
    
    def _load_single_model(self, category, model_info):
        """Load a single model based on model info"""
        models_dir = Path(os.path.dirname(os.path.abspath(__file__))) / 'models'
        model_path = models_dir / model_info['path']
        
        # If the model exists, load it
        if model_path.exists():
            try:
                return tf.keras.models.load_model(model_path)
            except Exception as e:
                print(f"Error loading model from {model_path}: {e}")
                # Fall back to creating a new model
        
        # Create a new model if it doesn't exist
        print(f"Creating new model for {category} with architecture {model_info['architecture']}")
        
        # Determine number of classes based on category
        if category == 'throat':
            from medical_image_analyzer import THROAT_CONDITIONS
            num_classes = len(THROAT_CONDITIONS)
        else:  # ear
            from medical_image_analyzer import EAR_CONDITIONS
            num_classes = len(EAR_CONDITIONS)
        
        # Create model based on architecture
        model = self._create_model(model_info['architecture'], num_classes)
        
        # Save the model
        model_path.parent.mkdir(exist_ok=True)
        model.save(model_path)
        
        return model
    
    def _load_ensemble_model(self, category, model_info):
        """Load an ensemble model"""
        # Check if members and weights are defined
        if 'members' not in model_info or 'weights' not in model_info:
            raise ValueError("Ensemble model must define members and weights")
        
        members = model_info['members']
        weights = model_info['weights']
        
        if len(members) != len(weights):
            raise ValueError("Number of members and weights must match")
        
        # Load member models
        member_models = []
        for member_version in members:
            if member_version == 'ensemble':
                continue  # Avoid recursive ensemble loading
            
            # Get model info for this member
            member_info = self._registry[category]['versions'].get(member_version)
            if not member_info:
                continue
                
            # Load the member model
            member_model = self._load_single_model(category, member_info)
            member_models.append((member_model, member_info))
        
        # Create an ensemble wrapper
        return EnsembleModel(member_models, weights)
    
    def _create_model(self, architecture, num_classes):
        """Create a model with the specified architecture"""
        # Input shape for all models
        input_shape = (*DEFAULT_IMG_SIZE, 3)
        
        # Create base model based on architecture
        if architecture == 'resnet50':
            base_model = ResNet50(weights='imagenet', include_top=False, input_shape=input_shape)
        elif architecture == 'efficientnet':
            base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=input_shape)
        elif architecture == 'mobilenet':
            base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=input_shape)
        elif architecture == 'densenet':
            base_model = DenseNet121(weights='imagenet', include_top=False, input_shape=input_shape)
        else:
            # Default to ResNet50
            base_model = ResNet50(weights='imagenet', include_top=False, input_shape=input_shape)
        
        # Freeze the base model layers
        for layer in base_model.layers:
            layer.trainable = False
        
        # Add custom classification layers
        x = GlobalAveragePooling2D()(base_model.output)
        x = Dense(256, activation='relu')(x)
        x = Dropout(0.5)(x)
        predictions = Dense(num_classes, activation='softmax')(x)
        
        # Create and compile the model
        model = Model(inputs=base_model.input, outputs=predictions)
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def register_model(self, category, version, model_path, architecture, 
                      is_default=False, preprocessing='standard'):
        """
        Register a new model in the registry
        
        Args:
            category (str): Model category ('throat' or 'ear')
            version (str): Model version
            model_path (str): Path to the model file
            architecture (str): Model architecture
            is_default (bool): Whether this should be the default model
            preprocessing (str): Preprocessing method for this model
        """
        # Ensure category exists in registry
        if category not in self._registry:
            self._registry[category] = {'versions': {}}
        
        # Add model to registry
        self._registry[category]['versions'][version] = {
            'architecture': architecture,
            'path': model_path,
            'preprocessing': preprocessing,
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Set as default if requested
        if is_default:
            self._registry[category]['default_version'] = version
            self._default_models[category] = version
        
        # Save registry
        self._save_registry()
        
        # Clear cache for this category
        keys_to_remove = [k for k in self._models.keys() if k.startswith(f"{category}_")]
        for key in keys_to_remove:
            del self._models[key]
    
    def set_default_model(self, category, version):
        """
        Set the default model version for a category
        
        Args:
            category (str): Model category
            version (str): Model version to set as default
        """
        if (category in self._registry and 
            'versions' in self._registry[category] and 
            version in self._registry[category]['versions']):
            
            self._registry[category]['default_version'] = version
            self._default_models[category] = version
            self._save_registry()
        else:
            raise ValueError(f"Model {category}/{version} not found in registry")
    
    def create_ensemble(self, category, ensemble_name, member_versions, weights=None):
        """
        Create an ensemble model from multiple versions
        
        Args:
            category (str): Model category
            ensemble_name (str): Name for the ensemble
            member_versions (list): List of model versions to include
            weights (list, optional): Weights for each member (default: equal weights)
        """
        if category not in self._registry:
            raise ValueError(f"Category {category} not found in registry")
        
        # Verify all member versions exist
        for version in member_versions:
            if version not in self._registry[category]['versions']:
                raise ValueError(f"Model version {version} not found in registry")
        
        # Set default weights if not provided
        if weights is None:
            weights = [1.0 / len(member_versions)] * len(member_versions)
        
        # Ensure weights sum to 1
        weights = [w / sum(weights) for w in weights]
        
        # Register ensemble model
        self._registry[category]['versions'][ensemble_name] = {
            'architecture': 'ensemble',
            'members': member_versions,
            'weights': weights,
            'created_at': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Save registry
        self._save_registry()
    
    def clear_cache(self):
        """Clear the model cache"""
        self._models = {}


class EnsembleModel:
    """
    Wrapper for ensemble models that combines predictions from multiple models
    """
    def __init__(self, members, weights):
        """
        Initialize ensemble model
        
        Args:
            members (list): List of (model, model_info) tuples
            weights (list): Weight for each member model
        """
        self.members = [m[0] for m in members]
        self.model_infos = [m[1] for m in members]
        
        # Normalize weights to sum to 1
        total = sum(weights)
        self.weights = [w / total for w in weights]
    
    def predict(self, x):
        """
        Make predictions with the ensemble
        
        Args:
            x: Input data
            
        Returns:
            Combined predictions
        """
        # Get predictions from each member
        predictions = []
        for i, model in enumerate(self.members):
            # Apply appropriate preprocessing if needed
            pred = model.predict(x)
            predictions.append(pred)
        
        # Combine predictions with weights
        weighted_preds = []
        for i, pred in enumerate(predictions):
            weighted_preds.append(pred * self.weights[i])
        
        # Sum the weighted predictions
        ensemble_pred = np.zeros_like(predictions[0])
        for pred in weighted_preds:
            ensemble_pred += pred
        
        return ensemble_pred


# Global convenience functions
def get_model(category, version=None, model_type=None):
    """
    Get a model for the specified category and version
    
    Args:
        category (str): Model category ('throat' or 'ear')
        version (str, optional): Specific model version
        model_type (str, optional): Model type (e.g., 'ensemble')
        
    Returns:
        A model object with a predict method
    """
    registry = ModelRegistry()
    return registry.get_model(category, version, model_type)


def register_custom_model(category, model, version, architecture, is_default=False):
    """
    Register a custom model in the registry
    
    Args:
        category (str): Model category ('throat' or 'ear')
        model: The model object to register
        version (str): Version identifier
        architecture (str): Architecture description
        is_default (bool): Set as default model
    """
    # Save the model
    models_dir = Path(os.path.dirname(os.path.abspath(__file__))) / 'models'
    models_dir.mkdir(exist_ok=True)
    model_path = f"{category}_model_{architecture}_{version}"
    full_path = models_dir / model_path
    
    # Save model
    model.save(full_path)
    
    # Register in registry
    registry = ModelRegistry()
    registry.register_model(
        category, 
        version, 
        model_path, 
        architecture, 
        is_default=is_default
    )
    
    return True