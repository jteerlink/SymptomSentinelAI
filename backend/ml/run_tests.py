#!/usr/bin/env python3
"""
Comprehensive test suite for the ML components of SymptomSentryAI.

This test script validates:
1. Model loading
2. Image preprocessing
3. Inference functionality
4. Error handling
5. Enhanced model loader functionality
6. Model swapping capabilities
"""

import os
import sys
import unittest
import json
import numpy as np
from PIL import Image
import io
import base64
import tensorflow as tf

# Add parent directory to path for importing from parent modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import ML modules (adjust paths as needed)
try:
    # Original ML modules
    from ml.image_analyzer import preprocess_image, analyze_image, get_conditions
    from ml.model_loader import load_model
    
    # Enhanced ML modules
    from ml.enhanced_model_loader import get_model, ModelRegistry, register_custom_model
    from ml.enhanced_image_analyzer import analyze_image as enhanced_analyze_image
    
    # Import model swap example functions
    from ml.model_swap_example import create_test_image
except ImportError:
    print("Error importing ML modules. Make sure paths are correct.")
    print("This test should be run from the backend directory using: python -m ml.run_tests")
    sys.exit(1)

class TestMedicalImageAnalyzer(unittest.TestCase):
    """Test cases for the medical image analyzer functionality."""
    
    def setUp(self):
        """Set up test environment."""
        # Create test image data
        self.create_test_images()
        
    def create_test_images(self):
        """Create test images for throats and ears."""
        # Create a simple throat test image (red with white spots)
        throat_img = Image.new('RGB', (224, 224), color=(255, 102, 102))
        draw = Image.new('RGB', (224, 224), color=(255, 102, 102))
        # Save as both file and keep in memory
        throat_img.save('./ml/tests/test_throat.jpg')
        buffer = io.BytesIO()
        throat_img.save(buffer, format='JPEG')
        self.throat_img_data = buffer.getvalue()
        self.throat_img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Create an ear test image (different color profile)
        ear_img = Image.new('RGB', (224, 224), color=(200, 170, 130))
        ear_img.save('./ml/tests/test_ear.jpg')
        buffer = io.BytesIO()
        ear_img.save(buffer, format='JPEG')
        self.ear_img_data = buffer.getvalue()
        self.ear_img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def test_model_loading(self):
        """Test model loading for both throat and ear models."""
        # Test throat model loading
        try:
            throat_model = load_model('throat')
            self.assertIsNotNone(throat_model, "Throat model should be loaded")
        except Exception as e:
            self.fail(f"Loading throat model raised exception: {str(e)}")
            
        # Test ear model loading
        try:
            ear_model = load_model('ear')
            self.assertIsNotNone(ear_model, "Ear model should be loaded")
        except Exception as e:
            self.fail(f"Loading ear model raised exception: {str(e)}")
    
    def test_image_preprocessing(self):
        """Test image preprocessing functionality."""
        # Test preprocessing with raw image data
        try:
            # Preprocess throat image
            throat_tensor = preprocess_image(self.throat_img_data)
            self.assertIsNotNone(throat_tensor, "Preprocessed throat image tensor should not be None")
            self.assertEqual(throat_tensor.shape[-3:], (224, 224, 3), 
                            "Preprocessed image should have shape (224, 224, 3)")
            
            # Preprocess ear image
            ear_tensor = preprocess_image(self.ear_img_data)
            self.assertIsNotNone(ear_tensor, "Preprocessed ear image tensor should not be None")
            self.assertEqual(ear_tensor.shape[-3:], (224, 224, 3), 
                            "Preprocessed image should have shape (224, 224, 3)")
        except Exception as e:
            self.fail(f"Image preprocessing raised exception: {str(e)}")
    
    def test_analyze_throat_image(self):
        """Test throat image analysis."""
        try:
            # Create base64 image data string
            img_data_url = f"data:image/jpeg;base64,{self.throat_img_base64}"
            
            # Analyze the image
            results = analyze_image(img_data_url, 'throat')
            
            # Validate results structure
            self.assertIsNotNone(results, "Analysis results should not be None")
            self.assertIn('conditions', results, "Results should contain 'conditions' key")
            self.assertGreaterEqual(len(results['conditions']), 1, 
                                   "Should have at least one condition in results")
            
            # Check first condition structure
            condition = results['conditions'][0]
            self.assertIn('id', condition, "Condition should have an ID")
            self.assertIn('name', condition, "Condition should have a name")
            self.assertIn('confidence', condition, "Condition should have a confidence score")
            self.assertGreaterEqual(condition['confidence'], 0, "Confidence should be >= 0")
            self.assertLessEqual(condition['confidence'], 1, "Confidence should be <= 1")
        except Exception as e:
            self.fail(f"Analyzing throat image raised exception: {str(e)}")
    
    def test_analyze_ear_image(self):
        """Test ear image analysis."""
        try:
            # Create base64 image data string
            img_data_url = f"data:image/jpeg;base64,{self.ear_img_base64}"
            
            # Analyze the image
            results = analyze_image(img_data_url, 'ear')
            
            # Validate results structure
            self.assertIsNotNone(results, "Analysis results should not be None")
            self.assertIn('conditions', results, "Results should contain 'conditions' key")
            self.assertGreaterEqual(len(results['conditions']), 1, 
                                   "Should have at least one condition in results")
            
            # Check first condition structure
            condition = results['conditions'][0]
            self.assertIn('id', condition, "Condition should have an ID")
            self.assertIn('name', condition, "Condition should have a name")
            self.assertIn('confidence', condition, "Condition should have a confidence score")
            self.assertGreaterEqual(condition['confidence'], 0, "Confidence should be >= 0")
            self.assertLessEqual(condition['confidence'], 1, "Confidence should be <= 1")
        except Exception as e:
            self.fail(f"Analyzing ear image raised exception: {str(e)}")
    
    def test_invalid_image_type(self):
        """Test handling of invalid image type."""
        try:
            # Create base64 image data string
            img_data_url = f"data:image/jpeg;base64,{self.throat_img_base64}"
            
            # Try to analyze with invalid type
            with self.assertRaises(ValueError):
                analyze_image(img_data_url, 'invalid_type')
        except Exception as e:
            self.fail(f"Invalid image type test raised unexpected exception: {str(e)}")
    
    def test_empty_image(self):
        """Test handling of empty image data."""
        try:
            # Try to analyze with empty image
            with self.assertRaises(ValueError):
                analyze_image('', 'throat')
        except Exception as e:
            self.fail(f"Empty image test raised unexpected exception: {str(e)}")
    
    def test_corrupted_image(self):
        """Test handling of corrupted image data."""
        try:
            # Create corrupted base64 data
            corrupted_data = "data:image/jpeg;base64,CORRUPTED_DATA"
            
            # This should not raise an unhandled exception, but instead return an error or raise a specific exception
            with self.assertRaises(Exception):
                analyze_image(corrupted_data, 'throat')
        except Exception as e:
            self.fail(f"Corrupted image test raised unexpected exception: {str(e)}")
    
    def test_get_conditions(self):
        """Test getting condition definitions."""
        # Test throat conditions
        throat_conditions = get_conditions('throat')
        self.assertIsNotNone(throat_conditions, "Throat conditions should not be None")
        self.assertGreaterEqual(len(throat_conditions), 1, 
                               "Should have at least one throat condition")
        
        # Test ear conditions
        ear_conditions = get_conditions('ear')
        self.assertIsNotNone(ear_conditions, "Ear conditions should not be None")
        self.assertGreaterEqual(len(ear_conditions), 1, 
                               "Should have at least one ear condition")
        
        # Test invalid condition type
        with self.assertRaises(ValueError):
            get_conditions('invalid_type')
    
    def tearDown(self):
        """Clean up test environment."""
        # Remove test files
        try:
            os.remove('./ml/tests/test_throat.jpg')
            os.remove('./ml/tests/test_ear.jpg')
        except:
            pass

