#!/usr/bin/env python3
"""
Get Model Registry Script

This script retrieves the model registry information for the Node.js bridge.
"""
import os
import sys
import json

# Add parent directory to path for importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # Import the enhanced model loader
    from enhanced_model_loader import ModelRegistry
    
    # Get the registry
    registry = ModelRegistry()
    
    # Output the registry as JSON
    print(json.dumps(registry.get_registry()))
except Exception as e:
    # Handle import error or other errors
    print(json.dumps({
        "error": str(e),
        "throat": {
            "default_version": "v1",
            "versions": {
                "v1": {"architecture": "resnet50"},
                "v2": {"architecture": "efficientnet"}
            }
        },
        "ear": {
            "default_version": "v1",
            "versions": {
                "v1": {"architecture": "resnet50"},
                "v2": {"architecture": "densenet"}
            }
        }
    }))