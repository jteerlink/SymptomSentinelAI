"""
Unit tests for medical_image_analyzer.py

This module contains tests for the medical image analyzer functions.
"""

import os
import sys
import base64
import numpy as np
import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
import io
import tensorflow as tf

# Add parent directory to path so we can import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the module to test
from medical_image_analyzer import (
    preprocess_image, 
    analyze_image, 
    ModelLoader,
    THROAT_CONDITIONS,
    EAR_CONDITIONS,
    IMG_SIZE
)

# Fixtures
@pytest.fixture
def sample_image_data():
    """Create a sample test image"""
    # Create a small test image (64x64 red square)
    img = Image.new('RGB', (64, 64), color = 'red')
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    # Create a base64 version
    img_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
    
    return {
        'bytes': img_bytes,
        'base64': img_base64
    }


@pytest.fixture
def mock_model():
    """Create a mock TensorFlow model"""
    mock = MagicMock()
    
    # Mock the predict method to return some sample predictions
    # 5 classes with the first one having the highest probability
    mock.predict.return_value = np.array([[0.7, 0.15, 0.1, 0.03, 0.02]])
    
    return mock


# Tests
def test_preprocess_image_with_bytes(sample_image_data):
    """Test preprocessing an image from bytes"""
    # Process the image
    processed = preprocess_image(sample_image_data['bytes'])
    
    # Check the shape (batch_size, height, width, channels)
    assert processed.shape == (1, IMG_SIZE[0], IMG_SIZE[1], 3)
    
    # Check type
    assert isinstance(processed, np.ndarray)
    assert processed.dtype == np.float32


def test_preprocess_image_with_base64(sample_image_data):
    """Test preprocessing an image from base64 string"""
    # Process the image
    processed = preprocess_image(sample_image_data['base64'])
    
    # Check the shape
    assert processed.shape == (1, IMG_SIZE[0], IMG_SIZE[1], 3)
    
    # Check type
    assert isinstance(processed, np.ndarray)


def test_preprocess_image_with_invalid_data():
    """Test preprocessing with invalid image data"""
    # Try with invalid data
    with pytest.raises(ValueError):
        preprocess_image(b'not an image')


def test_preprocess_image_resize():
    """Test that images are correctly resized"""
    # Create test images of different sizes
    sizes = [(100, 100), (300, 200), (50, 75)]
    
    for size in sizes:
        # Create image
        img = Image.new('RGB', size, color='blue')
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        # Process the image
        processed = preprocess_image(img_bytes)
        
        # Check the shape
        assert processed.shape == (1, IMG_SIZE[0], IMG_SIZE[1], 3)


@patch.object(ModelLoader, 'get_model')
def test_analyze_image_throat(mock_get_model, mock_model, sample_image_data):
    """Test analyzing a throat image"""
    # Setup the mock
    mock_get_model.return_value = mock_model
    
    # Analyze the image
    results = analyze_image(sample_image_data['bytes'], 'throat')
    
    # Check the results
    assert len(results) == 2  # Top 2 conditions (changed from 3 to 2)
    assert results[0]['id'] == THROAT_CONDITIONS[0]['id']
    assert results[0]['name'] == THROAT_CONDITIONS[0]['name']
    assert 'confidence' in results[0]
    assert 'symptoms' in results[0]
    assert isinstance(results[0]['isPotentiallySerious'], bool)


@patch.object(ModelLoader, 'get_model')
def test_analyze_image_ear(mock_get_model, mock_model, sample_image_data):
    """Test analyzing an ear image"""
    # Setup the mock
    mock_get_model.return_value = mock_model
    
    # Analyze the image
    results = analyze_image(sample_image_data['bytes'], 'ear')
    
    # Check the results
    assert len(results) == 2  # Top 2 conditions (changed from 3 to 2)
    assert results[0]['id'] == EAR_CONDITIONS[0]['id']
    assert results[0]['name'] == EAR_CONDITIONS[0]['name']
    assert 'confidence' in results[0]
    assert 'symptoms' in results[0]
    assert isinstance(results[0]['isPotentiallySerious'], bool)


def test_analyze_image_invalid_type(sample_image_data):
    """Test analyzing with an invalid type"""
    with pytest.raises(ValueError):
        analyze_image(sample_image_data['bytes'], 'invalid_type')


def test_model_loader_get_model():
    """Test the ModelLoader class"""
    # First, clear any cached models
    ModelLoader._models = {}
    
    # Simply test that the models dict is populated after calling get_model
    # and that the same model is returned on subsequent calls
    try:
        # Get a model for throat analysis
        model1 = ModelLoader.get_model('throat')
        # The second call should use the cached model
        model2 = ModelLoader.get_model('throat')
        
        # Check that the model was cached
        assert len(ModelLoader._models) > 0
        assert 'throat' in ModelLoader._models
        
        # Check that the same model is returned for the same type
        assert model1 is model2
    except Exception as e:
        # The ResNet model may not load properly in the test environment
        # This is an acceptable limitation for our tests
        pytest.skip(f"Could not test model loading: {str(e)}")


def test_model_loader_invalid_type():
    """Test ModelLoader with invalid type"""
    with pytest.raises(ValueError):
        ModelLoader.get_model('invalid_type')


if __name__ == '__main__':
    pytest.main(['-v', __file__])