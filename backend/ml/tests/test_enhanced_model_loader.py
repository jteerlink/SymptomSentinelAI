"""
Test Enhanced Model Loader

This module contains unit tests for the enhanced model loader functionality.
"""

import os
import sys
import unittest
import tensorflow as tf
import numpy as np
import json
from pathlib import Path

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import modules to test
from enhanced_model_loader import ModelRegistry, get_model, register_custom_model
from enhanced_image_analyzer import analyze_image, preprocess_image

class TestEnhancedModelLoader(unittest.TestCase):
    """Test cases for the enhanced model loader functionality"""
    
    def setUp(self):
        """Set up test environment"""
        # Create a registry instance
        self.registry = ModelRegistry()
        
        # Path to models directory
        self.models_dir = Path(os.path.dirname(os.path.abspath(__file__))).parent / 'models'
        
        # Create test model
        self.test_model = self._create_test_model()
    
    def _create_test_model(self):
        """Create a simple test model"""
        inputs = tf.keras.Input(shape=(224, 224, 3))
        x = tf.keras.layers.Conv2D(16, (3, 3), activation='relu')(inputs)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        outputs = tf.keras.layers.Dense(5, activation='softmax')(x)
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        return model
    
    def test_registry_initialization(self):
        """Test that the registry initializes properly"""
        self.assertIsNotNone(self.registry)
        self.assertIsInstance(self.registry._registry, dict)
        self.assertIsNotNone(self.registry._registry.get('throat'))
        self.assertIsNotNone(self.registry._registry.get('ear'))
    
    def test_register_custom_model(self):
        """Test registering a custom model"""
        # Register a custom model
        result = register_custom_model(
            'throat', 
            self.test_model, 
            'test_v1', 
            'test_architecture'
        )
        
        self.assertTrue(result)
        
        # Check that it was added to the registry
        throat_info = self.registry._registry.get('throat', {})
        self.assertIn('versions', throat_info)
        self.assertIn('test_v1', throat_info['versions'])
        
        # Check model info
        model_info = throat_info['versions']['test_v1']
        self.assertEqual(model_info['architecture'], 'test_architecture')
    
    def test_get_model(self):
        """Test getting a model from the registry"""
        # First, register a model to ensure we have one
        register_custom_model(
            'throat', 
            self.test_model, 
            'test_v2', 
            'test_architecture',
            is_default=True
        )
        
        # Get the model
        model = get_model('throat')
        
        # Check that we got a valid model
        self.assertIsNotNone(model)
        self.assertTrue(hasattr(model, 'predict'))
        
        # Check that we can get a specific version
        specific_model = get_model('throat', version='test_v2')
        self.assertIsNotNone(specific_model)
    
    def test_create_ensemble(self):
        """Test creating an ensemble model"""
        # Register two test models
        register_custom_model(
            'ear', 
            self.test_model, 
            'test_v1', 
            'test_architecture1'
        )
        
        register_custom_model(
            'ear', 
            self.test_model, 
            'test_v2', 
            'test_architecture2'
        )
        
        # Create an ensemble
        self.registry.create_ensemble(
            'ear', 
            'test_ensemble', 
            ['test_v1', 'test_v2'], 
            [0.6, 0.4]
        )
        
        # Check that it was added to the registry
        ear_info = self.registry._registry.get('ear', {})
        self.assertIn('versions', ear_info)
        self.assertIn('test_ensemble', ear_info['versions'])
        
        # Check ensemble info
        ensemble_info = ear_info['versions']['test_ensemble']
        self.assertEqual(ensemble_info['architecture'], 'ensemble')
        self.assertEqual(ensemble_info['members'], ['test_v1', 'test_v2'])
        self.assertEqual(ensemble_info['weights'], [0.6, 0.4])
    
    def test_model_prediction(self):
        """Test that models can make predictions"""
        # Register a test model
        register_custom_model(
            'throat', 
            self.test_model, 
            'test_pred', 
            'test_architecture',
            is_default=True
        )
        
        # Create a dummy input
        dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
        
        # Get the model and make a prediction
        model = get_model('throat')
        prediction = model.predict(dummy_input)
        
        # Check prediction shape and values
        self.assertEqual(prediction.shape, (1, 5))
        self.assertAlmostEqual(np.sum(prediction), 1.0, places=5)
    
    def tearDown(self):
        """Clean up after tests"""
        # Clear the model cache
        self.registry.clear_cache()
        
        # Optionally, remove test models from the registry file
        registry_path = self.registry._registry_path()
        if registry_path.exists():
            try:
                with open(registry_path, 'r') as f:
                    registry_data = json.load(f)
                
                # Remove test models
                for category in ['throat', 'ear']:
                    if category in registry_data and 'versions' in registry_data[category]:
                        versions = registry_data[category]['versions']
                        test_versions = [v for v in versions.keys() if v.startswith('test_')]
                        for v in test_versions:
                            if v in versions:
                                del versions[v]
                
                with open(registry_path, 'w') as f:
                    json.dump(registry_data, f, indent=2)
            
            except Exception as e:
                print(f"Error cleaning up registry: {e}")

if __name__ == '__main__':
    unittest.main()