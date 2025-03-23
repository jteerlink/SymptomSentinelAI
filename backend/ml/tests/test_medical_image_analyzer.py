"""
Test file for Medical Image Analyzer
"""

import unittest
import os
import sys
import io
import base64
from PIL import Image

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import testing utilities
from unittest.mock import patch, MagicMock

class TestMedicalImageAnalyzer(unittest.TestCase):
    """Test cases for medical image analysis functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create test images directory if it doesn't exist
        os.makedirs(os.path.join(os.path.dirname(__file__), 'test_images'), exist_ok=True)
        
        # Create test images
        self._create_test_images()
        
        # Set up mock models
        self._setup_mock_models()
    
    def _create_test_images(self):
        """Create test images for testing."""
        # Create a test throat image
        self.throat_image_path = os.path.join(os.path.dirname(__file__), 'test_images', 'throat_test.jpg')
        throat_img = Image.new('RGB', (224, 224), color=(255, 150, 150))
        throat_img.save(self.throat_image_path)
        
        # Convert to base64 for API testing
        buffer = io.BytesIO()
        throat_img.save(buffer, format='JPEG')
        self.throat_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # Create a test ear image
        self.ear_image_path = os.path.join(os.path.dirname(__file__), 'test_images', 'ear_test.jpg')
        ear_img = Image.new('RGB', (224, 224), color=(220, 180, 140))
        ear_img.save(self.ear_image_path)
        
        # Convert to base64 for API testing
        buffer = io.BytesIO()
        ear_img.save(buffer, format='JPEG')
        self.ear_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def _setup_mock_models(self):
        """Set up mock TF models for testing."""
        # This will be handled by patching in individual tests
        pass
    
    @patch('ml.image_analyzer.load_model')
    def test_analyze_throat_image(self, mock_load_model):
        """Test throat image analysis functionality."""
        # Import here to allow for patching
        from ml.image_analyzer import analyze_image
        
        # Setup mock model
        mock_model = MagicMock()
        mock_model.predict.return_value = [[0.8, 0.15, 0.05]]  # Mock prediction for 3 conditions
        mock_load_model.return_value = mock_model
        
        # Test with base64 image data
        image_data_url = f"data:image/jpeg;base64,{self.throat_base64}"
        results = analyze_image(image_data_url, 'throat')
        
        # Verify model was loaded correctly
        mock_load_model.assert_called_once_with('throat')
        
        # Verify results
        self.assertIsNotNone(results)
        self.assertIn('conditions', results)
        self.assertEqual(len(results['conditions']), 2)  # Should return top 2 conditions
        
        # Verify first condition has highest confidence
        self.assertGreaterEqual(results['conditions'][0]['confidence'], 
                               results['conditions'][1]['confidence'])
    
    @patch('ml.image_analyzer.load_model')
    def test_analyze_ear_image(self, mock_load_model):
        """Test ear image analysis functionality."""
        # Import here to allow for patching
        from ml.image_analyzer import analyze_image
        
        # Setup mock model
        mock_model = MagicMock()
        mock_model.predict.return_value = [[0.7, 0.2, 0.1]]  # Mock prediction for 3 conditions
        mock_load_model.return_value = mock_model
        
        # Test with base64 image data
        image_data_url = f"data:image/jpeg;base64,{self.ear_base64}"
        results = analyze_image(image_data_url, 'ear')
        
        # Verify model was loaded correctly
        mock_load_model.assert_called_once_with('ear')
        
        # Verify results
        self.assertIsNotNone(results)
        self.assertIn('conditions', results)
        self.assertEqual(len(results['conditions']), 2)  # Should return top 2 conditions
        
        # Verify first condition has highest confidence
        self.assertGreaterEqual(results['conditions'][0]['confidence'], 
                               results['conditions'][1]['confidence'])
    
    @patch('ml.image_analyzer.load_model')
    def test_invalid_image_type(self, mock_load_model):
        """Test handling of invalid image type."""
        # Import here to allow for patching
        from ml.image_analyzer import analyze_image
        
        # Test with invalid type
        with self.assertRaises(ValueError):
            analyze_image(f"data:image/jpeg;base64,{self.throat_base64}", 'invalid_type')
        
        # Verify model was never loaded
        mock_load_model.assert_not_called()
    
    @patch('ml.image_analyzer.load_model')
    def test_empty_image(self, mock_load_model):
        """Test handling of empty image data."""
        # Import here to allow for patching
        from ml.image_analyzer import analyze_image
        
        # Test with empty image data
        with self.assertRaises(ValueError):
            analyze_image('', 'throat')
        
        # Verify model was never loaded
        mock_load_model.assert_not_called()
    
    @patch('ml.image_analyzer.load_model')
    def test_corrupted_image(self, mock_load_model):
        """Test handling of corrupted image data."""
        # Import here to allow for patching
        from ml.image_analyzer import analyze_image
        
        # Test with corrupted image data
        with self.assertRaises(Exception):
            analyze_image('data:image/jpeg;base64,CORRUPTED_DATA', 'throat')
    
    def test_get_conditions(self):
        """Test retrieving condition definitions."""
        # Import here to test the function directly
        from ml.image_analyzer import get_conditions
        
        # Test throat conditions
        throat_conditions = get_conditions('throat')
        self.assertIsNotNone(throat_conditions)
        self.assertGreaterEqual(len(throat_conditions), 1)
        
        # Check condition structure
        condition = throat_conditions[0]
        self.assertIn('id', condition)
        self.assertIn('name', condition)
        self.assertIn('description', condition)
        self.assertIn('symptoms', condition)
        self.assertIn('isPotentiallySerious', condition)
        
        # Test ear conditions
        ear_conditions = get_conditions('ear')
        self.assertIsNotNone(ear_conditions)
        self.assertGreaterEqual(len(ear_conditions), 1)
        
        # Test invalid type
        with self.assertRaises(ValueError):
            get_conditions('invalid_type')
    
    def tearDown(self):
        """Clean up after tests."""
        # Remove test images
        if hasattr(self, 'throat_image_path') and os.path.exists(self.throat_image_path):
            os.remove(self.throat_image_path)
        
        if hasattr(self, 'ear_image_path') and os.path.exists(self.ear_image_path):
            os.remove(self.ear_image_path)

if __name__ == '__main__':
    unittest.main()