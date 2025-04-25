#!/usr/bin/env python3
"""
Image Analysis Script

This script analyzes an image using the enhanced image analyzer.
"""
import os
import sys
import json
import argparse
import numpy as np
from PIL import Image

# Add parent directory to path for importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Parse arguments
parser = argparse.ArgumentParser(description='Analyze a medical image')
parser.add_argument('image_path', type=str, help='Path to the image file')
parser.add_argument('--type', type=str, default='throat', help='Analysis type (throat or ear)')
parser.add_argument('--version', type=str, help='Model version to use')
parser.add_argument('--return-attention', action='store_true', help='Return attention map')
parser.add_argument('--multiclass', action='store_true', help='Use multiclass classification (instead of binary)')
args = parser.parse_args()

def save_attention_map(attention_map, output_path):
    """Save attention map as an image."""
    try:
        if attention_map is None:
            print("Warning: Attention map is None, creating blank map", file=sys.stderr)
            # Create a blank attention map
            attention_map = np.zeros((224, 224))
        
        # Ensure attention_map is numpy array
        attention_map = np.array(attention_map)
        
        # Handle potential NaN or inf values
        attention_map = np.nan_to_num(attention_map)
        
        # Check if the attention map is valid (not all zeros)
        if np.allclose(attention_map, 0) or np.allclose(attention_map, attention_map[0,0]):
            print("Warning: Attention map is uniform, might be invalid", file=sys.stderr)
        
        # Ensure attention_map is 2D
        if len(attention_map.shape) != 2:
            print(f"Warning: Reshaping attention map from {attention_map.shape}", file=sys.stderr)
            if len(attention_map.shape) > 2:
                # Take first channel or average
                attention_map = attention_map[:, :, 0] if attention_map.shape[2] > 0 else np.mean(attention_map, axis=-1)
            else:
                # Reshape to 2D square if possible
                size = int(np.sqrt(attention_map.size))
                attention_map = attention_map.reshape((size, size))
        
        # Normalize to [0, 1]
        if np.max(attention_map) > np.min(attention_map):  # Avoid division by zero
            attention_map = (attention_map - np.min(attention_map)) / (np.max(attention_map) - np.min(attention_map))
        
        # Use a better colormap - Jet-like effect (blue to red gradient)
        heatmap = np.uint8(attention_map * 255)
        colored_heatmap = np.zeros((attention_map.shape[0], attention_map.shape[1], 3), dtype=np.uint8)
        
        # Create a colormap similar to 'jet': blue (low) -> green -> red (high)
        colored_heatmap[..., 0] = np.minimum(255, 2 * heatmap)  # Red channel
        colored_heatmap[..., 1] = np.minimum(255, 2 * np.abs(heatmap - 127.5))  # Green channel
        colored_heatmap[..., 2] = np.minimum(255, 2 * (255 - heatmap))  # Blue channel
        
        # Make sure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save the image
        img = Image.fromarray(colored_heatmap)
        img.save(output_path)
        
        print(f"Saved attention map to {output_path}", file=sys.stderr)
        return output_path
        
    except Exception as e:
        print(f"Error saving attention map: {e}", file=sys.stderr)
        try:
            # Create a fallback colored image (red rectangle)
            colored_heatmap = np.zeros((224, 224, 3), dtype=np.uint8)
            colored_heatmap[50:150, 50:150, 0] = 255  # Red rectangle in center
            
            # Make sure the output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save fallback image
            img = Image.fromarray(colored_heatmap)
            img.save(output_path)
            
            print(f"Saved fallback attention map to {output_path}", file=sys.stderr)
            return output_path
        except:
            return None

# Import all necessary modules here at the top level to avoid scope issues
from enhanced_image_analyzer import save_attention_map as enhanced_save_attention_map
from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS

try:
    # Read the image file
    with open(args.image_path, 'rb') as f:
        image_data = f.read()
    
    # Choose the appropriate analysis function based on multiclass flag
    if args.multiclass:
        # Import the enhanced image analyzer for multiclass classification
        from enhanced_image_analyzer import analyze_image as enhanced_analyze_image
        
        # Analyze the image with multiclass classification
        if args.return_attention:
            try:
                # Analyze with attention
                results, attention_map = enhanced_analyze_image(
                    image_data, 
                    args.type, 
                    version=args.version,
                    return_attention=True
                )
                
                # Save attention map to a file near the original image
                attention_path = None
                if attention_map is not None:
                    attention_path = args.image_path + '.attention.png'
                    save_attention_map(attention_map, attention_path)
                
                # Add attention map path to results if available
                if attention_path:
                    for result in results:
                        result['attention_map'] = attention_path
            except Exception as e:
                # Log the error but continue with the results without attention map
                print(f"Error generating attention map: {str(e)}", file=sys.stderr)
                # Get results without attention
                results = enhanced_analyze_image(
                    image_data, 
                    args.type, 
                    version=args.version,
                    return_attention=False
                )
        else:
            # Analyze without attention
            results = enhanced_analyze_image(
                image_data, 
                args.type, 
                version=args.version
            )
    else:
        # Import binary classifier - this is now the default
        from binary_classifier import analyze_image_binary
        
        # Analyze the image with binary classification
        if args.return_attention:
            try:
                # Analyze with attention
                results, attention_map = analyze_image_binary(
                    image_data, 
                    args.type, 
                    version=args.version,
                    return_attention=True
                )
                
                # Save attention map to a file near the original image
                attention_path = None
                if attention_map is not None:
                    attention_path = args.image_path + '.attention.png'
                    save_attention_map(attention_map, attention_path)
                
                # Add attention map path to results if available
                if attention_path:
                    for result in results:
                        result['attention_map'] = attention_path
            except Exception as e:
                # Log the error but continue with the results without attention map
                print(f"Error generating attention map with binary classifier: {str(e)}", file=sys.stderr)
                # Get results without attention
                results = analyze_image_binary(
                    image_data, 
                    args.type, 
                    version=args.version,
                    return_attention=False
                )
        else:
            # Analyze without attention
            results = analyze_image_binary(
                image_data, 
                args.type, 
                version=args.version
            )
    
    # Output the results as JSON
    print(json.dumps({
        "results": results,
        "model_type": args.type,
        "model_version": args.version or "default",
        "classification_mode": "multiclass" if args.multiclass else "binary"
    }))
except Exception as e:
    # In case of error, use binary fallback
    from binary_classifier import BINARY_CONDITIONS
    
    # Output error and fallback results
    print(json.dumps({
        "error": str(e),
        "results": [
            {
                "id": "infected",
                "name": "Abnormal/Infected",
                "description": "Abnormalities detected that may indicate infection or other medical conditions.",
                "confidence": 0.5,
                "recommendationText": "Low confidence prediction due to error.",
                "error_note": "This is a fallback result due to an error"
            }
        ],
        "model_type": args.type,
        "model_version": "error_fallback",
        "classification_mode": "binary"
    }))