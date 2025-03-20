#!/usr/bin/env python
"""
Test runner for the medical image analyzer
"""

import os
import sys
import subprocess

def run_tests():
    """Run tests for the medical image analyzer"""
    print("=" * 60)
    print("Running tests for Medical Image Analyzer")
    print("=" * 60)
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Run pytest with verbosity
    try:
        result = subprocess.run(
            ["python", "-m", "pytest", "tests/test_medical_image_analyzer.py", "-v"],
            cwd=script_dir,
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        
        if result.returncode == 0:
            print("\n✅ All tests passed successfully!")
        else:
            print("\n❌ Some tests failed.")
            print(result.stderr)
            
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error running tests: {e}")
        print(e.stderr)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    run_tests()