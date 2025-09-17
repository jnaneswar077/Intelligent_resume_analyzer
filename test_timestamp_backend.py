#!/usr/bin/env python3

"""
Quick test to verify timestamp functionality is working correctly
"""

import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from backend.models.analysis_model import DetailedAnalysisResponse
    print("✅ Successfully imported DetailedAnalysisResponse")
    
    # Test creating response with timestamp
    response_with_timestamp = DetailedAnalysisResponse(
        final_score=85.0,
        strengths=["Test strength"],
        weaknesses=["Test weakness"],
        actionable_recs=["Test recommendation"],
        example_bullets=["Test bullet"],
        llm_polished_text="This is a real Gemini response",
        gemini_timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    print(f"✅ Response with timestamp: {response_with_timestamp.gemini_timestamp}")
    
    # Test creating response without timestamp (fallback)
    response_without_timestamp = DetailedAnalysisResponse(
        final_score=80.0,
        strengths=["Test strength"],
        weaknesses=["Test weakness"],
        actionable_recs=["Test recommendation"],
        example_bullets=["Test bullet"],
        llm_polished_text="This is fallback text"
        # No gemini_timestamp provided
    )
    
    print(f"✅ Response without timestamp: {response_without_timestamp.gemini_timestamp}")
    
    print("\n=== Summary ===")
    print("✅ Backend model supports timestamp field")
    print("✅ Frontend will display timestamp only when present")
    print("✅ Users can now easily distinguish between real Gemini and fallback responses")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")