class TestEnhancedModelLoader(unittest.TestCase):
    """Test cases for the enhanced model loader functionality."""
    
    def setUp(self):
        """Set up test environment."""
        # Create a registry instance
        self.registry = ModelRegistry()
        
        # Create test images
        self.test_image = create_test_image()
        
        # Create test model
        self.test_model = self._create_test_model(5)  # 5 output classes
    
    def _create_test_model(self, num_classes):
        """Create a simple test model"""
        inputs = tf.keras.Input(shape=(224, 224, 3))
        x = tf.keras.layers.Conv2D(16, (3, 3), activation='relu')(inputs)
        x = tf.keras.layers.GlobalAveragePooling2D()(x)
        outputs = tf.keras.layers.Dense(num_classes, activation='softmax')(x)
        model = tf.keras.Model(inputs=inputs, outputs=outputs)
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        return model
    
    def test_model_registry_initialization(self):
        """Test that the model registry initializes properly."""
        # Check registry
        self.assertIsNotNone(self.registry)
        self.assertIsInstance(self.registry._registry, dict)
        
        # Check throat and ear categories
        self.assertIn('throat', self.registry._registry)
        self.assertIn('ear', self.registry._registry)
        
        # Check default models
        self.assertIn('default_version', self.registry._registry['throat'])
        self.assertIn('default_version', self.registry._registry['ear'])
    
    def test_register_custom_model(self):
        """Test registering a custom model."""
        # Register a custom model
        result = register_custom_model(
            'throat',
            self.test_model,
            'test_version',
            'test_architecture'
        )
        
        # Check that it worked
        self.assertTrue(result)
        
        # Check that it was added to the registry
        throat_versions = self.registry._registry['throat']['versions']
        self.assertIn('test_version', throat_versions)
        self.assertEqual(throat_versions['test_version']['architecture'], 'test_architecture')
    
    def test_get_model(self):
        """Test getting a model from the registry."""
        # First register a model
        register_custom_model(
            'throat',
            self.test_model,
            'test_get',
            'test_architecture'
        )
        
        # Get the model
        model = get_model('throat', version='test_get')
        
        # Check that we got a valid model
        self.assertIsNotNone(model)
        self.assertTrue(hasattr(model, 'predict'))
    
    def test_enhanced_image_analysis(self):
        """Test enhanced image analysis."""
        try:
            # Register a test model
            register_custom_model(
                'throat',
                self.test_model,
                'test_analysis',
                'test_architecture',
                is_default=True
            )
            
            # Analyze an image with the enhanced analyzer
            results = enhanced_analyze_image(self.test_image, 'throat')
            
            # Check results
            self.assertIsNotNone(results)
            self.assertTrue(isinstance(results, list))
            self.assertGreaterEqual(len(results), 1)
            
            # Check first result
            first_result = results[0]
            self.assertIn('name', first_result)
            self.assertIn('confidence', first_result)
            self.assertGreaterEqual(first_result['confidence'], 0)
            self.assertLessEqual(first_result['confidence'], 1)
        
        except Exception as e:
            self.fail(f"Enhanced image analysis raised exception: {str(e)}")
    
    def test_create_ensemble(self):
        """Test creating an ensemble model."""
        # Register two test models
        register_custom_model(
            'ear',
            self.test_model,
            'ensemble_member1',
            'test_architecture1'
        )
        
        register_custom_model(
            'ear',
            self.test_model,
            'ensemble_member2',
            'test_architecture2'
        )
        
        # Create an ensemble
        self.registry.create_ensemble(
            'ear',
            'test_ensemble',
            ['ensemble_member1', 'ensemble_member2'],
            [0.6, 0.4]
        )
        
        # Check that the ensemble was created
        ear_versions = self.registry._registry['ear']['versions']
        self.assertIn('test_ensemble', ear_versions)
        
        # Check ensemble properties
        ensemble_info = ear_versions['test_ensemble']
        self.assertEqual(ensemble_info['architecture'], 'ensemble')
        self.assertEqual(ensemble_info['members'], ['ensemble_member1', 'ensemble_member2'])
        self.assertEqual(ensemble_info['weights'], [0.6, 0.4])
    
    def tearDown(self):
        """Clean up after tests."""
        # Clear model cache
        self.registry.clear_cache()
        
        # Remove test models from registry
        for category in ['throat', 'ear']:
            if category in self.registry._registry and 'versions' in self.registry._registry[category]:
                versions = self.registry._registry[category]['versions']
                versions_to_remove = [v for v in list(versions.keys()) if v.startswith('test_') or v.startswith('ensemble_')]
                for v in versions_to_remove:
                    if v in versions:
                        del versions[v]
        
        # Save cleaned registry
        self.registry._save_registry()


if __name__ == '__main__':
    # Create test directory if it doesn't exist
    os.makedirs('./ml/tests', exist_ok=True)
    
    # Run the tests
    unittest.main()