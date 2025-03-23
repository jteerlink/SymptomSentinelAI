#!/usr/bin/env python3
"""
Comprehensive test suite for the ML components of SymptomSentryAI.

This test script validates:
1. Model loading
2. Image preprocessing
3. Inference functionality
4. Error handling
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
    from ml.image_analyzer import preprocess_image, analyze_image, get_conditions
    from ml.model_loader import load_model
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

if __name__ == '__main__':
    # Create test directory if it doesn't exist
    os.makedirs('./ml/tests', exist_ok=True)
    
    # Run the tests
    unittest.main()