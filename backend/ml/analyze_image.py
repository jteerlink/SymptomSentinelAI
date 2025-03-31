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
args = parser.parse_args()

def save_attention_map(attention_map, output_path):
    """Save attention map as an image."""
    if attention_map is None:
        return None
    
    # Normalize to [0, 1]
    if np.min(attention_map) < 0 or np.max(attention_map) > 1:
        attention_map = (attention_map - np.min(attention_map)) / (np.max(attention_map) - np.min(attention_map))
    
    # Convert to heatmap (RED is high attention)
    heatmap = np.uint8(attention_map * 255)
    
    # Create colored heatmap
    colored_heatmap = np.zeros((attention_map.shape[0], attention_map.shape[1], 3), dtype=np.uint8)
    colored_heatmap[..., 0] = heatmap  # Red channel
    
    # Save the image
    img = Image.fromarray(colored_heatmap)
    img.save(output_path)
    
    return output_path

try:
    # Import the enhanced image analyzer
    from enhanced_image_analyzer import analyze_image, save_attention_map
    from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS
    
    # Read the image file
    with open(args.image_path, 'rb') as f:
        image_data = f.read()
    
    # Analyze the image
    if args.return_attention:
        try:
            # Analyze with attention
            results, attention_map = analyze_image(
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
            results = analyze_image(
                image_data, 
                args.type, 
                version=args.version,
                return_attention=False
            )
    else:
        # Analyze without attention
        results = analyze_image(
            image_data, 
            args.type, 
            version=args.version
        )
    
    # Output the results as JSON
    print(json.dumps({
        "results": results,
        "model_type": args.type,
        "model_version": args.version or "default"
    }))
except Exception as e:
    # In case of error, return default values
    conditions = THROAT_CONDITIONS if args.type == 'throat' else EAR_CONDITIONS
    
    # Output error and fallback results
    print(json.dumps({
        "error": str(e),
        "results": [
            {
                "id": condition["id"],
                "name": condition["name"],
                "confidence": 0.75 - (i * 0.1),
                "description": condition.get("description", "No description available"),
                "error_note": "This is a fallback result due to an error"
            }
            for i, condition in enumerate(conditions[:2])
        ],
        "model_type": args.type,
        "model_version": "error_fallback"
    }))